import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { translateDJLabelToUMLLabel } from '../translations';

export default class UmlLabelProvider extends RuleProvider {
    constructor(eventBus, elementRegistry, elementFactory, canvas, graphicsFactory, umlWebClient, diManager, diagramContext) {
        super(eventBus);
        eventBus.on('server.create', (event) => {
            const elementType = event.serverElement.elementType();
            if (event.serverElement.is('UMLLabel')) {
                const umlLabel = event.serverElement;
                const owner = elementRegistry.get(umlLabel.owningElement.id());
                const doLater = async () => {
                    const bounds = await umlLabel.bounds.get();
                    const modelElement = await umlWebClient.get((await umlLabel.modelElement.front()).modelElementID);
                    let placement, inselectable; // TODO store these attributes in server with new types
                    switch (elementType) {
                        case 'UMLNameLabel':
                        case 'UMLKeywordLabel':
                        case 'UMLTypedElementLabel':
                            if (!owner.waypoints) {
                                inselectable = true;
                            } else {
                                placement = 'center'
                            }
                            break;
                        case 'UMLAssociationEndLabel':
                        case 'UMLMultiplicityLabel':
                            if (owner.waypoints) {
                                // determine alignment
                                if (owner.modelElement.elementType() === 'Association') {
                                    if (modelElement.type.id() === owner.source.modelElement.id) {
                                        placement = 'source'
                                    } else if (modelElement.type.id() === owner.target.modelElement.id) {
                                        placement = 'target';
                                    }
                                }
                            }
                            break;
                         default:
                            throw Error('unhanded label type from server ' + elementType);
                    } 
                    let labelTarget = owner;
                    const label = elementFactory.createLabel({
                        x: bounds.x,
                        y: bounds.y,
                        width: bounds.width,
                        height: bounds.height,
                        id: umlLabel.id,
                        modelElement: modelElement,
                        text: umlLabel.text,
                        labelTarget: labelTarget,
                        elementType: elementType,
                        placement: placement,
                        inselectable: inselectable,
                    });
                    canvas.addShape(label, owner);                 
                }
                doLater();
            }
        });

        eventBus.on('server.update', (event) => {
            const serverLabel = event.serverElement,
            localLabel = event.localElement,
            elementType = serverLabel.elementType();
            
            if (serverLabel.is('UMLLabel')) {
                const doLater = async() => {
                    const bounds = await serverLabel.bounds.get();
                    localLabel.x = bounds.x;
                    localLabel.y = bounds.y;
                    localLabel.width = bounds.width;
                    localLabel.height = bounds.height;
                    localLabel.text = serverLabel.text;
                    localLabel.modelElement = await umlWebClient.get((await serverLabel.modelElement.front()).modelElementID);

                    switch (elementType) {
                        case 'UMLNameLabel':
                        case 'UMLAssociationEndLabel':
                            if (localLabel.modelElement.name != localLabel.text) {
                                localLabel.text = localLabel.modelElement.name;
                                await translateDJLabelToUMLLabel(localLabel, serverLabel, diManager, diagramContext.umlDiagram);
                                await diManager.put(serverLabel);
                            }
                            break;
                        case 'UMLTypedElementLabel':
                            // TODO (maybe necessary?)
                            break;
                        case 'UMLMultiplicityLabel':
                            // TODO (maybe necessary?)
                            break;
                    }

                    graphicsFactory.update('shape', localLabel, canvas.getGraphics(localLabel));
                }
                doLater();
            }
        });

        eventBus.on('server.delete', (event) => {
            const element = event.element,
            elementType = element.elementType;
            if (isLabel(elementType)) { // TODO
                canvas.removeShape(element);
            }
        });
    }

    init() {
        this.addRule('shape.resize', (context) => {
            if (context.shape.elementType === 'UMLNameLabel' || context.shape.elementType === 'UMLKeywordLabel') {
                return false;
            }
        });
    }
}

UmlLabelProvider.$inject = [
    'eventBus', 
    'elementRegistry', 
    'elementFactory', 
    'canvas', 
    'graphicsFactory', 
    'umlWebClient', 
    'diManager', 
    'diagramContext'
];
