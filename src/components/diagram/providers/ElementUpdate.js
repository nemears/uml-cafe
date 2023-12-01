import { getUmlDiagramElement, deleteUmlDiagramElement } from '../api/diagramInterchange';

export default class ElementUpdate {

    constructor(diagramEmitter, umlWebClient, modeling, canvas, elementRegistry, modelElementMap, graphicsFactory) {
        diagramEmitter.on('elementUpdate', async (event) => {
            for (const update of event.updatedElements) {
                const newElement = update.newElement;
                const oldElement = update.oldElement;
                if (oldElement) {
                    if (!newElement) {
                        // check if it is a modelElement being represented in the diagram
                        let shapeIDs = modelElementMap.get(oldElement.id);
                        if (shapeIDs) {
                            for (const shapeID of shapeIDs) {
                                const shape = elementRegistry.get(shapeID);
                                // lets delete the shape
                                await removeShapeAndEdgeFromServer(shape, umlWebClient);
                                modeling.removeShape(shape);
                            }
                        } else {
                            const shape = elementRegistry.get(oldElement.id);
                            // TODO check if connection or shape
                            
                            if (shape) {
                                for (const classifierID of oldElement.classifiers.ids()) {
                                    if (classifierID === 'KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g') {
                                        // shape
                                        await removeShapeAndEdgeFromServer(shape, umlWebClient); // do we need this?
                                        modeling.removeShape(shape);
                                    } else if (classifierID === 'u2fIGW2nEDfMfVxqDvSmPd5e_wNR') {
                                        // edge
                                        await deleteUmlDiagramElement(shape.id, umlWebClient);
                                        modeling.removeConnection(shape);
                                    } 
                                }
                            }
                        }
                    } else {
                        if (newElement.isSubClassOf('instanceSpecification')) {
                            let elementIsShapeType = false;
                            for (let classifierID of newElement.classifiers.ids()) {
                                if (classifierID === 'KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g') {
                                    // check if the element is in the diagram (on big diagrams with a lot of users this could get laggy)
                                    const diagramShape = elementRegistry.get(oldElement.id);
                                    if (diagramShape) {
                                        // the element updated is a diagram shape
                                        const umlShape = await getUmlDiagramElement(oldElement.id, umlWebClient);

                                        // change bounds in diagram
                                        modeling.resizeShape(diagramShape, umlShape.bounds);
                                    } else {
                                        // not being tracked by diagram yet
                                        let umlShape = await createNewShape(newElement.id, umlWebClient, modeling, canvas);
                                        modelElementMap.set(umlShape.modelElement.id, newElement.id);
                                    }
                                    break;
                                } else if (classifierID === 'u2fIGW2nEDfMfVxqDvSmPd5e_wNR') {
                                    const diagramEdge = elementRegistry.get(oldElement.id);
                                    if (diagramEdge) {
                                        const umlEdge = await getUmlDiagramElement(oldElement.id, umlWebClient);
                                        if (diagramEdge.source.id === umlEdge.source && diagramEdge.target.id === umlEdge.target) {
                                            // update waypoints
                                            modeling.updateWaypoints(diagramEdge, umlEdge.waypoints);
                                        } 
                                    } else {
                                        // not being tracked by diagram yet maybe
                                        console.warn('TODO ElementUpdate.js edge update "edge" case');
                                    }
                                }
                            }

                            if (!elementIsShapeType) {
                                return;
                            }
                        }
                        const shapeIDs = modelElementMap.get(oldElement.id);
                        if (shapeIDs) {
                            // shape is represented in diagram
                            if (oldElement.name !== newElement.name) {
                                // update name
                                for (const shapeID of shapeIDs) {
                                    const shape = elementRegistry.get(shapeID);
                                    shape.modelElement = newElement;
                                    graphicsFactory.update('shape', shape, canvas.getGraphics(shape));
                                }
                            }
                        }
                    }
                } else {
                    if (newElement.isSubClassOf('instanceSpecification')) {
                        for (let classifierID of newElement.classifiers.ids()) {
                            if (classifierID === 'KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g') {
                                const umlShape = await createNewShape(newElement.id, umlWebClient, modeling, canvas);
                                modelElementMap.set(umlShape.modelElement.id, newElement.id);
                            } else if (classifierID === 'u2fIGW2nEDfMfVxqDvSmPd5e_wNR') {
                                // it is a umlEdge
                                const umlEdge = await getUmlDiagramElement(newElement.id, umlWebClient);
                                const source = elementRegistry.get(umlEdge.source); 
                                const target = elementRegistry.get(umlEdge.target); 
                                
                                // create connection
                                modeling.createConnection(
                                    source,
                                    target,
                                    0, 
                                    {
                                       source: source,
                                        target: target,
                                        waypoints: umlEdge.waypoints,
                                        id: newElement.id,
                                        modelElement: umlEdge.modelElement,
                                    },
                                    canvas.getRootElement()
                                );
                            }
                        }
                    }
                    const shapeIDs = modelElementMap.get(newElement.id);
                    if (shapeIDs) {
                        // shape is represented in diagram
                        // update name
                        for (const shapeID of shapeIDs) {
                            const shape = elementRegistry.get(shapeID);
                            shape.modelElement = newElement;
                            if (shape.waypoints) {
                                // TODO
                            } else {
                                graphicsFactory.update('shape', shape, canvas.getGraphics(shape));
                            }
                        }
                    }
                }
            }
        });
    }
}

ElementUpdate.$inject = ['diagramEmitter', 'umlWebClient', 'modeling', 'canvas', 'elementRegistry', 'modelElementMap', 'graphicsFactory'];

async function createNewShape(newShapeID, umlWebClient, modeling, canvas) {
    // it is a umlShape, let's see if it is owned by this diagram
    // TODO check if it is owned by this diagram
    // just assuming it is now
    // the element has not been made yet, create it
    const umlShape = await getUmlDiagramElement(newShapeID, umlWebClient);
    // assuming it is a shape
    modeling.createShape({
        width: umlShape.bounds.width,
        height: umlShape.bounds.height,
        // TODO uml stuff
        update: true, // just saying it is from the backend
        id: newShapeID,
        modelElement: umlShape.modelElement,
    }, {
        x: umlShape.bounds.x + umlShape.bounds.width / 2,
        y: umlShape.bounds.y + umlShape.bounds.height / 2,
    }, canvas.getRootElement()); // TODO we want to do this with owningElement eventuall instead of assuming root

    return umlShape;
}

export async function removeShapeAndEdgeFromServer(shape, umlWebClient) {
    for (const incomingEdge of shape.incoming) {
        await deleteUmlDiagramElement(incomingEdge.id, umlWebClient);
    }
    for (const outgoingEdge of shape.outgoing) {
        await deleteUmlDiagramElement(outgoingEdge.id, umlWebClient);
    }
    await deleteUmlDiagramElement(shape.id, umlWebClient);
}