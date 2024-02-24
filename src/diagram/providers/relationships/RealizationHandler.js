import { createElementUpdate } from '../../../umlUtil';
import { randomID } from 'uml-client/lib/element';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { getTextDimensions } from '../ClassDiagramPaletteProvider';

export default class RealizationHandler extends RuleProvider {
    
    constructor(eventBus, commandStack, umlWebClient, diagramEmitter, diagramContext, umlRenderer, elementFactory) {
        super(eventBus);

        eventBus.on('connect.end', 1100, (event) => {
            if (event.context.start.connectType === 'realization' || event.connectType === 'realization') {
                commandStack.execute('edge.connect', {
                    connectionData: {
                        id: randomID(),
                        modelElement: {
                            id: randomID(),
                            elementType() {
                                'realization'
                            }
                        },
                        createModelElement: true,
                        source: event.context.start,
                        target: event.hover,
                        children: [],
                    },
                    connectType: 'realization',
                    children: [],
                });
                return false; // stop propogation
            }
        });
        eventBus.on('edge.connect.create', (context) => {
            function createRealizationKeywordLabel(realization, placement) {
                const textString = '«' + realization.elementType() + '»';
                return elementFactory.createLabel({
                    id: randomID(),
                    width: Math.round(getTextDimensions(textString, umlRenderer).width) + 10,
                    height: 24,
                    modelElement: realization,
                    labelTarget: context.connection,
                    parent: context.connection,
                    elementType: 'keywordLabel',
                    text: textString,
                    placement: placement,
                });
            }
            if (context.connectType === 'realization') {
                const client = context.connection.source.modelElement,
                supplier = context.connection.target.modelElement;
                const realization = umlWebClient.post('realization', {id:context.connection.modelElement.id});
                context.connection.modelElement = realization;
                realization.clients.add(client);
                realization.suppliers.add(supplier);
                diagramContext.context.packagedElements.add(realization);
                umlWebClient.put(realization);
                umlWebClient.put(client);
                umlWebClient.put(diagramContext.context);
                context.children.push(createRealizationKeywordLabel(realization, 'center'));
                diagramEmitter.fire('elementUpdate', createElementUpdate(client));
                diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context)); 
            }
        });
        eventBus.on('edgeCreateUndo', (context) => {
            const deleteModelElement = async () => {
                const owner = await context.context.connection.modelElement.owner.get();
                await umlWebClient.deleteElement(context.context.connection.modelElement);
                diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
            }
            if (context.context.type === 'realization') {
                deleteModelElement(); 
            }
        });
        eventBus.on('realization.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'realization';
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

RealizationHandler.$inject = ['eventBus', 'commandStack', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'umlRenderer', 'elementFactory'];

function canConnect(context) {
    const ret = canConnectHelper(context);
    context.canExecute = ret;
    return ret;
}

function canConnectHelper(context) {
    if (context.source && !context.source.connectType) {
        return true;
    }
    if (context.source && context.source.connectType === 'realization') {
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
