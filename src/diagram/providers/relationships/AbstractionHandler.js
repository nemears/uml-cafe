import { createElementUpdate } from '../../../umlUtil';
import { randomID } from 'uml-client/lib/types/element';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { getTextDimensions } from '../ClassDiagramPaletteProvider';

export default class AbstractionHandler extends RuleProvider {
    
    constructor(eventBus, commandStack, umlWebClient, diagramEmitter, diagramContext, umlRenderer, elementFactory) {
        super(eventBus);

        eventBus.on('connect.end', 1100, (event) => {
            if (event.context.start.connectType === 'abstraction' || event.connectType === 'abstraction') {
                commandStack.execute('edge.connect', {
                    connectionData: {
                        id: randomID(),
                        modelElement: {
                            id: randomID(),
                            elementType() {
                                'Abstraction'
                            }
                        },
                        createModelElement: true,
                        source: event.context.start,
                        target: event.hover,
                        children: [],
                    },
                    connectType: 'abstraction',
                    children: [],
                });
                return false; // stop propogation
            }
        });
        eventBus.on('edge.connect.create', (context) => {
            function createAbstractionKeywordLabel(abstraction, placement) {
                const textString = '«' + abstraction.elementType() + '»';
                return elementFactory.createLabel({
                    id: randomID(),
                    width: Math.round(getTextDimensions(textString, umlRenderer).width) + 10,
                    height: 24,
                    modelElement: abstraction,
                    labelTarget: context.connection,
                    parent: context.connection,
                    elementType: 'UMLKeywordLabel',
                    text: textString,
                    placement: placement,
                });
            }
            if (context.connectType === 'abstraction') {
                const client = context.connection.source.modelElement,
                supplier = context.connection.target.modelElement;
                const abstraction = umlWebClient.post('Abstraction', {id:context.connection.modelElement.id});
                context.connection.modelElement = abstraction;
                abstraction.clients.add(client);
                abstraction.suppliers.add(supplier);
                diagramContext.context.packagedElements.add(abstraction);
                umlWebClient.put(abstraction);
                umlWebClient.put(client);
                umlWebClient.put(diagramContext.context);
                context.children.push(createAbstractionKeywordLabel(abstraction, 'center'));
                diagramEmitter.fire('elementUpdate', createElementUpdate(client, diagramContext.context));
            }
        });
        eventBus.on('edge.connect.undo', (context) => {
            const deleteModelElement = async () => {
                const connection = context.connection;
                const owner = await connection.modelElement.owner.get();
                await umlWebClient.delete(connection.modelElement);
                diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
            }
            if (context.connectType === 'Abstraction') {
                deleteModelElement(); 
            }
        });
        eventBus.on('abstraction.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'abstraction';
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

AbstractionHandler.$inject = ['eventBus', 'commandStack', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'umlRenderer', 'elementFactory'];

function canConnect(context) {
    const ret = canConnectHelper(context);
    context.canExecute = ret;
    return ret;
}

function canConnectHelper(context) {
    if (context.source && !context.source.connectType) {
        return true;
    }
    if (context.source && context.source.connectType === 'abstraction') {
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
