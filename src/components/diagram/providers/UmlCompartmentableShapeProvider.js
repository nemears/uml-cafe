import { getMid, roundBounds } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout';
import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler';
import { adjustAttachedEdges, adjustShape } from './UmlShapeProvider';

class ResizeCompartmentableShapeHandler {
    constructor(diagramEmitter, graphicsFactory, canvas, umlWebClient, diagramContext) {
        this.diagramEmitter = diagramEmitter;
        this.graphicsFactory = graphicsFactory;
        this.canvas = canvas;
        this.umlWebClient = umlWebClient;
        this.diagramContext = diagramContext;
    }

    async resize(context) {
        const shapeInstance = await this.umlWebClient.get(context.shape.id);
        await adjustShape(context.shape, shapeInstance, this.umlWebClient);
        for (const child of context.shape.children) {
            if (context.shape.compartments.includes(child)) {
                continue;
            }
            const childInstance = await this.umlWebClient.get(child.id);
            await adjustShape(child, childInstance, this.umlWebClient);
        }
        await adjustAttachedEdges(context.shape, this.umlWebClient);
        this.umlWebClient.put(this.diagramContext.diagram);
    }

    execute(context) {
        if (context.proxy) {
            delete context.proxy;
            // TODO
            return context.shape;
        }
        const newBounds = roundBounds(context.newBounds);
        const shape = context.shape;
        context.oldBounds = {
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
        };
        this.diagramEmitter.fire('command', {name: 'resize.shape.uml', context: {
            shape : {
                id: shape.id,
            },
            newBounds: newBounds,
            oldBounds: context.oldBounds,
        }});
        shape.x = newBounds.x;
        shape.y = newBounds.y;
        shape.width = newBounds.width;
        shape.height = newBounds.height;
        this.graphicsFactory.update('shape', shape, this.canvas.getGraphics(shape));

        // TODO subshapes that are not compartments
        
        // compartments
        let yPos = shape.y + CLASS_SHAPE_HEADER_HEIGHT;
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
            this.graphicsFactory.update('shape', compartment, this.canvas.getGraphics(compartment));
            index++;
        }

        // edges
        for (const edge of shape.incoming) {
            edge.waypoints = connectRectangles(edge.source, edge.target, getMid(edge.source), getMid(edge.target));
            this.graphicsFactory.update('connection', edge, this.canvas.getGraphics(edge));
        }
        for (const edge of shape.outgoing) {
            edge.waypoints = connectRectangles(edge.source, edge.target, getMid(edge.source), getMid(edge.target));
        }
        this.resize(context);
        return context.shape;
    }
    revert(context) {
        throw Error("TODO rever compartmentableShape resize");
    }
}

ResizeCompartmentableShapeHandler.$inject = ['diagramEmitter', 'graphicsFactory', 'canvas', 'umlWebClient', 'diagramContext']; 

export default class UmlCompartmentableShapeProvider {
    constructor(eventBus, commandStack) {
        commandStack.registerHandler('resize.compartmentableShape.uml', ResizeCompartmentableShapeHandler);
        eventBus.on('resize.start', (event) => {
            const shape = event.shape;
            if (shape.elementType === 'compartmentableShape' || shape.elementType === 'classifierShape') {
                // overiding resize.start so that minSize is different
                delete event.context.resizeConstraints;
                let totalHeight = CLASS_SHAPE_HEADER_HEIGHT;
                for (const compartment of shape.compartments) {
                    // TODO add compartment items to height
                }
                event.context.minBounds = {
                    width: 0,
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
    }
}

UmlCompartmentableShapeProvider.$inject = ['eventBus', 'commandStack'];
