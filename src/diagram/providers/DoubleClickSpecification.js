export default class DoubleClickSpecification {
    constructor(eventBus, diagramEmitter) {
        eventBus.on('element.dblclick', (event) => {
            if (event.element.modelElement) {
                diagramEmitter.fire('specification', event.element.modelElement);
            }
        });
    }
}

DoubleClickSpecification.$inject = ['eventBus', 'diagramEmitter']; 
