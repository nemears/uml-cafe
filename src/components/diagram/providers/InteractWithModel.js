import { createEdge, makeUMLWaypoints } from './relationships/relationshipUtil';
import { createDiagramShape } from '../api/diagramInterchange';
import { getMid } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout'
import { randomID } from '../umlUtil';

export default function InteractWithModel(eventBus, umlWebClient, diagramEmitter, diagramContext, modeling, modelElementMap, elementRegistry) {

    const asyncCreateShape = async (event) => {
        if (event.element.update) {
            // this means that the shape was created in response to an update from the backend
            // we do not have to make any new class or shape because it was not created by a user
            return;
        }

        if (!event.element.newUMLElement) {
            if (event.element.newShapeElement) {
                createDiagramShape(event.element, umlWebClient, diagramContext);
            }
            return;
        }

        if (event.element.modelElement.elementType() === 'class') {
    
            // create new uml class
            const classID = event.element.modelElement.id;
            let clazz = await umlWebClient.post('class', {id:classID});
            diagramContext.context.packagedElements.add(clazz);
            umlWebClient.put(clazz);
            umlWebClient.put(diagramContext.context);
            await umlWebClient.get(classID);
            event.element.modelElement = clazz;
    
            diagramEmitter.fire('shape.added', event);
    
            // create shape
            createDiagramShape(event.element, umlWebClient, diagramContext);
        } else if (event.element.modelElement.elementType() === 'comment') {
            // TODO
            const commentID = event.element.modelElement.id;
            const annotatedElements = event.element.modelElement.annotatedElements;
            let comment = await umlWebClient.post('comment', {id:commentID});
            for (let el of annotatedElements) {
                comment.annotatedElements.add(el);
                const elMap = modelElementMap.get(el);
                for (let elm of elMap) {
                    const target = elementRegistry.get(elm);
                    const anchor = modeling.connect(
                        event.element,
                        target,
                        {
                           source: event.element,
                            target: target,
                            waypoints: connectRectangles(event.element, target, getMid(event.element), getMid(target)),
                            id: randomID(),
                            modelElement: comment,
                        }
                    );
                    createEdge(anchor, umlWebClient, diagramContext);
                }
            }
            diagramContext.context.ownedComments.add(comment);
            umlWebClient.put(comment);
            umlWebClient.put(diagramContext.context);
            await umlWebClient.get(commentID);
            event.element.modelElement = comment;
    
            diagramEmitter.fire('shape.added', event);
            // create shape
            createDiagramShape(event.element, umlWebClient, diagramContext);
        }
    };

    eventBus.on('shape.added',  function(event) {
        asyncCreateShape(event);
    });

    

    eventBus.on('shape.move.end',  (event) => {
        // get point instance
        const shapeMoveEnd = async () => {
            const shapeInstance = await umlWebClient.get(event.shape.id);
            await adjustShape(event.shape, shapeInstance, umlWebClient);
            for (const child of event.shape.children) {
                const childInstance = await umlWebClient.get(child.id);
                await adjustShape(child, childInstance, umlWebClient);
            }
            await adjustAttachedEdges(event.shape, umlWebClient);
            umlWebClient.put(diagramContext.diagram);
        }
        shapeMoveEnd();
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

    eventBus.on('connectionSegment.move.end', (event) => {
        const connectionSegmentMoveEnd = async () => {
            await adjustEdgeWaypoints(event.connection, umlWebClient);
            umlWebClient.put(diagramContext.diagram);
        };
        connectionSegmentMoveEnd();
    });

    eventBus.on('bendpoint.move.end', (event) => {
        const bendpointMoveEnd = async () => {
            await adjustEdgeWaypoints(event.connection, umlWebClient);
            umlWebClient.put(diagramContext.diagram);
        };
        bendpointMoveEnd();
    });
}

InteractWithModel.$inject = ['eventBus', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'modeling', 'modelElementMap', 'elementRegistry'];

export async function adjustShape(shape, shapeInstance, umlWebClient) {
    let boundsInstance = undefined;
    for await (let slot of shapeInstance.slots) {
        if (slot.definingFeature.id() === 'KbKmDNU19SWMJwggKTQ9FrzAzozO') {
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

async function adjustEdgeWaypoints(edge, umlWebClient) {
    const edgeInstance = await umlWebClient.get(edge.id);
    for await (const edgeSlot of edgeInstance.slots) {
        if (edgeSlot.definingFeature.id() === 'Zf2K&k0k&jwaAz1GLsTSk7rN742p') {
            let waypointValues = [];
            for await (const waypointValue of edgeSlot.values) {
                umlWebClient.deleteElement(await waypointValue.instance.get());
                waypointValues.push(waypointValue);
            }
            for (const waypointValue of waypointValues) {
                edgeSlot.values.remove(waypointValue);
                umlWebClient.deleteElement(waypointValue);
            }
            await makeUMLWaypoints(edge, umlWebClient, edgeSlot, await edgeInstance.owningPackage.get());
        }
    }
    umlWebClient.put(edgeInstance);
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
