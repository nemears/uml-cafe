import { createClassifierShape, createComparment, createDiagramEdge, createDiagramLabel, createDiagramShape } from '../api/diagramInterchange';
import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler'; 
/**
 * context for this commandHandler looks like this
 * {
 *      elements: list of elements to create, each element must have a uml modelElement and a valid id
 *          e.g: 
 *          {
 *              id: valid 28 character id
 *              modelElement: uml model element
 *              createModelElement: bool for whether the model element is a proxy and needs to be created
 *              elementType: a string representing the uml di element type this element is representing
 *          }
 *      proxy: boolean on whether it is "fake" command to just load for proxy,
 *      x: x postion of event
 *      y: y position of event
 * }
 **/
class ElementCreationHandler {
    constructor(eventBus, canvas, umlWebClient, diagramContext, diagramEmitter) {
        this._eventBus = eventBus;
        this._canvas = canvas;
        this._umlWebClient = umlWebClient;
        this._diagramContext = diagramContext;
        this._diagramEmitter = diagramEmitter;
    }
    execute(context) {
        const eventBus = this._eventBus,
        canvas = this._canvas,
        umlWebClient = this._umlWebClient,
        diagramContext = this._diagramContext,
        diagramEmitter = this._diagramEmitter;
        if (context.proxy) {
            delete context.proxy;
            return context.elements; // TODO get valid element
        }
        for (const element of context.elements) {
            switch(element.elementType) {
                case 'shape':
                case 'label':
                case 'classifierShape':
                    element.x = context.x - element.width / 2;
                    element.y = context.y - element.height / 2;
            }
        }
        diagramEmitter.fire('command', {name: 'elementCreation', context: context});
        for (const element of context.elements) {
            switch (element.elementType) {
                case 'shape':
                    canvas.addShape(element);
                    createDiagramShape(element, umlWebClient, diagramContext);
                    break;
                case 'edge':
                    canvas.addConnection(element);
                    createDiagramEdge(element, umlWebClient, diagramContext);
                    break;
                case 'label':
                    canvas.addShape(element);
                    createDiagramLabel(element, umlWebClient, diagramContext);
                    break;
                case 'classifierShape':
                    canvas.addShape(element);
                    createClassifierShape(element, umlWebClient, diagramContext);
                    for (const compartment of element.compartments) {
                        compartment.x = element.x;
                        compartment.y = element.y + CLASS_SHAPE_HEADER_HEIGHT;
                        canvas.addShape(compartment, element);
                        createComparment(compartment, umlWebClient, diagramContext)
                    }
                    break;
                default:
                    throw Error('invalid uml di elementType given to ElementCreationHandler!');
            }
            eventBus.fire('diagramElementCreated', {
                element: element
            });
            if (element.createModelElement) {
                eventBus.fire('elementCreated', {
                    element: element
                });
            }
        }
        return context.elements;
    }
    revert(context) {
    }
}

ElementCreationHandler.$inject = ['eventBus', 'canvas', 'umlWebClient', 'diagramContext', 'diagramEmitter'];

export default class ElementCreator {
    constructor(eventBus, commandStack) {
        commandStack.registerHandler('elementCreation', ElementCreationHandler);
        eventBus.on('create.end', 1100, (event) => {
            event.context.x = event.x;
            event.context.y = event.y;
            commandStack.execute('elementCreation', event.context);
            return false;
        });
    }
}

ElementCreator.$inject = ['eventBus', 'commandStack'];
