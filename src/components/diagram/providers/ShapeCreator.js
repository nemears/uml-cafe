import { createDiagramShape, deleteUmlDiagramElement } from "../api/diagramInterchange";

class ShapeCreationHandler {
    constructor(eventBus, umlWebClient, diagramContext, canvas, elementRegistry, diagramEmitter) {
        this.eventBus = eventBus;
        this.umlWebClient = umlWebClient;
        this.diagramContext = diagramContext;
        this.canvas = canvas;
        this.elementRegistry = elementRegistry;
        this.diagramEmitter = diagramEmitter;
    }
    execute(event) {
        if (event.proxy) {
            delete event.proxy;
            const elements = [];
            for (const element of event.elements) {
                const realElement = this.elementRegistry.get(element.id);
                elements.push(realElement);
            }
            event.context.elements = elements;
            return event.context.elements;
        }
        const elements = [];
        for (const element of event.context.elements) {
            elements.push({id: element.id, newUMLElement: element.newUMLElement});
        }
        this.diagramEmitter.fire('command', {name: 'shapeCreation', context: {
            elements: elements,
            x: event.x,
            y: event.y,
            context : {
                createModelElement: event.context.createModelElement,
                shapeType: event.context.shapeType,
            },
        }});
        for (const element of event.context.elements) {
            element.x = event.x - element.width / 2;
            element.y = event.y - element.height / 2;
            this.canvas.addShape(element);
            createDiagramShape(element, this.umlWebClient, this.diagramContext);
            this.eventBus.fire('diagramElementCreated', {
                element: element
            });
            if (event.context.createModelElement) {
                this.eventBus.fire('elementCreated', {
                    element: element
                });
            }
        }
        return event.context.elements;
    }
    revert(event) {
        this.diagramEmitter.fire('command', {undo: {
            // TODO
        }});
        for (const element of event.context.elements) {
            this.eventBus.fire('diagramElementDeleted', {
                element: element
            });
            this.canvas.removeShape(element);
            deleteUmlDiagramElement(element.id, this.umlWebClient); // async doing later
            if (event.context.createModelElement) {
                this.eventBus.fire('elementDeleted', {
                    element: element
                });
            }
        }
        return event.context.elements;
    }
}

ShapeCreationHandler.$inject = ['eventBus', 'umlWebClient', 'diagramContext', 'canvas', 'elementRegistry', 'diagramEmitter'];

export default class ShapeCreator {
    constructor(eventBus, commandStack) {
        commandStack.registerHandler('shapeCreation', ShapeCreationHandler);
        eventBus.on('create.end', 1100, (event) => {
            if (event.context.shapeType === 'shape') {
                commandStack.execute('shapeCreation', event);
                return false; // stop propogation
            }
        });
    }
}

ShapeCreator.$inject = ['eventBus', 'commandStack'];
