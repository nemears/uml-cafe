import { getMid, roundBounds } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout';
import { getTextDimensions, LABEL_HEIGHT, PROPERTY_GAP } from './ClassDiagramPaletteProvider';
import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler';
import { adjustAttachedEdges, adjustShape } from './UmlShapeProvider';

export const CLASSIFIER_SHAPE_GAP_HEIGHT = 5;

class ResizeCompartmentableShapeHandler {
    constructor(diagramEmitter, umlWebClient, diagramContext, umlRenderer, eventBus, graphicsFactory, canvas) {
        this.diagramEmitter = diagramEmitter;
        this.umlWebClient = umlWebClient;
        this.diagramContext = diagramContext,
        this.umlRenderer = umlRenderer;
        eventBus.on('compartmentableShape.resize', (context) => {
            const shape = context.shape,
            newBounds = context.newBounds;
            shape.x = newBounds.x;
            shape.y = newBounds.y;
            shape.width = newBounds.width;
            shape.height = newBounds.height;
            
            adjustCompartmentsAndEdges(shape, this.umlRenderer);
            if (!context.update) {
                this.resize(context);
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
        const shapeInstance = await this.umlWebClient.get(context.shape.id);
        await adjustShape(context.shape, shapeInstance, this.umlWebClient);
        for (const child of context.shape.children) {
            if (context.shape.compartments.includes(child)) {
                for (const compartmentChild of child.children) {
                    adjustShape(compartmentChild, await this.umlWebClient.get(compartmentChild.id), this.umlWebClient);
                }
                continue;
            }
            const childInstance = await this.umlWebClient.get(child.id);
            await adjustShape(child, childInstance, this.umlWebClient);
        }
        await adjustAttachedEdges(context.shape, this.umlWebClient);
        this.umlWebClient.put(this.diagramContext.diagram);
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
            // TODO
            return context.shape;
        }

        // enforce minBounds
        if (context.minBounds.width > context.newBounds.width) {
            context.newBounds.width = context.minBounds.width;
        }
        if (context.minBounds.height > context.newBounds.height) {
            context.newBounds.height = context.minBounds.height;
        }

        const newBounds = roundBounds(context.newBounds);
        const shape = context.shape;
        context.oldBounds = {
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
        };
        this.diagramEmitter.fire('command', {name: 'resize.compartmentableShape.uml', context: {
            shape : {
                id: shape.id,
            },
            newBounds: newBounds,
            oldBounds: context.oldBounds,
        }});

        this.eventBus.fire('compartmentableShape.resize', context);
        
        return this.allChildren(context.shape);
    }
    revert(context) {
        this.diagramEmitter.fire('command', {undo: {}});
        const oldBounds = context.oldBounds,
        shape = context.shape;
        shape.x = oldBounds.x;
        shape.y = oldBounds.y;
        shape.width = oldBounds.width;
        shape.height = oldBounds.height;
       
        adjustCompartmentsAndEdges(shape, this.umlRenderer);

        this.resize(context);
        return this.allChildren(context.shape);
    }
}

ResizeCompartmentableShapeHandler.$inject = ['diagramEmitter', 'umlWebClient', 'diagramContext', 'umlRenderer', 'eventBus', 'graphicsFactory', 'canvas']; 

function adjustCompartmentsAndEdges(shape, umlRenderer) {
    let yPos = shape.y;
    if (shape.children.length - shape.compartments.length === 1) {
        yPos += CLASSIFIER_SHAPE_GAP_HEIGHT;
    } 
    for (const child of shape.children) {
        if (child.elementType === 'compartment') {
            continue;
        }
        child.x = shape.x;
        child.y = yPos;
        child.width = shape.width;
        yPos += 15; // TODO test
    } 
    // compartments
    yPos = shape.y + CLASS_SHAPE_HEADER_HEIGHT;
    let index = 0;
    for (const compartment of shape.compartments) {
        compartment.width = shape.width;
        compartment.x = shape.x;
        compartment.y = yPos;
        if (index == shape.compartments.length - 1) {
            // last element make height the rest of the shape
            compartment.height = shape.height + shape.y - yPos;
        } else {
            throw Error("TODO multiple compartments");
            // TODO adjust height based on children, change yPos
            // TODO compartment children
        }
        index++;

        let childYPos = compartment.y + CLASSIFIER_SHAPE_GAP_HEIGHT;
        for (const child of compartment.children) {
            if (child.elementType === 'typedElementLabel') {
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
    constructor(eventBus, commandStack, elementRegistry, elementFactory, canvas) {
        commandStack.registerHandler('resize.compartmentableShape.uml', ResizeCompartmentableShapeHandler);
        eventBus.on('resize.start', (event) => {
            const shape = event.shape;
            if (shape.elementType === 'compartmentableShape' || shape.elementType === 'classifierShape') {
                // overiding resize.start so that minSize is different
                delete event.context.resizeConstraints;
                let totalHeight = CLASS_SHAPE_HEADER_HEIGHT;
                for (const compartment of shape.compartments) {
                    totalHeight += CLASSIFIER_SHAPE_GAP_HEIGHT;
                    for (const child of compartment.children) {
                        if (child.elementType === 'typedElementLabel') {
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
            }
        });
        eventBus.on('resize.end', 1100, (event) => {
            const shape = event.shape;
            if (shape.elementType === 'compartmentableShape' || shape.elementType === 'classifierShape') {
                // adjust compartments
                commandStack.execute('resize.compartmentableShape.uml', event.context);
                event.context.canExecute = false;
            }
        });

        eventBus.on('server.create', (event) => {
            const elementType = event.serverElement.elementType();
            if (elementType === 'compartmentableShape' || elementType === 'classifierShape') {
                const umlShape = event.serverElement;
                const owner = elementRegistry.get(umlShape.owningElement);
                const shape = elementFactory.createShape({
                    x: umlShape.bounds.x,
                    y: umlShape.bounds.y,
                    width: umlShape.bounds.width,
                    height: umlShape.bounds.height,
                    update: true,
                    id: umlShape.id,
                    modelElement: umlShape.modelElement,
                    elementType: elementType,
                    compartments: [],
                });
                canvas.addShape(shape, owner);
            }
        });

        eventBus.on('server.update', (event) => {
            const elementType = event.serverElement.elementType();
            if (elementType === 'compartmentableShape' || elementType === 'classifierShape') {
                const umlShape = event.serverElement;
                const localShape = event.localElement;
                if (localShape.x != umlShape.bounds.x || localShape.y != umlShape.bounds.y || localShape.width != umlShape.bounds.width || localShape.height != umlShape.bounds.height){
                    eventBus.fire('compartmentableShape.resize', {
                        shape: localShape,
                        newBounds: umlShape.bounds,
                        update: true,
                    });
                }
            }
        });
    }
}

UmlCompartmentableShapeProvider.$inject = ['eventBus', 'commandStack', 'elementRegistry', 'elementFactory', 'canvas'];
