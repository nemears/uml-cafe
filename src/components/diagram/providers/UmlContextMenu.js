import { createElementUpdate, deleteElementElementUpdate } from "../../../createElementUpdate";
import { deleteUmlDiagramElement } from "../api/diagramInterchange";
import { removeShapeAndEdgeFromServer } from "./ElementUpdate";
export default class UmlContextMenu {
    constructor(eventBus, diagramEmitter, umlWebClient, modeling) {
        eventBus.on('element.contextmenu', (event) => {
            if (event.element.modelElement && !event.originalEvent.ctrlKey) {
                diagramEmitter.fire('contextmenu', {
                    x: event.originalEvent.clientX,
                    y: event.originalEvent.clientY,
                    items: [
                        {
                            label: 'Specification',
                            onClick: () => {
                                diagramEmitter.fire('specification', event.element.modelElement);
                            }
                        },
                        {
                            label: 'Remove Shape',
                            disabled: umlWebClient.readonly,
                            onClick: async () => {
                                // delete shape or edge
                                if (event.element.waypoints) {
                                    // edge
                                    await deleteUmlDiagramElement(event.element.id, umlWebClient);
                                    modeling.removeConnection(element, umlWebClient);
                                } else {
                                    // shape
                                    await removeShapeAndEdgeFromServer(event.element, umlWebClient);
                                    modeling.removeShape(event.element);
                                }
                            }
                        },
                        {
                            label: 'Delete Element',
                            disabled: umlWebClient.readonly,
                            onClick: async () => {

                                // TODO show popup menu

                                const owner = await event.element.modelElement.owner.get();
                                diagramEmitter.fire('elementUpdate', deleteElementElementUpdate(event.element.modelElement));
                                await umlWebClient.deleteElement(event.element.modelElement);
                                if (owner) {
                                    umlWebClient.put(owner);
                                    diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
                                }
                                // TODO fire element update
                                if (event.element.waypoints) {
                                    // edge
                                    await deleteUmlDiagramElement(event.element.id, umlWebClient);
                                    modeling.removeConnection(element, umlWebClient);
                                } else {
                                    // shape
                                    await removeShapeAndEdgeFromServer(event.element, umlWebClient);
                                    modeling.removeShape(event.element);
                                }
                            }
                        }
                    ]
                });
                event.originalEvent.preventDefault();
            }
        });
    }
}

UmlContextMenu.$inject = ['eventBus', 'diagramEmitter', 'umlWebClient', 'modeling'];