import { getUmlDiagramElement, deleteUmlDiagramElement, SHAPE_ID, LABEL_ID } from '../api/diagramInterchange';

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
                                    if (classifierID === SHAPE_ID) {
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
                                if (classifierID === SHAPE_ID) {
                                    // check if the element is in the diagram (on big diagrams with a lot of users this could get laggy)
                                    const diagramShape = elementRegistry.get(oldElement.id);
                                    if (diagramShape) {
                                        // the element updated is a diagram shape
                                        const umlShape = await getUmlDiagramElement(oldElement.id, umlWebClient);

                                        // change bounds in diagram
                                        modeling.resizeShape(diagramShape, umlShape.bounds);
                                    } else {
                                        // not being tracked by diagram yet
                                        let umlShape = await createNewShape(newElement.id, umlWebClient, modeling, elementRegistry);
                                        modelElementMap.set(umlShape.modelElement.id, newElement.id);
                                    }
                                    break;
                                } else if (classifierID === LABEL_ID) {
                                    const diagramShape = elementRegistry.get(oldElement.id);
                                    if (diagramShape) {
                                        // already tracked, update the label 
                                        const umlLabel = await await getUmlDiagramElement(oldElement.id, umlWebClient);

                                        // change bounds in diagram
                                        modeling.resizeShape(diagramShape, umlLabel.bounds);
                                    } else {
                                        // not being tracked by diagram yet
                                        let umlLabel = await createNewLabel(newElement.id, umlWebClient, modeling, elementRegistry);
                                        modelElementMap.set(umlLabel.modelElement.id, newElement.id);
                                    }
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
                            updateName(newElement, shapeIDs, elementRegistry, graphicsFactory, canvas);
                        }
                    }
                } else {
                    if (newElement.isSubClassOf('instanceSpecification')) {
                        for (let classifierID of newElement.classifiers.ids()) {
                            if (classifierID === SHAPE_ID) {
                                const umlShape = await createNewShape(newElement.id, umlWebClient, modeling, elementRegistry);
                                modelElementMap.set(umlShape.modelElement.id, newElement.id);
                            } else if (classifierID === 'u2fIGW2nEDfMfVxqDvSmPd5e_wNR') {
                                // it is a umlEdge
                                const umlEdge = await getUmlDiagramElement(newElement.id, umlWebClient);
                                const source = elementRegistry.get(umlEdge.source); 
                                const target = elementRegistry.get(umlEdge.target); 
                                if (umlEdge.modelElement.isSubClassOf('association')) {
                                    for await (const memberEnd of umlEdge.modelElement.memberEnds) {}
                                }
                                
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
                        updateName(newElement, shapeIDs, elementRegistry, graphicsFactory, canvas);
                    }
                }
            }
        });
    }
}

ElementUpdate.$inject = ['diagramEmitter', 'umlWebClient', 'modeling', 'canvas', 'elementRegistry', 'modelElementMap', 'graphicsFactory'];

function updateName(newElement, shapeIDs, elementRegistry, graphicsFactory, canvas) {
    for (const shapeID of shapeIDs) {
        const shape = elementRegistry.get(shapeID);
        shape.modelElement = newElement;
        if (shape.labelTarget) {
            // TODO maybe different depending on type?
            shape.text = newElement.name;
            // TODO maybe update shape size based on text
        }
        graphicsFactory.update('shape', shape, canvas.getGraphics(shape));
    }
}

async function createNewShape(newShapeID, umlWebClient, modeling, elementRegistry) {
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
    }, elementRegistry.get(umlShape.owningElement)); // TODO we want to do this with owningElement eventuall instead of assuming root

    return umlShape;
}

async function createNewLabel(newLabelID, umlWebClient, modeling, elementRegistry) {
    const umlLabel = await getUmlDiagramElement(newLabelID, umlWebClient);
    modeling.createLabel({
            width: umlLabel.width,
            height: umlLabel.height,
            update: true,
            id: newLabelID,
            modelElement: umlLabel.modelElement
        },
        {
            x: umlLabel.bounds.x + umlLabel.bounds.width / 2,
            y: umlLabel.bounds.y + umlLabel.bounds.height / 2
        },
        elementRegistry.get(umlLabel.owningElement)
    );
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
