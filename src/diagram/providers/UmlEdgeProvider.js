import { makeUMLWaypoints } from './relationships/relationshipUtil';

class AdjustWaypointsHandler {
    constructor(canvas, umlWebClient, diagramEmitter, elementRegistry, eventBus) {
        this.canvas = canvas;
        this.umlWebClient = umlWebClient;
        this.diagramEmitter = diagramEmitter;
        this.elementRegistry = elementRegistry;
        this.eventBus = eventBus;
    }
    execute(context) {
        context.connection = this.elementRegistry.get(context.connection.id);
        if (context.proxy) {
            delete context.proxy;
            return context.connection;
        }
        this.diagramEmitter.fire('command', {name: 'move.edge.uml', context: {
            connection: {
                id: context.connection.id,
            },
            newWaypoints: context.connection.waypoints,
            originalWaypoints: context.originalWaypoints,
        }});
        context.connection.waypoints = context.newWaypoints;
        adjustEdgeWaypoints(context.connection, this.umlWebClient);
        this.eventBus.fire('edge.move.end', context);
        return context.connection;
    }
    revert(context) {
        this.diagramEmitter.fire('command', {undo: {
            // TODO
        }});
        context.connection.waypoints = context.originalWaypoints;
        adjustEdgeWaypoints(context.connection, this.umlWebClient);
        this.eventBus.fire('edge.move.end', context);
        return context.connection;
    }
}

AdjustWaypointsHandler.$inject= ['canvas', 'umlWebClient', 'diagramEmitter', 'elementRegistry', 'eventBus'];

export default class UmlEdgeProvider {
    constructor(eventBus, umlWebClient, diagramContext, elementRegistry, elementFactory, canvas, graphicsFactory, commandStack) {
        commandStack.registerHandler('move.edge.uml', AdjustWaypointsHandler);
        eventBus.on('connectionSegment.move.end', 1100, (event) => {
            commandStack.execute('move.edge.uml', event.context);
            return false;
        });
    
        eventBus.on('connectionSegment.move.move', (event) => {
            //const connectionSegmentMove = async () => {
            //    await adjustEdgeWaypoints(event.connection, umlWebClient);
            //    umlWebClient.put(diagramContext.diagram);
            //};
            //if (umlWebClient.client.otherClients.size > 0) {
            //    connectionSegmentMove();
            //} else {
                event.context.connection.waypoints = event.context.newWaypoints;
                graphicsFactory.update(event.context.connection, 'connection', canvas.getGraphics(event.context.connection));
            //}
        });
    
        eventBus.on('bendpoint.move.end', 1100, (event) => {
            const originalWaypoints = [];
            event.context.waypoints.forEach(pt => originalWaypoints.push({x:pt.x,y:pt.y}));
            const index = event.context.bendpointIndex;
            if (event.context.insert) {
                originalWaypoints.splice(index, 0, {x:event.x, y:event.y});
            } else {
                originalWaypoints[index].x += event.dx;
                originalWaypoints[index].y += event.dy;
            }
            const context = {
                connection : event.context.connection,
                originalWaypoints: event.context.waypoints,
                newWaypoints: originalWaypoints
            }
            commandStack.execute('move.edge.uml', context);
            return false;
        });

        eventBus.on('server.create', (event) => {
            if (event.serverElement.elementType() === 'edge') {
                const umlEdge = event.serverElement;
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
                        numSourceLabels: 0,
                        numCenterLabels: 0,
                        numTargetLabels: 0,
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
            }
        });
    }
}

UmlEdgeProvider.$inject = ['eventBus', 'umlWebClient', 'diagramContext', 'elementRegistry', 'elementFactory', 'canvas', 'graphicsFactory', 'commandStack'];

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
