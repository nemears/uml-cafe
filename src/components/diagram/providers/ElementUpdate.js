import { getUmlDiagramElement, deleteUmlDiagramElement } from '../api/diagramInterchange';

export default class ElementUpdate {

    modelElements = new Map();

    constructor(diagramEmitter, umlWebClient, modeling, canvas, elementRegistry, eventBus) {
        const me = this;
        elementRegistry.forEach((element) => {
            if (element.elementID) {
                me.modelElements.set(element.elementID, element.id);
            }
        });

        eventBus.on('shape.added', (event) => {
            me.modelElements.set(event.element.elementID, event.element.id);
        });
        eventBus.on('shape.remove', (event) => {
            me.modelElements.delete(event.element.elementID);
        });

        diagramEmitter.on('elementUpdate', async (event) => {
            for (const update of event.updatedElements) {
                const newElement = update.newElement;
                const oldElement = update.oldElement;
                if (oldElement) {
                    if (!newElement) {
                        // check if it is a modelElement being represented in the diagram
                        const shapeID = me.modelElements.get(oldElement.id);
                        if (shapeID) {
                            // it is a shape being tracked, lets delete the shape
                            modeling.removeShape(elementRegistry.get(shapeID));
                            await deleteUmlDiagramElement(shapeID, umlWebClient);
                        }
                    } else {
                        if (!newElement.isSubClassOf('instanceSpecification')) {
                            return;
                        }

                        let elementIsShapeType = false;
                        for (let classifierID of newElement.classifiers.ids()) {
                            if (classifierID === 'KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g' || classifierID === 'u2fIGW2nEDfMfVxqDvSmPd5e_wNR') {
                                elementIsShapeType = true;
                            }
                        }

                        if (!elementIsShapeType) {
                            return;
                        }
                        
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
                            me.modelElements.set(umlShape.modelElement.id, newElement.id);
                        }
                    }
                } else {
                    if (newElement.isSubClassOf('instanceSpecification')) {
                        console.log("ElementUpdate.js got new instanceSpecification " + newElement.id);
                        for (let classifierID of newElement.classifiers.ids()) {
                            if (classifierID === 'KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g') {
                                const umlShape = await createNewShape(newElement.id, umlWebClient, modeling, canvas);
                                me.modelElements.set(umlShape.modelElement.id, newElement.id);
                            } else if (classifierID === 'u2fIGW2nEDfMfVxqDvSmPd5e_wNR') {
                                // it is a umlEdge
                                const umlEdge = await getUmlDiagramElement(newElement.id, umlWebClient);
                                const source = elementRegistry.get(umlEdge.source); 
                                const target = elementRegistry.get(umlEdge.target); 
                                
                                // create connection
                                modeling.createConnection(
                                    source,
                                    target,
                                    undefined, // parent index (valid?)
                                    {
                                       source: source,
                                        target: target,
                                        waypoints: umlEdge.waypoints,
                                        id: newElement.id,
                                        elementID: umlEdge.modelElement.id,
                                        umlType: umlEdge.modelElement.elementType(),
                                    },
                                    canvas.getRootElement()
                                );
                            }
                        }
                    }
                }
            }
        });
    }
}

ElementUpdate.$inject = ['diagramEmitter', 'umlWebClient', 'modeling', 'canvas', 'elementRegistry', 'eventBus'];

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
        elementID: umlShape.modelElement.id,
        name: umlShape.modelElement.name,
    }, {
        x: umlShape.bounds.x + umlShape.bounds.width / 2,
        y: umlShape.bounds.y + umlShape.bounds.height / 2,
    }, canvas.getRootElement()); // TODO we want to do this with owningElement eventuall instead of assuming root

    return umlShape;
}
