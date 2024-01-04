import { makeUMLWaypoints } from './relationships/relationshipUtil';

export default class UmlEdgeProvider {
    constructor(eventBus, umlWebClient, diagramContext) {
        eventBus.on('connectionSegment.move.end', (event) => {
            const connectionSegmentMoveEnd = async () => {
                await adjustEdgeWaypoints(event.connection, umlWebClient);
                umlWebClient.put(diagramContext.diagram);
            };
            connectionSegmentMoveEnd();
        });
    
        eventBus.on('connectionSegment.move.move', (event) => {
            const connectionSegmentMove = async () => {
                await adjustEdgeWaypoints(event.connection, umlWebClient);
                umlWebClient.put(diagramContext.diagram);
            };
            if (umlWebClient.client.otherClients.size > 0) {
                connectionSegmentMove();
            }
        });
    
        eventBus.on('bendpoint.move.end', (event) => {
            const bendpointMoveEnd = async () => {
                await adjustEdgeWaypoints(event.connection, umlWebClient);
                umlWebClient.put(diagramContext.diagram);
            };
            bendpointMoveEnd();
        });
    }
}

UmlEdgeProvider.$inject = ['eventBus', 'umlWebClient', 'diagramContext'];

export async function adjustEdgeWaypoints(edge, umlWebClient) {
    const edgeInstance = await umlWebClient.get(edge.id);
    for await (const edgeSlot of edgeInstance.slots) {
        if (edgeSlot.definingFeature.id() === 'Zf2K&k0k&jwaAz1GLsTSk7rN742p') {
            let waypointValues = [];
            for await (const waypointValue of edgeSlot.values) {
                await umlWebClient.deleteElement(await waypointValue.instance.get());
                waypointValues.push(waypointValue);
            }
            for (const waypointValue of waypointValues) {
                edgeSlot.values.remove(waypointValue);
                await umlWebClient.deleteElement(waypointValue);
            }
            await makeUMLWaypoints(edge, umlWebClient, edgeSlot, {diagram: await edgeInstance.owningPackage.get()});
        }
    }
    umlWebClient.put(edgeInstance);
}