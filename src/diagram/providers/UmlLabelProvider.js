import { updateLabel } from '../api/diagramInterchange';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default class UmlLabelProvider extends RuleProvider {
    constructor(eventBus, elementRegistry, elementFactory, canvas, graphicsFactory, umlWebClient) {
        super(eventBus);
        eventBus.on('server.create', (event) => {
            const elementType = event.serverElement.elementType();
            if (isLabel(elementType)) {
                const umlLabel = event.serverElement;
                console.log('creating label');
                console.log(umlLabel);
                const owner = elementRegistry.get(umlLabel.owningElement);
                let labelTarget = owner;

                // determine our target
                //if (owner.modelElement.id === umlLabel.modelElement.id) {
                //    // owner is our target
                //    labelTarget = owner;
                //} else {
                //    // look at children of owner
                //    for (const child of owner.children) {
                //        if (child.modelElement.id === umlLabel.modelElement.id) {
                //            labelTarget = child;
                //        }
                //    }
                //}
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

//        eventBus.on('server.create', (context) => {
//            const umlLabel = context.serverElement,
//            elementType = umlLabel.elementType();
//            if (isLabel(elementType)) {
//                const owner = elementRegistry.get(umlLabel.owningElement);
//                let inselectable, placement;
//                if (owner.elementType === 'edge') {
//                    if (owner.modelElement.elementType() === 'association') {
//                        // handle placement
//                        if (elementType === 'associationEndLabel' || elementType === 'multiplicityLabel') {
//                            // source or target
//                            if (owner.source.modelElement.id === umlLabel.modelElement.type.id()) {
//                                placement = 'source';
//                            } else if (owner.target.modelElement.id === umlLabel.modelElement.type.id()) {
//                                placement = 'target';
//                            }
//                        } else {
//                            // center
//                            placement = 'center';
//                        }
//                    } 
//                } else if (elementType === 'nameLabel' || elementType === 'keywordLabel') {
//                    inselectable = true;
//                }
//                const label = elementFactory.createLabel({
//                    id: umlLabel.id,
//                    x: umlLabel.bounds.x,
//                    y: umlLabel.bounds.y,
//                    width: umlLabel.bounds.width,
//                    height: umlLabel.bounds.height,
//                    labelTarget: owner,
//                    parent: owner,
//                    modelElement: umlLabel.modelElement,
//                    inselectable: inselectable,
//                    placement: placement,
//                    elementType: elementType,
//                });
//                canvas.addShape(label, owner);
//            }
//        });

        eventBus.on('server.update', (event) => {
            const serverLabel = event.serverElement,
            localLabel = event.localElement,
            elementType = serverLabel.elementType();
            
            if (isLabel(elementType)) {
                console.log('updating label');
                console.log(serverLabel);
                localLabel.x = serverLabel.bounds.x;
                localLabel.y = serverLabel.bounds.y;
                localLabel.width = serverLabel.bounds.width;
                localLabel.height = serverLabel.bounds.height;
                localLabel.text = serverLabel.text;
                localLabel.modelElement = serverLabel.modelElement;
            }
            if (elementType === 'nameLabel' && localLabel.text !== localLabel.modelElement.name) {
                localLabel.text = localLabel.modelElement.name;
                updateLabel(localLabel, umlWebClient);
            }
            if (isLabel(elementType)) {
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

export function isLabel(elementType) {
    return  elementType === 'label' || 
            elementType === 'nameLabel' || 
            elementType === 'typedElementLabel' || 
            elementType === 'keywordLabel' || 
            elementType === 'associationEndLabel' || 
            elementType === 'multiplicityLabel';    
}
