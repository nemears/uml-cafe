import { createDiagramShape, deleteUmlDiagramElement } from "../api/diagramInterchange";

class ElementCreationHandler {
    constructor(eventBus, umlWebClient, diagramContext, canvas, elementRegistry, diagramEmitter, elementFactory) {
        this.eventBus = eventBus;
        this.umlWebClient = umlWebClient;
        this.diagramContext = diagramContext;
        this.canvas = canvas;
        this._elementRegistry = elementRegistry;
        this.diagramEmitter = diagramEmitter;
        this._elementFactory = elementFactory;
    }
    execute(event) {
        const elementFactory = this._elementFactory,
        elementRegistry = this._elementRegistry;
        if (event.proxy) {
            delete event.proxy;
            const elements = [];
            for (const element of event.elements) {
                let realElement = elementRegistry.get(element.id);
                if (!realElement) {
                    realElement = elementFactory.createShape(element);
                }
                if (element.newUMLElement) {
                    realElement.newUMLElement = true;
                }
                elements.push(realElement);
            }
            event.context.elements = elements;
            return event.context.elements;
        }
        const elements = [];
        for (const element of event.context.elements) {
            elements.push(
                {
                    id: element.id, 
                    newUMLElement: element.newUMLElement,
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height,
                    modelElement: element.modelElement,
                }
            );
        }
        this.diagramEmitter.fire('command', {name: 'elementCreation', context: {
            elements: elements,
            x: event.x,
            y: event.y,
            context : {},
        }});
        for (const element of event.context.elements) {
            element.x = event.x - element.width / 2;
            element.y = event.y - element.height / 2;
            this.canvas.addShape(element);
            createDiagramShape(element, this.umlWebClient, this.diagramContext);
            this.eventBus.fire('diagramElementCreated', {
                element: element
            });
            if (element.newUMLElement) {
                this.eventBus.fire('elementCreated', {
                    element: element
                });
            }
        }
        return event.context.elements;
    }
    revert(event) {
        if (event.proxy) {
            delete event.proxy;
            return;
        }
        this.diagramEmitter.fire('command', {undo: {
            // TODO
        }});
        for (const element of event.context.elements) {
            this.eventBus.fire('diagramElementDeleted', {
                element: element
            });
            this.canvas.removeShape(element);
            deleteUmlDiagramElement(element.id, this.umlWebClient); // async doing later
            if (element.newUMLElement) {
                this.eventBus.fire('elementDeleted', {
                    element: element
                });
            }
        }
        return event.context.elements;
    }
}

ElementCreationHandler.$inject = ['eventBus', 'umlWebClient', 'diagramContext', 'canvas', 'elementRegistry', 'diagramEmitter', 'elementFactory'];

export default class ElementCreator {
    constructor(eventBus, commandStack) {
        commandStack.registerHandler('elementCreation', ElementCreationHandler);
        eventBus.on('create.end', 1100, (event) => {
            commandStack.execute('elementCreation', event);
            return false; // stop propogation
        });
    }
}

ElementCreator.$inject = ['eventBus', 'commandStack'];