import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler';
import { placeEdgeLabel } from './EdgeConnect';
import { translateDJEdgeToUMLEdge, translateDJLabelToUMLLabel, translateDJSCompartmentableShapeToUmlCompartmentableShape, translateDJShapeToUMLShape } from '../translations';
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
    constructor(eventBus, canvas, diagramContext, diagramEmitter, diManager) {
        this._eventBus = eventBus;
        this._canvas = canvas;
        this._diagramContext = diagramContext;
        this._diagramEmitter = diagramEmitter;
        this._diManager = diManager;
    }
    execute(context) {
        const eventBus = this._eventBus,
        canvas = this._canvas,
        diagramContext = this._diagramContext,
        diagramEmitter = this._diagramEmitter,
        diManager = this._diManager;
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
                case 'UMLShape':
                    if (element.parent) {
                        // place within parent
                        throw Error('TODO');
                    } else {
                        assignPosition(element);
                    }
                    canvas.addShape(element, context.target);
                    // TODO children
                    break;
                case 'UMLEdge':
                    canvas.addConnection(element);
                    // TODO children
                    break;
                case 'UMLLabel':
                    placeLabel(element);
                    // TODO children?
                    break;
                case 'UMLClassifierShape':
                    if (element.parent) {
                        // TODO place within parent
                        throw Error('TODO');
                    } else {
                        assignPosition(element);
                    }

                    element.sharedStyle = diagramContext.umlDiagram.classifierShapeStyle.unsafe();

                    canvas.addShape(element, context.target);
                    for (const compartment of element.compartments) {
                        compartment.x = element.x;
                        compartment.y = element.y + CLASS_SHAPE_HEADER_HEIGHT;
                        canvas.addShape(compartment, element);
                    }
                    break;
                case 'UMLNameLabel':
                case 'UMLTypedElementLabel':
                case 'UMLKeywordLabel':
                case 'UMLAssociationEndLabel':
                case 'UMLMultiplicityLabel':
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
                    case 'UMLShape': {
                        const shape = diManager.post('UML DI.UMLShape', { id : element.id });
                        await translateDJShapeToUMLShape(element, shape, diManager, diagramContext.umlDiagram);
                        await diManager.put(shape);
                        break;
                    }
                    case 'UMLEdge': {
                        const edge = diManager.post('UML DI.UMLEdge', { id : element.id });
                        await translateDJEdgeToUMLEdge(element, edge, diManager, diagramContext.umlDiagram);
                        await diManager.put(edge);
                        break;
                    }
                    case 'UMLLabel': {
                        const label = diManager.post('UML DI.UMLLabel', { id : element.id });
                        await translateDJLabelToUMLLabel(element, label, diManager, diagramContext.umlDiagram);
                        await diManager.put(label);
                        break;
                    }
                    case 'UMLClassifierShape': {
                        const classifierShape = diManager.post('UML DI.UMLClassifierShape', { id : element.id });
                        await translateDJSCompartmentableShapeToUmlCompartmentableShape(element, classifierShape, diManager, diagramContext.umlDiagram);
                        await diManager.put(classifierShape);
                        for await (const compartment of classifierShape.compartment) {
                            await diManager.put(compartment);
                        }
                        break;
                    }
                    case 'UMLNameLabel': {
                        const nameLabel = diManager.post('UML DI.UMLNameLabel', { id: element.id });
                        await translateDJLabelToUMLLabel(element, nameLabel, diManager, diagramContext.umlDiagram);
                        await diManager.put(nameLabel);
                        break;
                    }
                    case 'UMLTypedElementLabel': {
                        const typedElementLabel = diManager.post('UML DI.UMLTypedElementLabel', { id: element.id });
                        await translateDJLabelToUMLLabel(element, typedElementLabel, diManager, diagramContext.umlDiagram);
                        await diManager.put(typedElementLabel);
                        break;
                    }
                    case 'UMLKeywordLabel': {
                        const keywordLabel = diManager.post('UML DI.UMLKeywordLabel', { id : element.id });
                        await translateDJLabelToUMLLabel(element, keywordLabel, diManager, diagramContext.umlDiagram);
                        await diManager.put(keywordLabel);
                        break;
                    }
                    case 'UMLAssociationEndLabel': {
                        const associationEndLabel = diManager.post('UML DI.UMLAssociationEndLabel', { id : element.id });
                        await translateDJLabelToUMLLabel(element, associationEndLabel, diManager, diagramContext.umlDiagram);
                        await diManager.put(associationEndLabel);
                        break;
                    }
                    case 'UMLMultiplicityLabel': {
                        const multiplicityLabel = diManager.post('UML DI.UMLMultiplicityLabel', { id : element.id });
                        await translateDJLabelToUMLLabel(element, multiplicityLabel, diManager, diagramContext.umlDiagram);
                        await diManager.put(multiplicityLabel);
                        break;
                    }
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
        diManager = this._diManager,
        diagramContext = this._diagramContext;
        diagramEmitter.fire('command', {undo: {
                       // TODO
        }});
        for (const element of context.elements.toReversed()) {
            eventBus.fire('diagramElementDeleted', {
                element: element
            });
            switch (element.elementType) {
                case 'UMLShape':
                    // TODO children
                    canvas.removeShape(element);
                    break;
                case 'UMLEdge':
                    // TODO children
                    canvas.removeConnection(element);
                    element.numCenterLabels = 0;
                    element.numSourceLabels = 0;
                    element.numTargetLabels = 0;
                    break;
                case 'UMLNameLabel':
                case 'UMLTypedElementLabel':
                case 'UMLKeywordLabel':
                case 'UMLAssociationEndLabel':
                case 'UMLMultiplicityLabel': {
                    // TODO children?
                    canvas.removeShape(element);
                    element.x = element.x - context.x;
                    element.y = element.y - context.y;
                    break;
                }
                case 'UMLClassifierShape':
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
                    case 'UMLClassifierShape':
                    case 'UMLCompartmentableShape': {
                        const diElement = await diManager.get(element.id);
                        for await (const compartment of diElement.compartment) {
                            //await deleteUmlDiagramElement(compartment.id, umlWebClient);
                            await diManager.delete(compartment);
                        }
                        // await deleteUmlDiagramElement(element.id, umlWebClient);
                        await diManager.delete(diElement);
                        if (element.createModelElement) {
                            eventBus.fire('elementDeleted', {
                                element: element
                            });
                        }
                        break;
                    }
                    default:
                        await diManager.delete(await diManager.get(element.id));
                        // await deleteUmlDiagramElement(element.id, umlWebClient);
                        break;
                }
            }
            await diManager.put(diagramContext.umlDiagram);
        };
        doLater();
        return context.elements;
    }
}

ElementCreationHandler.$inject = [
    'eventBus', 
    'canvas', 
    'diagramContext', 
    'diagramEmitter', 
    'diManager'
];

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
