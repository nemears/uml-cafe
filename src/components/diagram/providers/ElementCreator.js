import { createClassifierShape, createComparment, createDiagramEdge, createDiagramLabel, createDiagramShape, createNameLabel, deleteUmlDiagramElement } from '../api/diagramInterchange';
import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler';
import { CLASSIFIER_SHAPE_GAP_HEIGHT } from './UmlCompartmentableShapeProvider';
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
        const assignPosition = (shape) => {
            shape.x = context.x - shape.width / 2;
            shape.y = context.y - shape.height / 2;
        }
        diagramEmitter.fire('command', {name: 'elementCreation', context: context});
        for (const element of context.elements) {
            switch (element.elementType) {
                case 'shape':
                    if (element.parent) {
                        // place within parent
                        throw Error('TODO');
                    } else {
                        assignPosition(element);
                    }
                    canvas.addShape(element);
                    // TODO children
                    createDiagramShape(element, umlWebClient, diagramContext);
                    break;
                case 'edge':
                    canvas.addConnection(element);
                    createDiagramEdge(element, umlWebClient, diagramContext);
                    // TODO children
                    break;
                case 'label':
                    if (element.parent) {
                        // TODO place within parent
                        throw Error('TODO');
                    } else {
                        assignPosition(element);
                    }
                    canvas.addShape(element);
                    // TODO children?
                    createDiagramLabel(element, umlWebClient, diagramContext);
                    break;
                case 'classifierShape':
                    if (element.parent) {
                        // TODO place within parent
                        throw Error('TODO');
                    } else {
                        assignPosition(element);
                    }
                    canvas.addShape(element);
                    // TODO children?
                    createClassifierShape(element, umlWebClient, diagramContext);
                    for (const compartment of element.compartments) {
                        compartment.x = element.x;
                        compartment.y = element.y + CLASS_SHAPE_HEADER_HEIGHT;
                        canvas.addShape(compartment, element);
                        createComparment(compartment, umlWebClient, diagramContext);
                        // TODO children?
                    }
                    break;
                case 'nameLabel':
                    if (element.parent) {
                        // TODO place within parent
                        element.x = element.parent.x;
                        element.y = element.parent.y + CLASSIFIER_SHAPE_GAP_HEIGHT;
                        canvas.addShape(element, element.parent);
                    } else {
                        assignPosition(element);
                        canvas.addShape(element);
                    }
                    // TODO children?
                    createNameLabel(element, umlWebClient, diagramContext);
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
        const diagramEmitter = this._diagramEmitter,
        eventBus = this._eventBus,
        canvas = this._canvas,
        umlWebClient = this._umlWebClient;
        diagramEmitter.fire('command', {undo: {
                       // TODO
        }});
        for (const element of context.elements) {
            eventBus.fire('diagramElementDeleted', {
                element: element
            });
            switch (element.elementType) {
                case 'shape':
                    // TODO children
                    canvas.removeShape(element);
                    deleteUmlDiagramElement(element);
                    break;
                case 'edge':
                    // TODO children
                    canvas.removeConnection(element);
                    deleteUmlDiagramElement(element);
                    break;
                case 'label':
                    // TODO children?
                    canvas.removeShape(element);
                    deleteUmlDiagramElement(element);
                    break;
                case 'classifierShape':
                    // TODO remove children
                    for (const compartment of element.compartments) {
                        // TODO remove children
                        canvas.removeShape(compartment);
                        deleteUmlDiagramElement(compartment.id, umlWebClient);
                    }
                    canvas.removeShape(element);
                    deleteUmlDiagramElement(element.id, umlWebClient); // async doing later
                    if (element.createModelElement) {
                        eventBus.fire('elementDeleted', {
                            element: element
                        });
                    }
                    break;
                default:
                    throw Error('invalid uml di elementType given to ElementCreationHandler!');
            }
        }
        return context.elements;
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
