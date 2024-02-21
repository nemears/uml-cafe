import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default class UmlLabelProvider extends RuleProvider {
    constructor(eventBus, elementRegistry, elementFactory, canvas, graphicsFactory) {
        super(eventBus);
        eventBus.on('server.create', (event) => {
            const elementType = event.serverElement.elementType();
            if (elementType  === 'label' || elementType === 'nameLabel' || elementType === 'keywordLabel' || elementType === 'typedElementLabel' || elementType === 'associationEndLabel' || elementType === 'multiplicityLabel') {
                const umlLabel = event.serverElement;
                console.log('creating label');
                console.log(umlLabel);
                const owner = elementRegistry.get(umlLabel.owningElement);
                let labelTarget;

                // determine our target
                if (owner.modelElement.id === umlLabel.modelElement.id) {
                    // owner is our target
                    labelTarget = owner;
                } else {
                    // look at children of owner
                    for (const child of owner.children) {
                        if (child.modelElement.id === umlLabel.modelElement.id) {
                            labelTarget = child;
                        }
                    }
                }
                let placement, inselectable; // TODO store these attributes in server with new types
                switch (elementType) {
                    case 'nameLabel':
                    case 'keywordLabel':
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
            if (event.serverElement.elementType() === 'label') {
                const serverLabel = event.serverElement;
                const localLabel = event.localElement;
                console.log('updating label');
                console.log(serverLabel);
                localLabel.x = serverLabel.bounds.x;
                localLabel.y = serverLabel.bounds.y;
                localLabel.width = serverLabel.bounds.width;
                localLabel.height = serverLabel.bounds.height;
                localLabel.text = serverLabel.text;
                localLabel.modelElement = serverLabel.modelElement;

                // update
                graphicsFactory.update('shape', localLabel, canvas.getGraphics(localLabel));
            }
        });
    }

    init() {
        this.addRule('shape.resize', (context) => {
            if (context.shape.elementType === 'nameLabel' || context.shape.elementType === 'keyWordLabel') {
                return false;
            }
            return true;
        });         
    }
}

UmlLabelProvider.$inject = ['eventBus', 'elementRegistry', 'elementFactory', 'canvas', 'graphicsFactory'];
