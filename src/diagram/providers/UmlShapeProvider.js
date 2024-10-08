import { getMid, roundBounds } from "diagram-js/lib/layout/LayoutUtil";
import { adjustEdgeWaypoints } from './UmlEdgeProvider';
import { connectRectangles } from "diagram-js/lib/layout/ManhattanLayout";
import { translateDJShapeToUMLShape } from '../translations';

class MoveShapeHandler {
    constructor(umlWebClient, diagramContext, graphicsFactory, canvas, eventBus, diagramEmitter, elementRegistry, diManager) {
        this.umlWebClient = umlWebClient;
        this.diagramContext = diagramContext;
        this.graphicsFactory = graphicsFactory;
        this.canvas = canvas;
        this.eventBus = eventBus;
        this.diagramEmitter = diagramEmitter;
        this.elementRegistry = elementRegistry;
        this.diManager = diManager;
    }
    async doLater(shape) {
        const shapeInstance = await this.diManager.get(shape.id);
        if (shapeInstance.is('Shape')) {
            await translateDJShapeToUMLShape(shape, shapeInstance, this.diManager, this.diagramContext.umlDiagram);
            for (const child of shape.children) {
                if (child.elementType === 'UMLCompartment') {
                    for (const compartmentChild of child.children) {
                        await this.doLater(compartmentChild);
                    }
                }
                await this.doLater(child);
            }
            await adjustAttachedEdges(shape, this.diManager, this.diagramContext.umlDiagram);
        } else if (shapeInstance.is('Edge')) {
            //TODO
            await adjustEdgeWaypoints(shape, this.diManager, this.diagramContext.umlDiagram);
        }
        await this.diManager.put(shapeInstance);
        await this.diManager.put(this.diagramContext.umlDiagram);
    }

    moveElementChildrenAndEdges(element, context, direction) {
        context.elementsMoved.push(element);
        if (element.waypoints) {
            element.waypoints = connectRectangles(element.source, element.target, getMid(element.source), getMid(element.target));
            this.graphicsFactory.update('connection', element, this.canvas.getGraphics(element));
        } else {
            element.x += direction * context.delta.x;
            element.y += direction * context.delta.y;
            this.graphicsFactory.update('shape', element, this.canvas.getGraphics(element));
            if (element.incoming) {
                for (const connection of element.incoming) {
                    this.moveElementChildrenAndEdges(connection, context, direction);
                }
            }
            if (element.outgoing) {
                for (const connection of element.outgoing) {
                    this.moveElementChildrenAndEdges(connection, context, direction);
                }
            }
        }
        if (element.children) {
            for (const child of element.children) {
                this.moveElementChildrenAndEdges(child, context, direction);
            }
        }
    }

    execute(context) {
        if (context.proxy) {
            delete context.proxy;
            return;
        }
        this.diagramEmitter.fire('command', {name: 'move.shape.uml', context: context});
        context.elementsMoved = [];
        for (const shape of context.shapes) {
            if (shape.ignore) {
                delete shape.ignore
                continue;
            }
            this.moveElementChildrenAndEdges(shape, context, 1);
            this.doLater(shape);
            this.eventBus.fire('uml.shape.move', { shape: shape});
        }
        return context.elementsMoved;
    }
    revert(context) {
        if (context.proxy) {
            delete context.proxy;
            return context.shapes;
        }
        this.diagramEmitter.fire('command', {undo: {
            // TODO
        }});
        for (const shape of context.shapes) {
            this.moveElementChildrenAndEdges(shape, context, -1);
            this.doLater(shape);
            this.eventBus.fire('uml.shape.move', { shape: shape});
        }
        return context.shapes
    }
}

MoveShapeHandler.$inject = [
    'umlWebClient', 
    'diagramContext', 
    'graphicsFactory', 
    'canvas', 
    'eventBus', 
    'diagramEmitter', 
    'elementRegistry', 
    'diManager'
];

class ResizeShapeHandler {
    constructor(umlWebClient, diagramContext, graphicsFactory, canvas, diagramEmitter, elementRegistry) {
        this.umlWebClient = umlWebClient;
        this.diagramContext = diagramContext;
        this.graphicsFactory = graphicsFactory;
        this.canvas = canvas;
        this.diagramEmitter = diagramEmitter;
        this.elementRegistry = elementRegistry;
    }

    async resize(context) {
        const shapeInstance = await this.umlWebClient.get(context.shape.id);
        await adjustShape(context.shape, shapeInstance, this.umlWebClient);
        for (const child of context.shape.children) {
            if (child.elementType === 'compartment') continue;
            const childInstance = await this.umlWebClient.get(child.id);
            await adjustShape(child, childInstance, this.umlWebClient);
        }
        await adjustAttachedEdges(context.shape, this.diManager, this.diagramContext.umlDiagram);
        this.umlWebClient.put(this.diagramContext.diagram);
    }

    assignBounds(context, bounds) {
        const shape = context.shape;
        shape.x = bounds.x;
        shape.y = bounds.y;
        shape.width = bounds.width;
        shape.height = bounds.height;
        const updateShape = (element) => {
            this.graphicsFactory.update('shape', element, this.canvas.getGraphics(element));
            for (const child of shape.children) {
                updateShape(child);
            }
            // adjust edges
            for (const edge of element.incoming) {
                edge.waypoints = connectRectangles(edge.source, edge.target, getMid(edge.source), getMid(edge.target));
                this.graphicsFactory.update('connection', edge, this.canvas.getGraphics(edge));
            }
            for (const edge of element.outgoing) {
                edge.waypoints = connectRectangles(edge.source, edge.target, getMid(edge.source), getMid(edge.target));
                this.graphicsFactory.update('connection', edge, this.canvas.getGraphics(edge));
            }
        }
        updateShape(shape);
    }

    execute(context) {
        if (context.proxy) {
            delete context.proxy;
            // context.shape = this.elementRegistry.get(context.shape.id);
            return;
        }
        const newBounds = roundBounds(context.newBounds);
        const shape = context.shape;
        context.oldBounds = {
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
        };
        this.diagramEmitter.fire('command', {name: 'resize.shape.uml', context: context});
        this.assignBounds(context, newBounds);
        this.resize(context);
        return shape;
    }
    revert(context) {
        this.diagramEmitter.fire('command', {undo: {
            // TODO
        }});
        const oldBounds = context.oldBounds;
        this.assignBounds(context, oldBounds);
        this.resize(context);
        return context.shape;
    }
}

ResizeShapeHandler.$inject = ['umlWebClient', 'diagramContext', 'graphicsFactory', 'canvas', 'diagramEmitter', 'elementRegistry'];

export default class UmlShapeProvider {

    constructor(eventBus, elementRegistry, elementFactory, canvas, graphicsFactory, commandStack, diagramEmitter) {
        commandStack.registerHandler('move.shape.uml', MoveShapeHandler);
        commandStack.registerHandler('resize.shape.uml', ResizeShapeHandler);
        eventBus.on('shape.move.end', 1100, (event) => {
            commandStack.execute('move.shape.uml', event.context);
            return false; // stop propogation because we are overriding the default behavior at the end
        });
        eventBus.on('resize.end', 1100, (event) => {
            if (event.context.canExecute && event.shape.elementType === 'shape') {
                commandStack.execute('resize.shape.uml', event.context);
                event.context.canExecute = false;
            }
        });
        eventBus.on('server.create', (event) => {
            const elementType = event.serverElement.elementType();
            if (elementType === 'shape') {
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
                });
                canvas.addShape(shape, owner);
            }
        });
        eventBus.on('server.update', (event) => {
            const elementType = event.serverElement.elementType();
            if (elementType === 'shape') {
                const umlShape = event.serverElement;
                const localShape = event.localElement;
                localShape.x = umlShape.bounds.x;
                localShape.y = umlShape.bounds.y;
                localShape.width = umlShape.bounds.width;
                localShape.height = umlShape.bounds.height;
                localShape.modelElement = umlShape.modelElement;

                // TODO check children and parent

                // update
                graphicsFactory.update('shape', localShape, canvas.getGraphics(localShape));
            }
        });

        /**
         * Inselectable elements can be toggled inselectable with attribute inselectable = true,
         * when inselectable, when clicked the elements parent will be selected unless the elements parent is root
         * also when the element is moved the parent will be moved instead
         **/
        eventBus.on('selection.changed', 1100, (context) => {
            const selectedInselectableElements = context.newSelection.filter(el => el.inselectable);
            for (const inselectableElement of selectedInselectableElements) {
                // remove compartment from selection
                context.newSelection.splice(context.newSelection.indexOf(inselectableElement), 1);
                if (inselectableElement.parent != canvas.findRoot(inselectableElement) && 
                    !context.newSelection.includes(inselectableElement.parent)) {
                    context.newSelection.push(inselectableElement.parent);
                }
            }
        });
        eventBus.on('shape.move.start', 1600, (event) => {
            const shape = event.shape;
            if (shape.inselectable && shape.parent != canvas.findRoot(shape)) {
                event.shape = shape.parent;
            }
        });
        eventBus.on('connect.end', 1200, (event) => {
            checkIfInselectableAndChange(event.context, 'start');
            checkIfInselectableAndChange(event, 'hover');
            checkIfInselectableAndChange(event.context, 'target');
            checkIfInselectableAndChange(event.context, 'source');
        });
        eventBus.on('element.dblclick', (event) => {
            if (event.element.inselectable) {
                diagramEmitter.fire('focus', {
                    el: event.element.parent.modelElement
                });
            }
        });
    }
}

UmlShapeProvider.$inject = ['eventBus', 'elementRegistry', 'elementFactory', 'canvas', 'graphicsFactory', 'commandStack', 'diagramEmitter'];

export async function adjustShape(shape, shapeInstance, umlWebClient) {
    let boundsInstance = undefined;
    if (!shapeInstance) {
        throw Error('cannot handle undefined shapeInstance');
    }
    if (shapeInstance.elementType() !== 'instanceSpecification') {
        throw Error('cannot handle shapeInstance that is not an instanceSpecification!');
    }
    for await (let slot of shapeInstance.slots) {
        if (slot.definingFeature.id() === SHAPE_BOUNDS_SLOT_ID) {
            boundsInstance = await (await slot.values.front()).instance.get();
            break;
        }
    }
    for await (let slot of boundsInstance.slots) {
        if (slot.definingFeature.id() === 'OaYzOYryv5lrW2YYkujnjL02rSlo') {
            const value = await slot.values.front();
            value.value = shape.x;
            umlWebClient.put(value);
        } else if (slot.definingFeature.id() === 'RhD_fTVUMc4ceJ4topOlpaFPpoiB') {
            const value = await slot.values.front();
            value.value = shape.y;
            umlWebClient.put(value);
        } else if (slot.definingFeature.id() === '&TCEXx1uZQsa7g1KPT9ocVwNiwV7') {
            const value = await slot.values.front();
            value.value = shape.width;
            umlWebClient.put(value);
        } else if (slot.definingFeature.id() === 'ELF54xP3DUMrFbgteAQkIXONqnlg') {
            const value = await slot.values.front();
            value.value = shape.height;
            umlWebClient.put(value);
        }
    }
    umlWebClient.put(boundsInstance);
    umlWebClient.put(shapeInstance);
}

async function adjustListOfEdges(listOfEdges, diManager, umlDiagram) {
    for (const edge of listOfEdges) {
        await adjustEdgeWaypoints(edge, diManager, umlDiagram); 
    } 
}

export async function adjustAttachedEdges(shape, diManager, umlDiagram) {
    await adjustListOfEdges(shape.incoming, diManager, umlDiagram);
    await adjustListOfEdges(shape.outgoing, diManager, umlDiagram); 
}

function checkIfInselectableAndChange(context, property) {
    if (context[property] && context[property].inselectable) {
        context[property].parent.connectType = context[property].connectType;
        context[property] = context[property].parent;
    }
}
