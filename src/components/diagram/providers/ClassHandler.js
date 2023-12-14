export default class ClassHandler {
    constructor(eventBus, modeling) {
        eventBus.on('resize.start', (event) => {
            if (event.shape.modelElement && event.shape.modelElement.isSubClassOf('classifier')) {
                // overiding resize.start so that minSize is different
                delete event.context.resizeConstraints;
                event.context.minBounds = {
                    width: 0,
                    height: 40 + event.shape.children.length * 25
                }
            }
        });
        eventBus.on('resize.end', (event) => {
            const shape = event.shape;
            if (shape.modelElement.isSubClassOf('classifier')) {
                let totalHeight = 40;
                for (const child of shape.children) {
                    modeling.resizeShape(
                        child, 
                        {
                            x: shape.x + 8,
                            y: shape.y + totalHeight,
                            width: shape.width - 16,
                            height: child.height
                        }
                    );
                    totalHeight += 5 + child.height;
                }
                if (totalHeight > shape.height) {
                    modeling.resizeShape(
                        shape, 
                        {
                            x : shape.x,
                            y : shape.y,
                            height: totalHeight,
                            width: shape.width,
                        }
                    );
                }
            } 
        });
    }
}

ClassHandler.$inject = ['eventBus', 'modeling'];
