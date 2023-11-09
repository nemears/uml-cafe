import { getUmlDiagramElement } from '../api/diagramInterchange';

export default class ElementUpdate {

    constructor(diagramEmitter, umlWebClient, modeling, canvas, elementRegistry) {
        diagramEmitter.on('elementUpdate', async (event) => {
            // TODO check if element is a shape
            if (event.oldElement) {
                // the element is already being tracked and exists in diagram, move it
                const diagramShape = elementRegistry.get(event.oldElement.id);
                if (diagramShape) {
                    // the element updated is a diagram shape InstanceSpecification
                    // check new position
                    const umlShape = await getUmlDiagramElement(event.oldElement.id, umlWebClient);

                    // change bounds
                    modeling.resizeShape(diagramShape, umlShape.bounds);
                } 
            } else {
                if (event.newElement.isSubClassOf('instanceSpecification')) {
                    for (let classifierID of event.newElement.classifiers.ids()) {
                        if (classifierID === 'KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g') {
                            // it is a umlShape, let's see if it is owned by this diagram
                            // TODO check if it is owned by this diagram
                            // just assuming it is now
                            // the element has not been made yet, create it
                            const umlShape = await getUmlDiagramElement(event.newElement.id, umlWebClient);
                            // assuming it is a shape
                            modeling.createShape({
                                width: umlShape.bounds.width,
                                height: umlShape.bounds.height,
                                // TODO uml stuff
                                update: true, // just saying it is from the backend
                                id: event.newElement.id,
                                elementID: umlShape.modelElement.id,
                                name: umlShape.modelElement.name,
                            }, {
                                x: umlShape.bounds.x + umlShape.bounds.width / 2,
                                y: umlShape.bounds.y + umlShape.bounds.height / 2,
                            }, canvas.getRootElement()); // TODO we want to do this with owningElement eventuall instead of assuming root
                        }
                    }
                }
                
            }
        });
    }
}

ElementUpdate.$inject = ['diagramEmitter', 'umlWebClient', 'modeling', 'canvas', 'elementRegistry'];
