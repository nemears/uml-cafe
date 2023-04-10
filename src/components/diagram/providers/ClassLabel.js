
export default class ClassLabel {
    constructor(elementFactory, eventBus, canvas, graphicsFactory) {

        this.labelMap = new Map();

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

                event.element.label = label;

                canvas.addShape(label, event.element);
                this.labelMap.set(event.element.elementID, label);
            }
        });

        eventBus.on('uml.rename', (event) => {
            var label = this.labelMap.get(event.id);
            label.labelTarget.name = event.name;
            graphicsFactory.update('shape', label, canvas.getGraphics(label));
        });
    }
}