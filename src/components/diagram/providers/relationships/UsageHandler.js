import { createElementUpdate } from '../../../../umlUtil';
import { randomID } from 'uml-client/lib/element';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default class UsageHandler extends RuleProvider {
    
    constructor(eventBus, commandStack, umlWebClient, diagramEmitter, diagramContext) {
        super(eventBus);

        eventBus.on('connect.end', 1100, (event) => {
            if (event.context.start.connectType === 'usage' || event.connectType === 'usage') {
                event.connectionID = randomID();
                event.modelElementID = randomID();
                event.context.type = 'usage';
                commandStack.execute('edgeCreate', event);
                return false; // stop propogation
            }
        });
        eventBus.on('edgeCreate', (context) => {
            const createUsage = async () => {
                const usage = context.context.connection.modelElement;
                const client = await umlWebClient.get(context.context.start.modelElement.id);
                usage.clients.add(client);
                usage.suppliers.add(context.hover.modelElement.id);
                diagramContext.context.packagedElements.add(usage);
                umlWebClient.put(usage);
                umlWebClient.put(client);
                umlWebClient.put(diagramContext.context);
                diagramEmitter.fire('elementUpdate', createElementUpdate(client));
                diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context));
            }
            if (context.context.type === 'usage') {
                createUsage();
            }
        });
        eventBus.on('edgeCreateUndo', (context) => {
            const deleteModelElement = async () => {
                const owner = await context.context.connection.modelElement.owner.get();
                await umlWebClient.deleteElement(context.context.connection.modelElement);
                diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
            }
            if (context.context.type === 'usage') {
                deleteModelElement(); 
            }
        });
        eventBus.on('usage.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'usage';
            });
        });
    }

    

    init() {
        this.addRule('connection.start', (context) => {
           return canConnect(context);
        });

        this.addRule('connection.create', (context) => {
            return canConnect(context);
        });
        this.addRule('connection.reconnect', (context) => {
            return canConnect(context);
        });
    }
}

UsageHandler.$inject = ['eventBus', 'commandStack', 'umlWebClient', 'diagramEmitter', 'diagramContext'];

function canConnect(context) {
    const ret = canConnectHelper(context);
    context.canExecute = ret;
    return ret;
}

function canConnectHelper(context) {
    if (context.source && !context.source.connectType) {
        return true;
    }
    if (context.source && context.source.connectType === 'usage') {
        if (!context.source.modelElement) {
            return false;
        }
        if (!context.source.modelElement.isSubClassOf('namedElement')) { 
            return false;
        }
        if (context.target) {
            if (!context.target.modelElement) {
                return false;
            }
            if (!context.target.modelElement.isSubClassOf('namedElement')) {
                return false;
            }
        }
        return true;
    }
    return false;
}