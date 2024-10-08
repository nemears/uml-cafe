import { getMid, roundBounds } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout';
import { getTextDimensions, PROPERTY_GAP } from './ClassDiagramPaletteProvider';
import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler';
import { adjustAttachedEdges } from './UmlShapeProvider';
import { translateDJLabelToUMLLabel, translateDJSCompartmentableShapeToUmlCompartmentableShape } from '../translations';

export const CLASSIFIER_SHAPE_GAP_HEIGHT = 5;

class ResizeCompartmentableShapeHandler {
    constructor(diagramEmitter, umlWebClient, diagramContext, umlRenderer, eventBus, graphicsFactory, canvas, diManager) {
        this.diagramEmitter = diagramEmitter;
        this.umlWebClient = umlWebClient;
        this.diagramContext = diagramContext,
        this.umlRenderer = umlRenderer;
        this.diManager = diManager;
        eventBus.on('compartmentableShape.resize', (context) => {
            const shape = context.shape,
            newBounds = context.newBounds;
            shape.x = newBounds.x;
            shape.y = newBounds.y;
            shape.width = newBounds.width;
            shape.height = newBounds.height;
            
            adjustCompartmentsAndEdges(shape, context.oldBounds, this.umlRenderer);
            if (!context.update) {
                this.resize(context);
                const elsChanged = [shape];
                for (const compartment of shape.compartments) {
                    elsChanged.push(compartment);
                }
                eventBus.fire('elements.changed', {elements: elsChanged});
            } else {
                graphicsFactory.update('shape', shape, canvas.getGraphics(shape));
                // update compartments
                for (const compartment of shape.compartments) {
                    graphicsFactory.update('shape', compartment, canvas.getGraphics(compartment));
                }
            }
        });
        this.eventBus = eventBus;
    }

    async resize(context) {
        const shapeInstance = await this.diManager.get(context.shape.id);
        await translateDJSCompartmentableShapeToUmlCompartmentableShape(context.shape, shapeInstance, this.diManager, this.diagramContext.umlDiagram);
        for (const child of context.shape.children) {
            if (context.shape.compartments.includes(child)) {
                for (const compartmentChild of child.children) {
                    const compartmentChildInstance = await this.diManager.get(compartmentChild.id);
                    if (compartmentChildInstance.is('UMLLabel')) {
                        await translateDJLabelToUMLLabel(compartmentChild, compartmentChildInstance, this.diManager, this.diagramContext.umlDiagram);
                        await this.diManager.put(compartmentChildInstance);
                    } else {
                        throw Error('TODO');
                    }
                }
                continue;
            }
            const childInstance = await this.diManager.get(child.id);
            if (childInstance.is('UMLLabel')) {
                await translateDJLabelToUMLLabel(child, childInstance, this.diManager, this.diagramContext.umlDiagram);
                await this.diManager.put(childInstance);
            } else if (childInstance.is('UMLCompartment')) {
                // no need to update
                continue;
            } else {
                throw Error('TODO element type for classifierShape child not handled ' + childInstance.elementType());
            }
        }
        await adjustAttachedEdges(context.shape, this.diManager, this.diagramContext.umlDiagram);
        await this.diManager.put(shapeInstance);
        await this.diManager.put(this.diagramContext.umlDiagram);
    }

    allChildren(element) {
        const ret = [];
        const queue = [element];
        while (queue.length > 0) {
            const front = queue.shift();
            ret.push(front);
            for (const child of front.children) {
                queue.push(child);
            }
            if (front.incoming) {
                for (const edge of front.incoming) {
                    queue.push(edge);
                }
            }
            if (front.outgoing) {
                for (const edge of front.outgoing) {
                    queue.push(edge);
                }
            }
        }
        return ret;
    }

    execute(context) {
        if (context.proxy) {
            delete context.proxy;
            return;
        }

        // enforce minBounds
        if (context.minBounds.width > context.newBounds.width) {
            context.newBounds.width = context.minBounds.width;
        }
        if (context.minBounds.height > context.newBounds.height) {
            context.newBounds.height = context.minBounds.height;
        }

        context.newBounds = roundBounds(context.newBounds);
        const shape = context.shape;
        context.oldBounds = {
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
        };
        this.diagramEmitter.fire('command', {name: 'resize.compartmentableShape.uml', context: context});
        this.eventBus.fire('compartmentableShape.resize', context);
        return this.allChildren(context.shape);
    }
    
    revert(context) {
        if (context.proxy) {
            delete context.proxy;
            return;
        }
        this.diagramEmitter.fire('command', {undo: {}});
        const oldBounds = context.oldBounds,
        shape = context.shape;
        shape.x = oldBounds.x;
        shape.y = oldBounds.y;
        shape.width = oldBounds.width;
        shape.height = oldBounds.height;
       
        adjustCompartmentsAndEdges(shape, context.newBounds, this.umlRenderer);

        this.resize(context);
        return this.allChildren(context.shape);
    }
}

ResizeCompartmentableShapeHandler.$inject = [
    'diagramEmitter', 
    'umlWebClient', 
    'diagramContext', 
    'umlRenderer', 
    'eventBus', 
    'graphicsFactory', 
    'canvas', 
    'diManager'
]; 

function adjustCompartmentsAndEdges(shape, oldBounds, umlRenderer) {
    // these are all in the "header" of the shape kind of (above the first compartment) (only in class diagrams)
    for (const child of shape.children) {
        if (child.elementType === 'UMLCompartment') {
            continue;
        }
        child.x = shape.x;
        const dy = oldBounds.y - child.y;
        child.y = shape.y - dy;
        child.width = shape.width;
    } 
    // compartments
    let index = 0;
    for (const compartment of shape.compartments) {
        compartment.width = shape.width;
        compartment.x = shape.x;
        const dy = oldBounds.y - compartment.y;
        compartment.y = shape.y - dy;
        if (index == shape.compartments.length - 1) {
            // last element make height the rest of the shape
            compartment.height = shape.height + shape.y - compartment.y;
        } else {
            throw Error("TODO multiple compartments");
            // TODO adjust height based on children, change yPos
            // TODO compartment children
        }
        index++;

        let childYPos = compartment.y + CLASSIFIER_SHAPE_GAP_HEIGHT;
        for (const child of compartment.children) {
            if (child.elementType === 'UMLTypedElementLabel') {
                // resize typedElementLabel
                child.x = compartment.x;
                child.y = childYPos;
                let width = Math.round(getTextDimensions(child.text, umlRenderer).width) + 15;
                if (width > compartment.width) {
                    width = compartment.width;
                }
                child.width = width;
                childYPos += PROPERTY_GAP;
            } else {
                throw Error('TODO handle resize of elementType ' + child.elementType + ' in compartment!');
            }
        }
    }

    // edges
    for (const edge of shape.incoming) {
        edge.waypoints = connectRectangles(edge.source, edge.target, getMid(edge.source), getMid(edge.target));
    }
    for (const edge of shape.outgoing) {
        edge.waypoints = connectRectangles(edge.source, edge.target, getMid(edge.source), getMid(edge.target));
    }
}

export default class UmlCompartmentableShapeProvider {
    constructor(eventBus, commandStack, elementRegistry, elementFactory, canvas, diagramContext, diManager, umlWebClient) {
        let root = undefined;
        commandStack.registerHandler('resize.compartmentableShape.uml', ResizeCompartmentableShapeHandler);
        eventBus.on('resize.start', 1500, (event) => {
            const shape = event.shape;
            if (shape.elementType === 'UMLCompartmentableShape' || shape.elementType === 'UMLClassifierShape') {
                // overiding resize.start so that minSize is different
                let totalHeight = CLASS_SHAPE_HEADER_HEIGHT;
                for (const compartment of shape.compartments) {
                    totalHeight += CLASSIFIER_SHAPE_GAP_HEIGHT;
                    for (const child of compartment.children) {
                        if (child.elementType === 'UMLTypedElementLabel') {
                            totalHeight += PROPERTY_GAP;
                        } else {
                            throw Error('TODO handle minimum resize of compartmentable shape with child of type ' + child.elementType + ' in compartment');
                        }
                    }
                }

                event.context.minBounds = {
                    width: 50,
                    height: totalHeight,
                }

                const minBounds = event.context.minBounds;

                switch (event.context.direction) {
                    case 'nw':
                        // top left
                        minBounds.x = shape.x + shape.width - minBounds.width;
                        minBounds.y = shape.y + shape.height - minBounds.height;
                        break;
                    case 'w':
                        // left
                        minBounds.x = shape.x + shape.width - minBounds.width;
                        minBounds.y = shape.y; // doesn't matter
                        break;
                    case 'sw':
                        // bottom left
                        minBounds.x = shape.x + shape.width - minBounds.width;
                        minBounds.y = shape.y;
                        break;
                    case 's':
                        // bottom
                        minBounds.x = shape.x; // doesn't matter
                        minBounds.y = shape.y;
                        break;
                    case 'se':
                        // bottom right
                        minBounds.x = shape.x;
                        minBounds.y = shape.y;
                        break;
                    case 'e':
                        minBounds.x = shape.x;
                        minBounds.y = shape.y // doesn't matter
                        break;
                    case 'ne':
                        minBounds.x = shape.x;
                        minBounds.y = shape.y + shape.height - minBounds.height;
                        break;
                    case 'n':
                        minBounds.x = shape.x; // doesn't matter
                        minBounds.y = shape.y + shape.height - minBounds.height;
                        break;
                    default:
                        throw Error('bad direction!');
                }
                
                event.context.childrenBoxPadding = 0;
            }
        });
        eventBus.on('resize.end', 1100, (event) => {
            const shape = event.shape;
            if (shape.elementType === 'UMLCompartmentableShape' || shape.elementType === 'UMLClassifierShape') {
                // adjust compartments
                commandStack.execute('resize.compartmentableShape.uml', event.context);
                event.context.canExecute = false;
            }
        });

        eventBus.on('server.create', (event) => {
            if (event.serverElement.is('UMLCompartmentableShape')) {
                const umlShape = event.serverElement;
                let owner = elementRegistry.get(umlShape.owningElement.id());

                // if owner is diagram, just add it to root instead (difference between omg DI and diagram-js)
                if (owner && owner.id === diagramContext.umlDiagram.id) {
                    if (!root) {
                        root = canvas.findRoot(owner);
                    }
                    owner = root;
                }
                const bounds = diManager.getLocal(umlShape.bounds.id());
                const modelElement = umlWebClient.getLocal(diManager.getLocal(umlShape.modelElement.ids().front()).modelElementID);
                
                const shape = elementFactory.createShape({
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    update: true,
                    id: umlShape.id,
                    modelElement: modelElement,
                    elementType: umlShape.elementType(),
                    compartments: [],
                });
                const doLater = async () => {
                    if (umlShape.sharedStyle.has()) {
                        const sharedStyle = await umlShape.sharedStyle.get();
                        await sharedStyle.fillColor.get();
                        await sharedStyle.fontColor.get();
                        await sharedStyle.strokeColor.get();
                        shape.sharedStyle = sharedStyle;
                    }
                    if (umlShape.localStyle.has()) {
                        const localStyle = await umlShape.localStyle.get();
                        await localStyle.fillColor.get();
                        await localStyle.fontColor.get();
                        await localStyle.strokColor.get();
                        shape.localStyle = localStyle;
                    }
                    // force rerender
                    const elsToUpdate = [];
                    const addElAndAllChildren = (elToAdd) => {
                        elsToUpdate.push(elToAdd);
                        for (const child of elToAdd.children) {
                            addElAndAllChildren(child);
                        }
                    };
                    addElAndAllChildren(shape);
                    eventBus.fire('elements.changed', {elements: elsToUpdate});
                };
                doLater();
                canvas.addShape(shape, owner);
                modelElement.owner.get(); // async loading for future operations
            }
        });

        eventBus.on('server.update', (event) => {
            if (event.serverElement.is('UMLCompartmentableShape')) {
                const umlShape = event.serverElement;
                const localShape = event.localElement;
                const bounds = diManager.getLocal(umlShape.bounds.id()); // does unsafe() do getLocal?
                if (localShape.x != bounds.x || localShape.y != bounds.y || localShape.width != bounds.width || localShape.height != bounds.height){
                    eventBus.fire('compartmentableShape.resize', {
                        shape: localShape,
                        newBounds: bounds,
                        update: true,
                        oldBounds: {
                            x: localShape.x,
                            y: localShape.y,
                            width: localShape.width,
                            height: localShape.height,
                        }
                    });
                    eventBus.fire('elements.changed', {elements: [localShape]});
                }
                if (umlShape.localStyle.has()) {
                    const doLater = async () => {
                        const localStyle = await umlShape.localStyle.get();
                        await localStyle.fillColor.get();
                        await localStyle.fontColor.get();
                        await localStyle.strokeColor.get();
                        localShape.localStyle = localStyle;

                        // force rerender
                        const elsToUpdate = [];
                        const addElAndAllChildren = (elToAdd) => {
                            elsToUpdate.push(elToAdd);
                            for (const child of elToAdd.children) {
                                addElAndAllChildren(child);
                            }
                        };
                        addElAndAllChildren(localShape);
                        eventBus.fire('elements.changed', {elements: elsToUpdate});
                    };
                    doLater();
                }
            }
        });
        
        eventBus.on('server.delete', (event) => {
            const element = event.element;
            if (element.is('UMLCompartmentableShape')) {
                canvas.removeShape(element);
            }
        });
    }
}

UmlCompartmentableShapeProvider.$inject = [
    'eventBus', 
    'commandStack', 
    'elementRegistry', 
    'elementFactory', 
    'canvas', 
    'diagramContext',
    'diManager',
    'umlWebClient'
];
