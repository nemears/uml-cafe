import { createElementUpdate } from '../../../../umlUtil';
import { createEdge } from './relationshipUtil';
import { randomID } from 'uml-client/lib/element';
import { createDiagramShape } from '../../api/diagramInterchange';
import { adjustShape } from '../InteractWithModel';

export const OWNED_END_RADIUS = 5;

export default class DirectedComposition {
    constructor(eventBus, umlWebClient, diagramEmitter, diagramContext, modeling) {

        eventBus.on('connect.end', (event) => {
            // check if it can connect
            if (event.context.start.connectType === 'directedComposition') {
                const createAssociation = async () => {
                    // create the association and properties
                    const association = await umlWebClient.post('association');
                    const memberEnd = await umlWebClient.post('property');
                    const ownedEnd = await umlWebClient.post('property');
                    memberEnd.type.set(event.hover.modelElement);
                    memberEnd.aggregation = 'composite';
                    ownedEnd.type.set(event.context.start.modelElement);
                    association.memberEnds.add(memberEnd);
                    association.ownedEnds.add(ownedEnd); 
                    const clazz = event.context.start.modelElement;
                    memberEnd.clazz.set(clazz);
                    diagramContext.context.packagedElements.add(association);

                    umlWebClient.put(association);
                    umlWebClient.put(memberEnd);
                    umlWebClient.put(ownedEnd);
                    umlWebClient.put(clazz);
                    umlWebClient.put(diagramContext.context);

                    event.context.connection = modeling.connect(
                        event.context.start, 
                        event.hover, 
                        {
                            id: randomID(),
                            modelElement: association
                        }, 
                        {}
                    );
                    await createEdge(event.context.connection, umlWebClient, diagramContext);

                    // create property shaper at end of association
                    const lastWaypoint = event.context.connection.waypoints.slice(-1)[0];
                    const propertyShape = modeling.createShape(
                        {
                            id: randomID(),
                            modelElement: memberEnd
                        },
                        {
                            x: lastWaypoint.x - OWNED_END_RADIUS,
                            y: lastWaypoint.y - OWNED_END_RADIUS,
                            width: 2 * OWNED_END_RADIUS,
                            height: 2 * OWNED_END_RADIUS,
                        },
                        event.context.connection
                    );
                    await createDiagramShape(propertyShape, umlWebClient, diagramContext);
                    diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, clazz, association));
                }
                createAssociation();
                return false; // stop propogation
            }
        });

        eventBus.on('directedComposition.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'directedComposition';
            });
        });
        
        eventBus.on('shape.move.end', (event) => {
            const shape = event.shape;
            for (const connection of shape.incoming) {
                checkConnectionEnds(connection, umlWebClient, modeling);
            }
            for (const connection of shape.outgoing) {
                checkConnectionEnds(connection, umlWebClient, modeling);
            }
        });
        eventBus.on('connection.move.end', (event) => {
            checkConnectionEnds(event.connection, umlWebClient, modeling);
        });
        eventBus.on('resize.end', (event) => {
            const shape = event.shape;
            for (const connection of shape.incoming) {
                checkConnectionEnds(connection, umlWebClient, modeling);
            }
            for (const connection of shape.outgoing) {
                checkConnectionEnds(connection, umlWebClient, modeling);
            }
        });
        eventBus.on('bendpoint.move.end', (event) => {
            const connection = event.connection;
            checkConnectionEnds(connection, umlWebClient, modeling);
        });
        eventBus.on('connectionSegment.move.move', (event) => {
            const connection = event.connection;
            checkConnectionEnds(connection, umlWebClient, modeling);
        });
    }
}

DirectedComposition.$inject = ['eventBus', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'modeling'];

function checkConnectionEnds(connection, umlWebClient, modeling) {
    for (const end of connection.children) {
        if (end.modelElement.elementType() === 'property') {
            if (end.modelElement.type.id() === connection.source.modelElement.id) {
                const firstWaypoint = connection.waypoints[0];
                modeling.resizeShape(
                    end,
                    {
                        x: firstWaypoint.x - OWNED_END_RADIUS,
                        y: firstWaypoint.y - OWNED_END_RADIUS,
                        width: 2 * OWNED_END_RADIUS,
                        height: 2 * OWNED_END_RADIUS,
                    }
                );
            } else if (end.modelElement.type.id() === connection.target.modelElement.id) {
                const lastWaypoint = connection.waypoints.slice(-1)[0];
                modeling.resizeShape(
                    end,
                    {
                        x: lastWaypoint.x - OWNED_END_RADIUS,
                        y: lastWaypoint.y - OWNED_END_RADIUS,
                        width: 2 * OWNED_END_RADIUS,
                        height: 2 * OWNED_END_RADIUS
                    }
                );
            }
            const adjustEdgeShape = async () => {
                await adjustShape(end, await umlWebClient.get(end.id), umlWebClient);
            }
            adjustEdgeShape(); 
        }
    }
}
