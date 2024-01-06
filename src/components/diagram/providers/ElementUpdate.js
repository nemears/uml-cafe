import { getUmlDiagramElement, deleteUmlDiagramElement } from '../api/diagramInterchange';

export default class ElementUpdate {

    constructor(diagramEmitter, umlWebClient, elementRegistry, modelElementMap, eventBus) {
        diagramEmitter.on('elementUpdate', async (event) => {
            for (const update of event.updatedElements) {
                const newElement = update.newElement;
                const oldElement = update.oldElement;
                if (oldElement) {
                    if (!newElement) {
                        // delete
                        let diagramElementIDs = modelElementMap.get(oldElement.id);
                        if (diagramElementIDs) {
                            // element was deleted that is represented in this diagram
                            for (const diagramElementID of diagramElementIDs) {
                                const diagramElement = elementRegistry.get(diagramElementID);
                                eventBus.fire('server.delete', {
                                    element: diagramElement
                                });
                                await removeShapeAndEdgeFromServer(diagramElement, umlWebClient);
                            }
                        } else {
                            const diagramElement = elementRegistry.get(oldElement.id);
                            if (diagramElement) {
                                // a shape was deleted
                                eventBus.fire('server.delete', {
                                    element: diagramElement
                                });
                                await removeShapeAndEdgeFromServer(diagramElement, umlWebClient);
                            }
                        }
                    } else {
                        // update
                        if (newElement.isSubClassOf('instanceSpecification')) {
                            // could be a diagram element
                            const serverElement = await getUmlDiagramElement(oldElement.id, umlWebClient);
                            if (serverElement) {
                                const localElement = elementRegistry.get(oldElement.id);
                                if (localElement) {
                                    eventBus.fire('server.update', {
                                        localElement: localElement,
                                        serverElement: serverElement,
                                    });
                                } else {
                                    console.warn('got update from server but element ' + oldElement.id + ' was not already being tracked! Sending signal to create instead!');
                                    eventBus.fire('server.create', {
                                        serverElement: serverElement,
                                    });
                                }
                            }
                        }
                        
                        await updateDiagramElement(newElement, modelElementMap, elementRegistry, eventBus);
                    }
                } else {
                    if (newElement) {
                        // new
                        if (newElement.isSubClassOf('instanceSpecification')) {
                            const serverElement = await getUmlDiagramElement(newElement.id, umlWebClient);
                            if (serverElement) {
                                eventBus.emit('server.create', {
                                    serverElement: serverElement,
                                });
                            }
                        }

                        // this probably isn't necessary
                        // TODO check
                        await updateDiagramElement(newElement, modelElementMap, elementRegistry, eventBus);
                    }
                }
            }
        });
    }
}

ElementUpdate.$inject = ['diagramEmitter', 'umlWebClient', 'elementRegistry', 'modelElementMap', 'eventBus'];

async function updateDiagramElement(newElement, modelElementMap, elementRegistry, eventBus) {
    const diagramElementIDs = modelElementMap.get(newElement.id);
    if (diagramElementIDs) {
        // element is represented within the diagram
        for (const shapeID of diagramElementIDs) {
            const diagramElement = elementRegistry.get(shapeID);
            const serverElement = await getUmlDiagramElement(shapeID);
            eventBus.emit('server.update', {
                localElement: diagramElement,
                serverElement: serverElement,
            });
        }
    }
}

export async function removeShapeAndEdgeFromServer(shape, umlWebClient) {
    if (shape.incoming) {
        for (const incomingEdge of shape.incoming) {
            await deleteUmlDiagramElement(incomingEdge.id, umlWebClient);
        }
    }
    if (shape.outgoing) {
        for (const outgoingEdge of shape.outgoing) {
            await deleteUmlDiagramElement(outgoingEdge.id, umlWebClient);
        }
    }
    await deleteUmlDiagramElement(shape.id, umlWebClient);
}
