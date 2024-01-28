import { createDiagramShape, deleteUmlDiagramElement } from "../api/diagramInterchange";

class ElementCreationHandler {
    constructor(eventBus, umlWebClient, diagramContext, canvas) {
        this.eventBus = eventBus;
        this.umlWebClient = umlWebClient;
        this.diagramContext = diagramContext;
        this.canvas = canvas;
    }
    execute(event) {
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

ElementCreationHandler.$inject = ['eventBus', 'umlWebClient', 'diagramContext', 'canvas'];

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