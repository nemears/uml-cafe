import { getUmlDiagramElement, deleteUmlDiagramElement, EDGE_ID, SHAPE_ID, LABEL_ID } from '../api/diagramInterchange';

export default class ElementUpdate {

    constructor(diagramEmitter, umlWebClient, modeling, canvas, elementRegistry, modelElementMap, graphicsFactory, elementFactory) {
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
                                    } else if (classifierID === EDGE_ID) {
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
                                        let umlShape = await createNewShape(newElement.id, umlWebClient, elementRegistry, elementFactory, canvas);
                                        modelElementMap.set(umlShape.modelElement.id, newElement.id);
                                    }
                                    break;
                                } else if (classifierID === LABEL_ID) {
                                    const diagramShape = elementRegistry.get(oldElement.id);
                                    if (diagramShape) {
                                        // already tracked, update the label 
                                        const umlLabel = await getUmlDiagramElement(oldElement.id, umlWebClient);

                                        // change bounds in diagram
                                        diagramShape.x = umlLabel.bounds.x;
                                        diagramShape.y = umlLabel.bounds.y;
                                        diagramShape.width = umlLabel.bounds.width;
                                        diagramShape.height = umlLabel.bounds.height;
                                        diagramShape.text = umlLabel.text;

                                        graphicsFactory.update('shape', diagramShape, canvas.getGraphics(diagramShape));
                                    } else {
                                        // not being tracked by diagram yet
                                        let umlLabel = await createNewLabel(newElement.id, umlWebClient, elementRegistry, elementFactory, canvas)
                                        modelElementMap.set(umlLabel.modelElement.id, newElement.id);
                                    }
                                } else if (classifierID === EDGE_ID) {
                                    const diagramEdge = elementRegistry.get(oldElement.id);
                                    if (diagramEdge) {
                                        const umlEdge = await getUmlDiagramElement(oldElement.id, umlWebClient);
                                        if (diagramEdge.source.id === umlEdge.source && diagramEdge.target.id === umlEdge.target) {
                                            // update waypoints
                                            modeling.updateWaypoints(diagramEdge, umlEdge.waypoints);
                                        } 
                                    } else {
                                        // not being tracked by diagram yet maybe
                                        const umlEdge = await createNewEdge(newElement, umlWebClient, elementRegistry, elementFactory, canvas);
                                        modelElementMap.set(umlEdge.modelElement.id, umlEdge.id);
                                    }
                                }
                            }

                            if (!elementIsShapeType) {
                                return;
                            }
                        }
                        updateDiagramElement(modelElementMap, elementRegistry, graphicsFactory, canvas, newElement);
                    }
                } else {
                    if (newElement.isSubClassOf('instanceSpecification')) {
                        for (let classifierID of newElement.classifiers.ids()) {
                            if (classifierID === SHAPE_ID) {
                                const umlShape = await createNewShape(newElement.id, umlWebClient, elementRegistry, elementFactory, canvas);
                                modelElementMap.set(umlShape.modelElement.id, newElement.id);
                            } else if (classifierID === LABEL_ID) {
                                const umlLabel = await createNewLabel(newElement.id, umlWebClient, elementRegistry, elementFactory, canvas)
                                modelElementMap.set(umlLabel.modelElement.id, newElement.id);
                            } else if (classifierID === EDGE_ID) {
                                const umlEdge = await createNewEdge(newElement, umlWebClient, elementRegistry, elementFactory, canvas);
                                modelElementMap.set(umlEdge.modelElement.id, umlEdge.id);
                            }
                        }
                    }
                    updateDiagramElement(modelElementMap, elementRegistry, graphicsFactory, canvas, newElement);
                }
            }
        });
    }
}

ElementUpdate.$inject = ['diagramEmitter', 'umlWebClient', 'modeling', 'canvas', 'elementRegistry', 'modelElementMap', 'graphicsFactory', 'elementFactory'];

function updateDiagramElement(modelElementMap, elementRegistry, graphicsFactory, canvas, newElement) {
    const diagramElementIDs = modelElementMap.get(newElement.id);
    if (diagramElementIDs) {
        for (const shapeID of diagramElementIDs) {
            const diagramElement = elementRegistry.get(shapeID);
            diagramElement.modelElement = newElement;
            if (diagramElement.width) {
                graphicsFactory.update('shape', diagramElement, canvas.getGraphics(diagramElement));
            } else if (diagramElement.waypoints) {
                graphicsFactory.update('connection', diagramElement, canvas.getGraphics(diagramElement));
            }
        }
    }
}

async function createNewShape(newShapeID, umlWebClient, elementRegistry, elementFactory, canvas) {
    const umlShape = await getUmlDiagramElement(newShapeID, umlWebClient);
    const owner = elementRegistry.get(umlShape.owningElement);
    const shape = elementFactory.createShape({
        x: umlShape.bounds.x,
        y: umlShape.bounds.y,
        width: umlShape.bounds.width,
        height: umlShape.bounds.height,
        update: true,
        id: newShapeID,
        modelElement: umlShape.modelElement,
    });
    canvas.addShape(shape, owner);
    return shape;
}

async function createNewLabel(newLabelID, umlWebClient, elementRegistry, elementFactory, canvas) {
    const umlLabel = await getUmlDiagramElement(newLabelID, umlWebClient);
    const owner = elementRegistry.get(umlLabel.owningElement);
    let labelTarget;

    // determine our target
    if (owner.modelElement.id === umlLabel.modelElement.id) {
        // owner is our target
        labelTarget = owner;
    } else {
        // look at children of owner
        for (const child of owner.children) {
            if (child.modelElement.id === umlLabel.modelElement.id) {
                labelTarget = child;
            }
        }
    }
    const label = elementFactory.createLabel({
        x: umlLabel.bounds.x,
        y: umlLabel.bounds.y,
        width: umlLabel.bounds.width,
        height: umlLabel.bounds.height,
        id: umlLabel.id,
        modelElement: umlLabel.modelElement,
        text: umlLabel.text,
        labelTarget: labelTarget
    });
    canvas.addShape(label, owner);
    return label;
}

async function createNewEdge(newElement, umlWebClient, elementRegistry, elementFactory, canvas) {
    const umlEdge = await getUmlDiagramElement(newElement.id, umlWebClient);
    const source = elementRegistry.get(umlEdge.source); 
    const target = elementRegistry.get(umlEdge.target);
    if (umlEdge.modelElement.isSubClassOf('association')) {
        for await (const memberEnd of umlEdge.modelElement.memberEnds) {}
    }
    
    // create connection
    const connection = elementFactory.createConnection({
        waypoints: umlEdge.waypoints,
        id: umlEdge.id,
        target: target,
        source: source,
        modelElement: umlEdge.modelElement,
        children: [],
    });
    const owner = elementRegistry.get(umlEdge.owningElement);
    canvas.addConnection(connection, owner);
    return connection;
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
