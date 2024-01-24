import { createElementUpdate, deleteElementElementUpdate } from '../../../umlUtil';
import { createDiagramShape, deleteUmlDiagramElement } from '../api/diagramInterchange';
import { PROPERTY_COMPARTMENT_HEIGHT } from './Property';

export const CLASS_SHAPE_HEADER_HEIGHT = 40;

class CreateClassHandler {

    constructor(umlWebClient, diagramContext, diagramEmitter, canvas) {
        this.umlWebClient = umlWebClient;
        this.diagramContext = diagramContext;
        this.diagramEmitter = diagramEmitter;
        this.canvas = canvas;
    }
    execute(event) {
        for (const element of event.elements) {
            element.x = event.x - element.width / 2;
            element.y = event.y - element.height / 2;
            this.canvas.addShape(element);
            createDiagramShape(element, this.umlWebClient, this.diagramContext);
            const classID = element.modelElement.id;
            let clazz = this.umlWebClient.post('class', {id:classID});
            this. diagramContext.context.packagedElements.add(clazz);
            this.umlWebClient.put(clazz);
            this.umlWebClient.put(this.diagramContext.context);
            element.modelElement = clazz;
            this.diagramEmitter.fire('elementUpdate', createElementUpdate(this.diagramContext.context));
        }
        return event.elements;
    }
    revert(event) {
        // get rid of class shape and also class model object
        const doLater = async (element) => {
            await deleteUmlDiagramElement(element.id, this.umlWebClient);
            this.diagramEmitter.fire('elementUpdate', deleteElementElementUpdate(element.modelElement));
            const owner = await element.modelElement.owner.get();
            await this.umlWebClient.deleteElement(element.modelElement);
            this.diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
        }
        const changedEls = [];
        for (const element of event.elements) {
            changedEls.push(element.parent);
            changedEls.push(element.parent);
            doLater(element);
            this.canvas.removeShape(element);
        }
        return changedEls;
    }
}

CreateClassHandler.$inject = ['umlWebClient', 'diagramContext', 'diagramEmitter', 'canvas'];

export default class ClassHandler {
    constructor(eventBus, modeling, umlWebClient, diagramContext, diagramEmitter, commandStack) {
        commandStack.registerHandler('class.create', CreateClassHandler);
        eventBus.on('create.end', 1100, (event) => {

            // TODO better logic to stop propogation
            let stopPropogation = false;
            for (const element of event.context.elements) {
                if (element.newUMLElement && element.modelElement.elementType() === 'class') {
                    stopPropogation = true;
                }
            }
            if (stopPropogation) {
                commandStack.execute('class.create', event);
                return false;
            }
        });
        // eventBus.on('shape.added', (event) => {
        //     if (event.element.newUMLElement && event.element.modelElement.elementType() === 'class') {
        //         commandStack.execute('class.create', event);
        //     }
        // });
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

ClassHandler.$inject = ['eventBus', 'modeling', 'umlWebClient', 'diagramContext', 'diagramEmitter', 'commandStack'];
