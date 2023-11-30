export default class DoubleClickSpecification {
    constructor(eventBus, diagramEmitter, umlWebClient) {
        // TODO
        eventBus.on('element.dblclick', (event) => {
            diagramEmitter.fire('specification', event.element.modelElement);
        });
    }
}

DoubleClickSpecification.$inject = ['eventBus', 'diagramEmitter', 'umlWebClient']
