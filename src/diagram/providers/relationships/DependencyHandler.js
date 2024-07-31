import { createElementUpdate } from '../../../umlUtil';
import { randomID } from 'uml-client/lib/types/element';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default class DependencyHandler extends RuleProvider {
    
    constructor(eventBus, commandStack, umlWebClient, diagramEmitter, diagramContext) {
        super(eventBus);

        eventBus.on('connect.end', 1100, (event) => {
            if (event.context.start.connectType === 'dependency' || event.connectType === 'dependency') {
                commandStack.execute('edge.connect', {
                    connectionData: {
                        id: randomID(),
                        modelElement: {
                            id: randomID(),
                            elementType() {
                                'Dependency'
                            }
                        },
                        createModelElement: true,
                        source: event.context.start,
                        target: event.hover,
                        children: [],
                    },
                    connectType: 'dependency',
                    children: [],
                });
                return false; // stop propogation
            }
        });
        eventBus.on('edge.connect.create', (context) => {
            if (context.connectType === 'Dependency') {
                const client = context.connection.source.modelElement,
                supplier = context.connection.target.modelElement;
                const dependency = umlWebClient.post('Dependency', {id:context.connection.modelElement.id});
                context.connection.modelElement = dependency;
                dependency.clients.add(client);
                dependency.suppliers.add(supplier);
                diagramContext.context.packagedElements.add(dependency);
                umlWebClient.put(dependency);
                umlWebClient.put(client);
                umlWebClient.put(diagramContext.context);
                diagramEmitter.fire('elementUpdate', createElementUpdate(client));
                diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context));            
            }
        });
        eventBus.on('edge.connect.undo', (context) => {
            const deleteModelElement = async () => {
                const connection = context.connection;
                const owner = await connection.modelElement.owner.get();
                await umlWebClient.deleteElement(connection.modelElement);
                diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
            }
            if (context.connectType === 'dependency') {
                deleteModelElement(); 
            }
        });
        eventBus.on('dependency.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'dependency';
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

DependencyHandler.$inject = ['eventBus', 'commandStack', 'umlWebClient', 'diagramEmitter', 'diagramContext'];

function canConnect(context) {
    const ret = canConnectHelper(context);
    context.canExecute = ret;
    return ret;
}

function canConnectHelper(context) {
    if (context.source && !context.source.connectType) {
        return true;
    }
    if (context.source && context.source.connectType === 'dependency') {
        if (!context.source.modelElement) {
            return false;
        }
        if (!context.source.modelElement.is('NamedElement')) { 
            return false;
        }
        if (context.target) {
            if (!context.target.modelElement) {
                return false;
            }
            if (!context.target.modelElement.is('NamedElement')) {
                return false;
            }
        }
        return true;
    }
} 
