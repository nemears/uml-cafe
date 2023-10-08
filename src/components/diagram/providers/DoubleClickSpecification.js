export default class DoubleClickSpecification {
    constructor(eventBus, diagramEmitter, umlWebClient) {
        // TODO
        eventBus.on('element.dblclick', async(event) => {
            diagramEmitter.fire('specification', await umlWebClient.get(event.element.elementID));
        });
    }
}
