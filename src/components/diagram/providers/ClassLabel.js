
export default class ClassLabel {
    constructor(elementFactory, eventBus, canvas, diagramEmitter, graphicsFactory) {
        const labels = {};
        eventBus.on('shape.added', (event) => {
            if (!event.element.label && !event.element.classLabel) {
                
                var label = elementFactory.createLabel({
                    classLabel: true,
                    x : event.element.x + 5,
                    y: event.element.y + 5,
                    width: event.element.width - 10,
                    height: 15,
                    labelTarget: event.element,
                });

                label.labelTarget.name = event.element.name;

                event.element.label = label;

                canvas.addShape(label, event.element);
                labels[event.element.elementID] = label;
            }
        });

        eventBus.on('element.dblclick', (event) => {
            if (!event.element.classLabel) {
                return;
            }
        });
        diagramEmitter.on('rename', (event) => {
            const label = labels[event.id];
            if (!label) {
                return;
            }
            label.labelTarget.name = event.value;
            graphicsFactory.update('shape', label, canvas.getGraphics(label));
        });
    }
}

ClassLabel.$inject = ['elementFactory', 'eventBus', 'canvas', 'diagramEmitter', 'graphicsFactory'];
