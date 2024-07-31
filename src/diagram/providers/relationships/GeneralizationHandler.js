import { createElementUpdate } from '../../../umlUtil';
import { randomID } from 'uml-client/lib/types/element';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default class GeneralizationHandler extends RuleProvider {
    
    constructor(eventBus, commandStack, umlWebClient, diagramEmitter) {
        super(eventBus);
        eventBus.on('connect.end', 1100, (event) => {
            if (event.context.start.connectType === 'generalization' || event.connectType === 'generalization') {
                commandStack.execute('edge.connect', {
                    connectionData: {
                        id: randomID(),
                        modelElement: {
                            id: randomID(),
                            elementType() {
                                'Generalization'
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
                const generalization = umlWebClient.post('Generalization', {id: context.connection.modelElement.id});
                context.connection.modelElement = generalization;
                specific.generalizations.add(generalization);
                generalization.general.set(general);
                umlWebClient.put(generalization);
                umlWebClient.put(specific);
                diagramEmitter.fire('elementUpdate', createElementUpdate(specific, generalization));
            }
        });
        eventBus.on('edge.connect.undo', (context) => {
            const deleteModelElement = async () => {
                const connection = context.connection;
                const owner = connection.source.modelElement;
                await umlWebClient.deleteElement(connection.modelElement);
                diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
            }
            if (context.connectType === 'generalization') {
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
        let modelElement = context.source.modelElement;
        if (!modelElement) {
            if (context.source.parent) {
                modelElement = context.source.parent.modelElement;
            }
        }
        if (!modelElement) {
            return false;
        }
        if (!modelElement.is('Classifier')) {
            return false;
        }
        if (context.target) {
            modelElement = context.target.modelElement;
            if (!modelElement) {
                if (context.target.parent) {
                    modelElement = context.target.parent.modelElement;
                }
            }
            if (!modelElement) {
                return false;
            }
            if (!modelElement.is('Classifier')) {
                return false;
            }
        }
        return true;
    }
} 
