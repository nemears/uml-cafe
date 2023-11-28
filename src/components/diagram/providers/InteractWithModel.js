import { makeUMLWaypoints } from './relationships/Relationship'
import { createClassShape } from '../api/diagramInterchange';

export default function InteractWithModel(eventBus, umlWebClient, diagramEmitter, diagramContext, elementRegistry, modeling) {

    const asyncCreateShape = async (event) => {
        if (event.element.update) {
            // this means that the shape was created in response to an update from the backend
            // we do not have to make any new class or shape because it was not created by a user
            return;
        }

        if (!event.element.newUMLElement) {
            if (event.element.newShapeElement) {
                createClassShape(event.element, umlWebClient, diagramContext);
            }
            return;
        }

        // create new uml class
        const classID = event.element.elementID;
        let clazz = await umlWebClient.post('class', {id:classID});
        diagramContext.context.packagedElements.add(clazz);
        umlWebClient.put(clazz);
        umlWebClient.put(diagramContext.context);
        await umlWebClient.get(classID);

        diagramEmitter.fire('shape.added', event);

        // create shape
        createClassShape(event.element, umlWebClient, diagramContext);
    };

    eventBus.on('shape.added',  function(event) {
        asyncCreateShape(event);
    });

    const adjustShape = async (event, shapeInstance) => {
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
                value.value = event.shape.x;
                umlWebClient.put(value);
            } else if (slot.definingFeature.id() === 'RhD_fTVUMc4ceJ4topOlpaFPpoiB') {
                const value = await slot.values.front();
                value.value = event.shape.y;
                umlWebClient.put(value);
            } else if (slot.definingFeature.id() === '&TCEXx1uZQsa7g1KPT9ocVwNiwV7') {
                const value = await slot.values.front();
                value.value = event.shape.width;
                umlWebClient.put(value);
            } else if (slot.definingFeature.id() === 'ELF54xP3DUMrFbgteAQkIXONqnlg') {
                const value = await slot.values.front();
                value.value = event.shape.height;
                umlWebClient.put(value);
            }
        }
        umlWebClient.put(boundsInstance);
        umlWebClient.put(shapeInstance);
    }

    const adjustEdgeWaypoints = async (edge) => {
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
    };

    const adjustListOfEdges = async (listOfEdges) => {
        for (const edge of listOfEdges) {
            await adjustEdgeWaypoints(edge); 
        } 
    }

    const adjustAttachedEdges = async (shape) => {
        await adjustListOfEdges(shape.incoming);
        await adjustListOfEdges(shape.outgoing); 
    }

    eventBus.on('shape.move.end',  (event) => {
        // get point instance
        const shapeMoveEnd = async () => {
            const shapeInstance = await umlWebClient.get(event.shape.id);
            await adjustShape(event, shapeInstance);
            await adjustAttachedEdges(event.shape);
            umlWebClient.put(diagramContext.diagram);
        }
        shapeMoveEnd();
    });

    eventBus.on('resize.end', (event) => {
        const resizeEnd = async () => {
            const shapeInstance = await umlWebClient.get(event.shape.id);
            await adjustShape(event, shapeInstance);
            await adjustAttachedEdges(event.shape);
            umlWebClient.put(diagramContext.diagram);
        }
        resizeEnd();
    });

    eventBus.on('connectionSegment.move.end', (event) => {
        const connectionSegmentMoveEnd = async () => {
            await adjustEdgeWaypoints(event.connection);
            umlWebClient.put(diagramContext.diagram);
        };
        connectionSegmentMoveEnd();
    });

    eventBus.on('bendpoint.move.end', (event) => {
        const bendpointMoveEnd = async () => {
            await adjustEdgeWaypoints(event.connection);
            umlWebClient.put(diagramContext.diagram);
        };
        bendpointMoveEnd();
    });
}

InteractWithModel.$inject = ['eventBus', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'elementRegistry', 'modeling'];
