import { makeUMLWaypoints } from './relationships/relationshipUtil';

export default class UmlEdgeProvider {
    constructor(eventBus, umlWebClient, diagramContext, elementRegistry, elementFactory, canvas, graphicsFactory) {
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

        eventBus.on('server.create', (event) => {
            if (event.serverElement.elementType() === 'edge') {
                const umlEdge = event.serverElement;
                console.log('creating edge');
                console.log(umlEdge);
                const createEdge = async () => {
                    const source = elementRegistry.get(umlEdge.source); 
                    const target = elementRegistry.get(umlEdge.target);
                    if (umlEdge.modelElement.isSubClassOf('association')) { // TODO move to Association
                        for await (const memberEnd of umlEdge.modelElement.memberEnds) {}
                    }
                    
                    // create connection
                    const connection = elementFactory.createConnection({
                        waypoints: umlEdge.waypoints,
                        id: umlEdge.id,
                        target: target,
                        source: source,
                        modelElement: umlEdge.modelElement,
                        children: [],
                    });
                    const owner = elementRegistry.get(umlEdge.owningElement);
                    canvas.addConnection(connection, owner);
                };
                createEdge();
            }
        });

        eventBus.on('server.update', (event) => {
            if (event.serverElement.elementType() === 'edge') {
                const serverEdge = event.serverElement;
                const localEdge = event.localElement;
                if (localEdge.target.id !== serverEdge.target) {
                    localEdge.target = elementRegistry.get(serverEdge.target);
                }
                if (localEdge.source.id !== serverEdge.source) {
                    localEdge.source = elementRegistry.get(serverEdge.source);
                }

                localEdge.waypoints = serverEdge.waypoints;

                graphicsFactory.update('connection', localEdge, canvas.getGraphics(localEdge));
                console.log('updated edge');
                console.log(serverEdge);
            }
        });
    }
}

UmlEdgeProvider.$inject = ['eventBus', 'umlWebClient', 'diagramContext', 'elementRegistry', 'elementFactory', 'canvas', 'graphicsFactory'];

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
            makeUMLWaypoints(edge, umlWebClient, edgeSlot, {diagram: await edgeInstance.owningPackage.get()});
            umlWebClient.put(edgeSlot);
        }
    }
    umlWebClient.put(edgeInstance);
}