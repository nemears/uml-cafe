import { createAssociationEndLabel, createClassifierShape, createComparment, createDiagramEdge, createDiagramLabel, createDiagramShape, createKeywordLabel, createMultiplicityLabel, createNameLabel, createTypedElementLabel, deleteUmlDiagramElement } from '../api/diagramInterchange';
import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler';
import { placeEdgeLabel } from './EdgeConnect';
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
            return;
        }
        const assignPosition = (shape) => {
            shape.x = context.x - Math.round(shape.width / 2);
            shape.y = context.y - Math.round(shape.height / 2);
        }
        const placeLabel = (element) => {
            if (element.owningElement) {
                // place within parent
                if (element.owningElement.waypoints) {
                    placeEdgeLabel(element, element.owningElement);
                } else {
                    element.x = Math.round(element.x + context.x);
                    element.y = Math.round(element.y + context.y);
                }

                // update model element if relevant just in case
                if (element.modelElement && 
                    element.owningElement.modelElement && 
                    element.owningElement.modelElement.id === element.modelElement.id)
                {
                    element.modelElement = element.owningElement.modelElement;
                }
                canvas.addShape(element, element.owningElement);
            } else {
                assignPosition(element);
                canvas.addShape(element, context.target);
            }
        };
        for (const element of context.elements) {
            switch (element.elementType) {
                case 'shape':
                    if (element.parent) {
                        // place within parent
                        throw Error('TODO');
                    } else {
                        assignPosition(element);
                    }
                    canvas.addShape(element, context.target);
                    // TODO children
                    break;
                case 'edge':
                    canvas.addConnection(element);
                    // TODO children
                    break;
                case 'label':
                    placeLabel(element);
                    // TODO children?
                    break;
                case 'classifierShape':
                    if (element.parent) {
                        // TODO place within parent
                        throw Error('TODO');
                    } else {
                        assignPosition(element);
                    }
                    canvas.addShape(element, context.target);
                    for (const compartment of element.compartments) {
                        compartment.x = element.x;
                        compartment.y = element.y + CLASS_SHAPE_HEADER_HEIGHT;
                        canvas.addShape(compartment, element);
                    }
                    break;
                case 'nameLabel':
                case 'typedElementLabel':
                case 'keywordLabel':
                case 'associationEndLabel':
                case 'multiplicityLabel':
                    placeLabel(element); 
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

        diagramEmitter.fire('command', {name: 'elementCreation', context: context});

        const doLater = async () => {
            for (const element of context.elements) {
                switch (element.elementType) {
                    case 'shape':
                        await createDiagramShape(element, umlWebClient, diagramContext);
                        break;
                    case 'edge':
                        await createDiagramEdge(element, umlWebClient, diagramContext);
                        break;
                    case 'label':
                        createDiagramLabel(element, umlWebClient, diagramContext);
                        break;
                    case 'classifierShape':
                        await createClassifierShape(element, umlWebClient, diagramContext);
                        for (const compartment of element.compartments) {
                            await createComparment(compartment, umlWebClient, diagramContext);
                        }
                        break;
                    case 'nameLabel':
                        await createNameLabel(element, umlWebClient, diagramContext);
                        break;
                    case 'typedElementLabel':
                        await createTypedElementLabel(element, umlWebClient, diagramContext);
                        break;
                    case 'keywordLabel':
                        await createKeywordLabel(element, umlWebClient, diagramContext);
                        break;
                    case 'associationEndLabel':
                        await createAssociationEndLabel(element, umlWebClient, diagramContext);
                        break;
                    case 'multiplicityLabel':
                        await createMultiplicityLabel(element, umlWebClient, diagramContext);
                        break;
                    default:
                        throw Error('invalid uml di elementType given to ElementCreationHandler!');
                }    
            }
        }
        doLater();
        return context.elements;
    }
    revert(context) {

        // TODO better more reproducible way to do this
        if (context.proxy) {
            delete context.proxy;
            return;
        }

        const diagramEmitter = this._diagramEmitter,
        eventBus = this._eventBus,
        canvas = this._canvas,
        umlWebClient = this._umlWebClient;
        diagramEmitter.fire('command', {undo: {
                       // TODO
        }});
        for (const element of context.elements.toReversed()) {
            eventBus.fire('diagramElementDeleted', {
                element: element
            });
            switch (element.elementType) {
                case 'shape':
                    // TODO children
                    canvas.removeShape(element);
                    break;
                case 'edge':
                    // TODO children
                    canvas.removeConnection(element);
                    break;
                case 'nameLabel':
                case 'typedElementLabel':
                case 'keywordLabel':
                case 'associationEndLabel':
                case 'multiplicityLabel': {
                    // TODO children?
                    canvas.removeShape(element);
                    element.x = element.x - context.x;
                    element.y = element.y - context.y;
                    break;
                }
                case 'classifierShape':
                    // TODO remove children
                    for (const compartment of element.compartments) {
                        // TODO remove children
                        canvas.removeShape(compartment);
                    }
                    canvas.removeShape(element);
                    break;
                default:
                    throw Error('invalid uml di elementType given to ElementCreationHandler!');
            }
        }
        const doLater = async () => {
            for (const element of context.elements.toReversed()) {
                switch (element.elementType) {
                    case 'classifierShape':
                    case 'compartmentableShape':
                        for (const compartment of element.compartments) {
                            await deleteUmlDiagramElement(compartment.id, umlWebClient);
                        }
                        await deleteUmlDiagramElement(element.id, umlWebClient);
                        if (element.createModelElement) {
                            eventBus.fire('elementDeleted', {
                                element: element
                            });
                        }
                        break;
                    default:
                        await deleteUmlDiagramElement(element.id, umlWebClient);
                        break;
                }
            }
        };
        doLater();
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
