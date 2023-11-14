import { getUmlDiagramElement } from '../api/diagramInterchange';

export default class ElementUpdate {

    constructor(diagramEmitter, umlWebClient, modeling, canvas, elementRegistry) {
        diagramEmitter.on('elementUpdate', async (event) => {
            // TODO check if element is a shape
            if (event.oldElement) {
                if (!event.newElement.isSubClassOf('instanceSpecification')) {
                    return;
                }

                console.log("diagramPage.js got update to instanceSpecification " + event.oldElement.id);

                let elementIsShapeType = false;
                for (let classifierID of event.newElement.classifiers.ids()) {
                    if (classifierID === 'KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g' || classifierID === 'u2fIGW2nEDfMfVxqDvSmPd5e_wNR') {
                        elementIsShapeType = true;
                    }
                }

                if (!elementIsShapeType) {
                    return;
                }
                
                // check if the element is in the diagram (on big diagrams with a lot of users this could get laggy)
                const diagramShape = elementRegistry.get(event.oldElement.id);
                if (diagramShape) {
                    // the element updated is a diagram shape
                    const umlShape = await getUmlDiagramElement(event.oldElement.id, umlWebClient);

                    // change bounds in diagram
                    modeling.resizeShape(diagramShape, umlShape.bounds);
                } else {
                    // not being tracked by diagram yet
                    await createNewShape(event.newElement.id, umlWebClient, modeling, canvas);
                } 
            } else {
                if (event.newElement.isSubClassOf('instanceSpecification')) {
                    console.log("ElementUpdate.js got new instanceSpecification " + event.newElement.id);
                    for (let classifierID of event.newElement.classifiers.ids()) {
                        if (classifierID === 'KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g') {
                            await createNewShape(event.newElement.id, umlWebClient, modeling, canvas);       
                        } else if (classifierID === 'u2fIGW2nEDfMfVxqDvSmPd5e_wNR') {
                            // it is a umlEdge
                            const umlEdge = await getUmlDiagramElement(event.newElement.id, umlWebClient);
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
                                    id: event.newElement.id,
                                    elementID: umlEdge.modelElement.id,
                                    umlType: umlEdge.modelElement.elementType(),
                                },
                                canvas.getRootElement()
                            );
                        }
                    }
                }
            }
        });
    }
}

ElementUpdate.$inject = ['diagramEmitter', 'umlWebClient', 'modeling', 'canvas', 'elementRegistry'];

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
}
