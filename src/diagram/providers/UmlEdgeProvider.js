import { translateDJEdgeToUMLEdge } from '../translations';
class AdjustWaypointsHandler {
    constructor(canvas, diagramEmitter, elementRegistry, eventBus, diManager, diagramContext) {
        this.canvas = canvas;
        this.diagramEmitter = diagramEmitter;
        this.elementRegistry = elementRegistry;
        this.eventBus = eventBus;
        this.diManager = diManager;
        this.diagramContext = diagramContext;
    }
    execute(context) {
        if (context.proxy) {
            delete context.proxy;
            return;
        }
        context.connection = this.elementRegistry.get(context.connection.id);
        this.diagramEmitter.fire('command', {name: 'move.edge.uml', context: context});
        context.connection.waypoints = context.newWaypoints;
        adjustEdgeWaypoints(context.connection, this.diManager, this.diagramContext.umlDiagram);
        this.eventBus.fire('edge.move.end', context);
        return context.connection;
    }
    revert(context) {
        if (context.proxy) {
            delete context.proxy;
            return;
        }

        this.diagramEmitter.fire('command', {undo: {
            // TODO
        }});
        context.connection.waypoints = context.originalWaypoints;
        adjustEdgeWaypoints(context.connection, this.diManager, this.diagramContext.umlDiagram);
        this.eventBus.fire('edge.move.end', context);
        return context.connection;
    }
}

AdjustWaypointsHandler.$inject= [
    'canvas', 
    'diagramEmitter', 
    'elementRegistry', 
    'eventBus',
    'diManager',
    'diagramContext'
];

export default class UmlEdgeProvider {
    constructor(eventBus, umlWebClient, diagramContext, elementRegistry, elementFactory, canvas, graphicsFactory, commandStack) {
        commandStack.registerHandler('move.edge.uml', AdjustWaypointsHandler);
        eventBus.on('connectionSegment.move.end', 1100, (event) => {
            commandStack.execute('move.edge.uml', event.context);
            eventBus.fire('edge.move', {
                edge: event.context.connection
            });
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
            eventBus.fire('edge.move', {
                edge: context.connection
            });
            return false;
        });

        eventBus.on('server.create', (event) => {
            if (event.serverElement.elementType() === 'UMLEdge') {
                const umlEdge = event.serverElement;
                const createEdge = async () => {
                    const source = elementRegistry.get(umlEdge.source.id()); 
                    const target = elementRegistry.get(umlEdge.target.id());
                    const modelElement = await umlWebClient.get((await umlEdge.modelElement.front()).modelElementID)
                    if (modelElement.is('Association')) { // TODO move to Association
                        for await (const memberEnd of modelElement.memberEnds) {}
                    }
                    const waypoints = [];
                    for await (const point of umlEdge.waypoints) {
                        waypoints.push({ x : point.x, y : point.y })
                    }
                    // create connection
                    const connection = elementFactory.createConnection({
                        waypoints: waypoints,
                        id: umlEdge.id,
                        target: target,
                        source: source,
                        modelElement: modelElement,
                        children: [],
                        numSourceLabels: 0,
                        numCenterLabels: 0,
                        numTargetLabels: 0,
                        elementType: 'UMLEdge',
                    });
                    const owner = elementRegistry.get(umlEdge.owningElement.id());
                    canvas.addConnection(connection, owner);
                };
                createEdge();
            }
        });

        eventBus.on('server.update', (event) => {
            if (event.serverElement.is('UMLEdge')) {
                const serverEdge = event.serverElement;
                const localEdge = event.localElement;
                if (serverEdge.waypoints.size() === 0) {
                    // edge is still being created skip
                    // TODO a little messy, the problem is that edge isn't made instantly
                    // anymore with the generated api, so we just have to understand that
                    // if there are no waypoints thats impossible meaning it's in a bad
                    // state getting set up or torn down
                    return;
                }
                if (localEdge.target.id !== serverEdge.target.id()) {
                    localEdge.target = elementRegistry.get(serverEdge.target.id());
                }
                if (localEdge.source.id !== serverEdge.source.id()) {
                    localEdge.source = elementRegistry.get(serverEdge.source.id());
                }
                
                const doLater = async () => {
                    const waypoints = [];
                    for await (const point of serverEdge.waypoints) {
                        waypoints.push({
                            x: point.x,
                            y: point.y
                        });
                    }

                    localEdge.waypoints = waypoints;

                    graphicsFactory.update('connection', localEdge, canvas.getGraphics(localEdge));
                    eventBus.fire('edge.move', {
                        edge: localEdge
                    });
                };
                doLater();
            }
        });

        eventBus.on('server.delete', (event) => {
            const element = event.element;
            if (element.is('UMLEdge')) {
                canvas.removeShape(element);
            }
        });
    }
}

UmlEdgeProvider.$inject = [
    'eventBus', 
    'umlWebClient', 
    'diagramContext', 
    'elementRegistry', 
    'elementFactory', 
    'canvas', 
    'graphicsFactory', 
    'commandStack'
];

export async function adjustEdgeWaypoints(edge, diManager, umlDiagram) {
    const umlEdge = await diManager.get(edge.id);
    await translateDJEdgeToUMLEdge(edge, umlEdge, diManager, umlDiagram);
    await diManager.put(umlEdge);
}
