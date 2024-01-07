export default class UmlLabelProvider {
    constructor(eventBus, elementRegistry, elementFactory, canvas, graphicsFactory) {
        eventBus.on('server.create', (event) => {
            if (event.serverElement.elementType() === 'label') {
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
                const label = elementFactory.createLabel({
                    x: umlLabel.bounds.x,
                    y: umlLabel.bounds.y,
                    width: umlLabel.bounds.width,
                    height: umlLabel.bounds.height,
                    id: umlLabel.id,
                    modelElement: umlLabel.modelElement,
                    text: umlLabel.text,
                    labelTarget: labelTarget
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
        })
    }
}

UmlLabelProvider.$inject = ['eventBus', 'elementRegistry', 'elementFactory', 'canvas', 'graphicsFactory'];