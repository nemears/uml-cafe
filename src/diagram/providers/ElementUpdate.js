export default class ElementUpdate {
    
    _styles = new Map();

    constructor(diagramEmitter, elementRegistry, modelElementMap, eventBus, diagramContext, diManager, umlWebClient) {
        const me = this;
        diManager.manager.updateHandlers.push(async (newElement, oldElement) => {
            if (oldElement) {
                if (!newElement) {
                    eventBus.fire('server.delete', { element: oldElement });
                } else {
                    if (newElement.is('UMLDiagramElement')) {
                        for await (const proxyElement of newElement.modelElement) {
                            // do nothing, just loading
                            await umlWebClient.get(proxyElement.modelElementID);
                        }
                        if (newElement.localStyle.has()) {
                            me._styles.set(newElement.localStyle.id(), newElement.id);
                        }
                    }
                    let localElement = elementRegistry.get(newElement.id);
                    if (!localElement && newElement.is('Style')) {
                        localElement = elementRegistry.get(me._styles.get(newElement.id));
                        if (!localElement) {
                            console.warn('could not find element corresponding to style');
                        } else {
                            const serverElement = await diManager.get(localElement.id);
                            eventBus.fire('server.update', {
                                localElement: localElement,
                                serverElement: serverElement
                            });
                        }
                    } else if (localElement) {
                        eventBus.fire('server.update', {
                            localElement: localElement,
                            serverElement: newElement,
                        });
                    } else {
                        eventBus.fire('server.create', { serverElement: newElement});
                    }
                }
            } else {
                if (newElement) {
                    eventBus.fire('server.create', { serverElement: newElement });
                }
            }
        });
        const eventQueue = [];
        diagramEmitter.on('elementUpdate', (event) => {
            const handleUpdate = async () => {
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
                                    const diagramElement = await diManager.get(diagramElementID);
                                    eventBus.fire('server.delete', {
                                        element: diagramElement
                                    });

                                    await removeShapeAndEdgeFromServer(diagramElement, diManager);
                                }
                            }
                        } else {
                            await updateDiagramElement(newElement, modelElementMap, elementRegistry, eventBus, diManager);
                        }
                    } else {
                        if (newElement) {
                            await updateDiagramElement(newElement, modelElementMap, elementRegistry, eventBus, diManager);
                        }
                    }
                }

                // get rid of first event in eventQueue which should be us
                eventQueue.shift();
                if (eventQueue.length > 0) {
                    eventQueue[0].promise = eventQueue[0].fn();
                }
            };
            eventQueue.push({
                fn: handleUpdate,
                promise: undefined
            });

            const runEventInOrder = async () => {
                // enforce processing in order
                do {
                    if (!eventQueue[0].promise) {
                        eventQueue[0].promise = eventQueue[0].fn();
                    }
                    if (eventQueue.length > 0) {
                        await eventQueue[0].promise;
                    }
                } while (eventQueue.length > 0);
            }
            runEventInOrder();
        });
    }
}

ElementUpdate.$inject = ['diagramEmitter', 'elementRegistry', 'modelElementMap', 'eventBus', 'diagramContext', 'diManager', 'umlWebClient'];

async function updateDiagramElement(newElement, modelElementMap, elementRegistry, eventBus, diManager) {
    const diagramElementIDs = modelElementMap.get(newElement.id);
    if (diagramElementIDs) {
        // element is represented within the diagram
        for (const shapeID of diagramElementIDs) {
            const diagramElement = elementRegistry.get(shapeID);
            const serverElement = await diManager.get(shapeID);
            if (diagramElement && serverElement) { // workaround / not optimal
                if (serverElement.modelElement) {
                    await serverElement.modelElement.front();
                }
                eventBus.fire('server.update', {
                    localElement: diagramElement,
                    serverElement: serverElement,
                });
                eventBus.fire('elements.changed', {
                    elements: [diagramElement],
                });
            }
        }
    }
}

export async function removeShapeAndEdgeFromServer(shape, diManager) {
    if (shape.incoming) {
        for (const incomingEdge of shape.incoming) {
            await diManager.delete(await diManager.get(incomingEdge.id));
        }
    }
    if (shape.outgoing) {
        for (const outgoingEdge of shape.outgoing) {
            await diManager.delete(await diManager.get(outgoingEdge.id));
        }
    }
    await diManager.delete(await diManager.get(shape.id));
}
