export default class NameSupport {

    shapes = {};

    constructor(eventBus, canvas, diagramEmitter, graphicsFactory) {
        eventBus.on('shape.added', (event) => {
            if (this.shapes[event.element.elementID]) {
                this.shapes[event.element.elementID].push(event.element);
            } else {
                this.shapes[event.element.elementID] = [event.element];
            }
        });
        diagramEmitter.on('rename', (event) => {
            const shapeList = this.shapes[event.id];
            if (shapeList) {
                for (const shape of shapeList) {
                    shape.name = event.value;
                    graphicsFactory.update('shape', shape, canvas.getGraphics(shape));
                }
            }
        });
    }
}

NameSupport.$inject = ['eventBus', 'canvas', 'diagramEmitter', 'graphicsFactory'];
