import { createElementUpdate } from '../../../umlUtil';
import { randomID } from 'uml-client/lib/element';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default class GeneralizationHandler extends RuleProvider {
    
    constructor(eventBus, commandStack, umlWebClient, diagramEmitter) {
        super(eventBus);
        eventBus.on('connect.end', (event) => {
            if (event.context.start.connectType === 'generalization' || event.connectType === 'generalization') {
                commandStack.execute('edge.connect', {
                    connectionData: {
                        id: randomID(),
                        modelElement: {
                            id: randomID(),
                            elementType() {
                                'generalization'
                            }
                        },
                        createModelElement: true,
                        source: event.context.start,
                        target: event.hover,
                        children: [],
                    },
                    connectType: 'generalization',
                    children: [],
                });
                return false; // stop propogation
            }
        });
        eventBus.on('edge.connect.create', (context) => {
            if (context.connectType === 'generalization') {
                const specific = context.connection.source.modelElement,
                general = context.connection.target.modelElement;
                const generalization = umlWebClient.post('generalization', {id: context.connection.modelElement.id});
                context.connection.modelElement = generalization;
                specific.generalizations.add(generalization);
                generalization.general.set(general);
                umlWebClient.put(generalization);
                umlWebClient.put(specific);
                diagramEmitter.fire('elementUpdate', createElementUpdate(specific));         
            }
        });
        eventBus.on('edgeCreateUndo', (context) => {
            const deleteModelElement = async () => {
                const owner = context.connection.source.modelElement;
                await umlWebClient.deleteElement(context.context.connection.modelElement);
                diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
            }
            if (context.context.type === 'generalization') {
                deleteModelElement(); 
            }
        });
        eventBus.on('generalization.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'generalization';
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

GeneralizationHandler.$inject = ['eventBus', 'commandStack', 'umlWebClient', 'diagramEmitter'];

function canConnect(context) {
    const ret = canConnectHelper(context);
    context.canExecute = ret;
    return ret;
}

function canConnectHelper(context) {
    if (context.source && !context.source.connectType) {
        return true;
    }
    if (context.source && context.source.connectType === 'generalization') {
        if (!context.source.modelElement) {
            return false;
        }
        if (!context.source.modelElement.isSubClassOf('classifier')) {
            return false;
        }
        if (context.target) {
            if (!context.target.modelElement) {
                return false;
            }
            if (!context.target.modelElement.isSubClassOf('classifier')) {
                return false;
            }
        }
        return true;
    }
    return false;
} 
