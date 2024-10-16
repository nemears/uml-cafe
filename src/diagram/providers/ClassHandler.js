import { createElementUpdate, deleteElementElementUpdate } from '../../umlUtil';
//import { PROPERTY_COMPARTMENT_HEIGHT } from './Property';

export const CLASS_SHAPE_HEADER_HEIGHT = 40;

export default class ClassHandler {
    constructor(eventBus, modeling, umlWebClient, diagramContext, diagramEmitter, canvas) {
        eventBus.on('elementCreated', (event) => {
            const element = event.element;
            if (element.modelElement.elementType() === 'Class') {
                const classID = element.modelElement.id;
                let clazz = umlWebClient.post('Class', {id:classID});
                let owner = umlWebClient.getLocal(diagramContext.context.id);
                clazz.owningPackage.set(owner);
                umlWebClient.put(clazz);
                umlWebClient.put(owner);

                // bfs set modelElement
                const queue = [element];
                while (queue.length > 0) {
                    const front = queue.shift();
                    if (front.modelElement && front.modelElement.id === classID) {
                        front.modelElement = clazz; 
                    }
                    for (const child of front.children) {
                        queue.push(child);
                    }
                }

                diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
            }
        });
        eventBus.on('elementDeleted', (event) => {
            const element = event.element;
            if (element.modelElement.elementType() === 'Class') {
                const doLater = async (element) => {
                    const modelElement = await umlWebClient.get(element.modelElement.id);
                    const owner = await modelElement.owner.get();
                    diagramEmitter.fire('elementUpdate', deleteElementElementUpdate(modelElement));
                    await umlWebClient.delete(modelElement);
                    diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
                    umlWebClient.put(owner);
                }
                doLater(element);
                canvas.removeShape(element);
            }
        });
        /**eventBus.on('resize.start', (event) => {
            if (event.shape.modelElement && event.shape.modelElement.isSubClassOf('classifier')) {
                // overiding resize.start so that minSize is different
                delete event.context.resizeConstraints;
                event.context.minBounds = {
                    width: 0,
                    height: CLASS_SHAPE_HEADER_HEIGHT + event.shape.children.length * PROPERTY_COMPARTMENT_HEIGHT
                }
            }
        });
        eventBus.on('resize.end', (event) => {
            const shape = event.shape;
            if (shape.modelElement.isSubClassOf('classifier')) {
                let totalHeight = CLASS_SHAPE_HEADER_HEIGHT;
                for (const child of shape.children) {
                    modeling.resizeShape(
                        child, 
                        {
                            x: shape.x + 8,
                            y: shape.y + totalHeight,
                            width: shape.width - 16,
                            height: child.height
                        }
                    );
                    totalHeight += 5 + child.height;
                }
                if (totalHeight > shape.height) {
                    modeling.resizeShape(
                        shape, 
                        {
                            x : shape.x,
                            y : shape.y,
                            height: totalHeight,
                            width: shape.width,
                        }
                    );
                }
            } 
        });**/
        eventBus.on('selection.changed', 1100, (context) => {
            const selectedCompartments = context.newSelection.filter(el => el.elementType === 'UMLCompartment');
            for (const compartment of selectedCompartments) {
                // remove compartment from selection
                context.newSelection.splice(context.newSelection.indexOf(compartment), 1);
                if (!context.newSelection.includes(compartment.parent)) {
                    context.newSelection.push(compartment.parent);
                }
            }
        });
    }
}

ClassHandler.$inject = ['eventBus', 'modeling', 'umlWebClient', 'diagramContext', 'diagramEmitter', 'canvas'];
