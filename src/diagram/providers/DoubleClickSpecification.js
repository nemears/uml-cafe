export default class DoubleClickSpecification {
    constructor(eventBus, diagramEmitter) {
        eventBus.on('element.dblclick', (event) => {
            diagramEmitter.fire('specification', event.element.modelElement);
        });
    }
}

DoubleClickSpecification.$inject = ['eventBus', 'diagramEmitter']; 
