import { BOUNDS_ID, EDGE_ID, LABEL_ID, SHAPE_ID } from "../api/diagramInterchange";
import { adjustEdgeWaypoints } from './UmlEdgeProvider';

class MoveShapeHandler {
    constructor(umlWebClient, diagramContext, graphicsFactory, canvas) {
        this.umlWebClient = umlWebClient;
        this.diagramContext = diagramContext;
        this.graphicsFactory = graphicsFactory;
        this.canvas = canvas;
    }
    execute(context) {
        for (const shape of context.shapes) {
            const shapeMoveEnd = async () => {
                const shapeInstance = await this.umlWebClient.get(shape.id);
                for (const classifierID of shapeInstance.classifiers.ids()) {
                    if (classifierID === SHAPE_ID || classifierID === LABEL_ID) {
                        await adjustShape(shape, shapeInstance, this.umlWebClient);
                        for (const child of shape.children) {
                            const childInstance = await this.umlWebClient.get(child.id);
                            await adjustShape(child, childInstance, this.umlWebClient);
                        }
                        await adjustAttachedEdges(shape, this.umlWebClient);
                    } else if (classifierID === EDGE_ID) {
                        await adjustEdgeWaypoints(shape, this.umlWebClient);
                    }
                }
                this.umlWebClient.put(this.diagramContext.diagram);
            }
            if (shape.ignore) {
                delete shape.ignore
                continue;
            }
            shape.x += context.delta.x;
            shape.y += context.delta.y;
            this.graphicsFactory.update('shape', shape, this.canvas.getGraphics(shape));
            shapeMoveEnd();
        }
    }
    revert(context) {
        const doLater = async (shape) => {
            const shapeInstance = await this.umlWebClient.get(shape.id);
            for (const classifierID of shapeInstance.classifiers.ids()) {
                if (classifierID === SHAPE_ID || classifierID === LABEL_ID) {
                    await adjustShape(shape, shapeInstance, this.umlWebClient);
                    for (const child of shape.children) {
                        const childInstance = await this.umlWebClient.get(child.id);
                        await adjustShape(child, childInstance, this.umlWebClient);
                    }
                    await adjustAttachedEdges(shape, this.umlWebClient);
                } else if (classifierID === EDGE_ID) {
                    await adjustEdgeWaypoints(shape, this.umlWebClient);
                }
            }
            this.umlWebClient.put(this.diagramContext.diagram);
        }
        for (const shape of context.shapes) {
            shape.x -= context.delta.x;
            shape.y -= context.delta.y;
            this.graphicsFactory.update('shape', shape, this.canvas.getGraphics(shape));
            doLater(shape);
        }
    }
}

MoveShapeHandler.$inject = ['umlWebClient', 'diagramContext', 'graphicsFactory', 'canvas'];

export default class UmlShapeProvider {

    constructor(eventBus, umlWebClient, diagramContext, elementRegistry, elementFactory, canvas, graphicsFactory, commandStack) {
        commandStack.registerHandler('move.shape.uml', MoveShapeHandler);
        eventBus.on('shape.move.end', 1100, (event) => {
            commandStack.execute('move.shape.uml', event.context);
            return false; // stop propogation because we are overriding the default behavior at the end
        });
        eventBus.on('resize.end', (event) => {
            const resizeEnd = async () => {
                const shapeInstance = await umlWebClient.get(event.shape.id);
                await adjustShape(event.shape, shapeInstance, umlWebClient);
                for (const child of event.shape.children) {
                    const childInstance = await umlWebClient.get(child.id);
                    await adjustShape(child, childInstance, umlWebClient);
                }
                await adjustAttachedEdges(event.shape, umlWebClient);
                umlWebClient.put(diagramContext.diagram);
            }
            resizeEnd();
        });
        eventBus.on('server.create', (event) => {
            if (event.serverElement.elementType() === 'shape') {
                const umlShape = event.serverElement;
                console.log('creating shape');
                console.log(umlShape);
                const owner = elementRegistry.get(umlShape.owningElement);
                const shape = elementFactory.createShape({
                    x: umlShape.bounds.x,
                    y: umlShape.bounds.y,
                    width: umlShape.bounds.width,
                    height: umlShape.bounds.height,
                    update: true,
                    id: umlShape.id,
                    modelElement: umlShape.modelElement,
                });
                canvas.addShape(shape, owner);
            }
        });
        eventBus.on('server.update', (event) => {
            if (event.serverElement.elementType() === 'shape') {
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

                console.log('updated shape');
                console.log(umlShape);
            }
        });
    }
}

UmlShapeProvider.$inject = ['eventBus', 'umlWebClient', 'diagramContext', 'elementRegistry', 'elementFactory', 'canvas', 'graphicsFactory', 'commandStack'];

export async function adjustShape(shape, shapeInstance, umlWebClient) {
    let boundsInstance = undefined;
    for await (let slot of shapeInstance.slots) {
        if (slot.definingFeature.id() === BOUNDS_ID) {
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

async function adjustListOfEdges(listOfEdges, umlWebClient) {
    for (const edge of listOfEdges) {
        await adjustEdgeWaypoints(edge, umlWebClient); 
    } 
}

async function adjustAttachedEdges(shape, umlWebClient) {
    await adjustListOfEdges(shape.incoming, umlWebClient);
    await adjustListOfEdges(shape.outgoing, umlWebClient); 
}