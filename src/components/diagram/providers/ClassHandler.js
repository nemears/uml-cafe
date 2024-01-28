import { createElementUpdate, deleteElementElementUpdate } from '../../../umlUtil';
import { PROPERTY_COMPARTMENT_HEIGHT } from './Property';

export const CLASS_SHAPE_HEADER_HEIGHT = 40;

export default class ClassHandler {
    constructor(eventBus, modeling, umlWebClient, diagramContext, diagramEmitter, canvas) {
        eventBus.on('elementCreated', (event) => {
            const element = event.element;
            if (element.modelElement.elementType() === 'class') {
                const classID = element.modelElement.id;
                let clazz = umlWebClient.post('class', {id:classID});
                diagramContext.context.packagedElements.add(clazz);
                umlWebClient.put(clazz);
                umlWebClient.put(diagramContext.context);
                element.modelElement = clazz;
                diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context));
            }
        });
        eventBus.on('elementDeleted', (event) => {
            const element = event.element;
            if (element.modelElement.elementType() === 'class') {
                const doLater = async (element) => {
                    const modelElement = await umlWebClient.get(element.modelElement.id);
                    const owner = await modelElement.owner.get();
                    diagramEmitter.fire('elementUpdate', deleteElementElementUpdate(modelElement));
                    await umlWebClient.deleteElement(modelElement);
                    diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
                }
                doLater(element);
                canvas.removeShape(element);
            }
        });
        eventBus.on('resize.start', (event) => {
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
        });
   }
}

ClassHandler.$inject = ['eventBus', 'modeling', 'umlWebClient', 'diagramContext', 'diagramEmitter', 'canvas'];
