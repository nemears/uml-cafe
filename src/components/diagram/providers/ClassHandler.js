import { PROPERTY_COMPARTMENT_HEIGHT } from './Property';

export const CLASS_SHAPE_HEADER_HEIGHT = 40;

export default class ClassHandler {
    constructor(eventBus, modeling, umlWebClient, diagramContext) {
        eventBus.on('shape.added', (event) => {
            if (event.element.newUMLElement && event.element.modelElement.elementType() === 'class') {
                const createClass = async () => {
                    const classID = event.element.modelElement.id;
                    let clazz = await umlWebClient.post('class', {id:classID});
                    diagramContext.context.packagedElements.add(clazz);
                    umlWebClient.put(clazz);
                    umlWebClient.put(diagramContext.context);
                    await umlWebClient.get(classID);
                    event.element.modelElement = clazz;
                }
                createClass();
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

ClassHandler.$inject = ['eventBus', 'modeling', 'umlWebClient', 'diagramContext'];
