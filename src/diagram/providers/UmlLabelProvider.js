import { isLabel, updateLabel } from '../api/diagramInterchange';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default class UmlLabelProvider extends RuleProvider {
    constructor(eventBus, elementRegistry, elementFactory, canvas, graphicsFactory, umlWebClient) {
        super(eventBus);
        eventBus.on('server.create', (event) => {
            const elementType = event.serverElement.elementType();
            if (isLabel(elementType)) {
                const umlLabel = event.serverElement;
                const owner = elementRegistry.get(umlLabel.owningElement);
                let labelTarget = owner;
                let placement, inselectable; // TODO store these attributes in server with new types
                switch (elementType) {
                    case 'nameLabel':
                    case 'keywordLabel':
                    case 'typedElementLabel':
                        if (!owner.waypoints) {
                            inselectable = true;
                        } else {
                            placement = 'center'
                        }
                        break;
                    case 'associationEndLabel':
                    case 'multiplicityLabel':
                        if (owner.waypoints) {
                            // determine alignment
                            if (owner.modelElement.elementType() === 'association') {
                                if (umlLabel.modelElement.type.id() === owner.source.modelElement.id) {
                                    placement = 'source'
                                } else if (umlLabel.modelElement.type.id() === owner.target.modelElement.id) {
                                    placement = 'target';
                                }
                            }
                        }
                        break;
                     default:
                        throw Error('unhanded label type from server ' + elementType);
                }
                const label = elementFactory.createLabel({
                    x: umlLabel.bounds.x,
                    y: umlLabel.bounds.y,
                    width: umlLabel.bounds.width,
                    height: umlLabel.bounds.height,
                    id: umlLabel.id,
                    modelElement: umlLabel.modelElement,
                    text: umlLabel.text,
                    labelTarget: labelTarget,
                    elementType: elementType,
                    placement: placement,
                    inselectable: inselectable,
                });
                canvas.addShape(label, owner);
            }
        });

        eventBus.on('server.update', (event) => {
            const serverLabel = event.serverElement,
            localLabel = event.localElement,
            elementType = serverLabel.elementType();
            
            if (isLabel(elementType)) {
                localLabel.x = serverLabel.bounds.x;
                localLabel.y = serverLabel.bounds.y;
                localLabel.width = serverLabel.bounds.width;
                localLabel.height = serverLabel.bounds.height;
                localLabel.text = serverLabel.text;
                localLabel.modelElement = serverLabel.modelElement;

                switch (elementType) {
                    case 'nameLabel':
                    case 'associationEndLabel':
                        if (localLabel.modelElement.name != localLabel.text) {
                            localLabel.text = localLabel.modelElement.name;
                            updateLabel(localLabel, umlWebClient);
                        }
                        break;
                    case 'typedElementLabel':
                        // TODO (maybe necessary?)
                        break;
                    case 'multiplicityLabel':
                        // TODO (maybe necessary?)
                        break;
                }

                graphicsFactory.update('shape', localLabel, canvas.getGraphics(localLabel));
            }
        });

        eventBus.on('server.delete', (event) => {
            const element = event.element,
            elementType = element.elementType;
            if (isLabel(elementType)) {
                canvas.removeShape(element);
            }
        });
    }

    init() {
        this.addRule('shape.resize', (context) => {
            if (context.shape.elementType === 'nameLabel' || context.shape.elementType === 'keyWordLabel') {
                return false;
            }
        });
    }
}

UmlLabelProvider.$inject = ['eventBus', 'elementRegistry', 'elementFactory', 'canvas', 'graphicsFactory', 'umlWebClient'];
