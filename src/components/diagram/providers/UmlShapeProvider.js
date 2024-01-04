import { BOUNDS_ID, EDGE_ID, LABEL_ID, SHAPE_ID, createDiagramShape } from "../api/diagramInterchange";
import { adjustEdgeWaypoints } from './UmlEdgeProvider';

export default class UmlShapeProvider {

    constructor(eventBus, umlWebClient, diagramContext) {
        eventBus.on('shape.added', (event) => {
            if (event.element.newShapeElement) {
                createDiagramShape(event.element, umlWebClient, diagramContext);
            }
        });
        eventBus.on('shape.move.end', (event) => {
            for (const shape of event.context.shapes) {
                const shapeMoveEnd = async () => {
                    const shapeInstance = await umlWebClient.get(shape.id);
                    for (const classifierID of shapeInstance.classifiers.ids()) {
                        if (classifierID === SHAPE_ID || classifierID === LABEL_ID) {
                            await adjustShape(shape, shapeInstance, umlWebClient);
                            for (const child of shape.children) {
                                const childInstance = await umlWebClient.get(child.id);
                                await adjustShape(child, childInstance, umlWebClient);
                            }
                            await adjustAttachedEdges(shape, umlWebClient);
                        } else if (classifierID === EDGE_ID) {
                            await adjustEdgeWaypoints(shape, umlWebClient);
                        }
                    }
                    umlWebClient.put(diagramContext.diagram);
                }
                if (shape.ignore) {
                    delete shape.ignore
                } else {
                    shapeMoveEnd();
                }
            }
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
    }
}

UmlShapeProvider.$inject = ['eventBus', 'umlWebClient', 'diagramContext'];

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