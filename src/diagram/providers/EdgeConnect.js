import { connectRectangles } from "diagram-js/lib/layout/ManhattanLayout";
import { getMid } from "diagram-js/lib/layout/LayoutUtil";
import { createAssociationEndLabel, createDiagramEdge, createDiagramLabel, createKeywordLabel, createMultiplicityLabel, createNameLabel, createTypedElementLabel } from "../api/diagramInterchange";

class EdgeConnectHandler {
    constructor(diagramEmitter, elementFactory, canvas, eventBus, umlWebClient, diagramContext) {
        this._diagramEmitter = diagramEmitter;
        this._elementFactory = elementFactory;
        this._canvas = canvas;
        this._eventBus = eventBus;
        this._umlWebClient = umlWebClient;
        this._diagramContext = diagramContext;
    }
    /**
     * Context:
     *      {
     *          connectionData: the data to be created for the connection {
     *              target: the target ** REQUIRED **,
     *              source: the source ** REQUIRED **,
     *              modelElement: the modelElement 
     *          }
     *          connection: the connection, can be undefined will be created
     *          children: Array of labels to create [
     *              {
     *                  // special options in label
     *                  placement: 'source', 'target', 'center', this defaults to center
     *                  elementType: usual uml di element type ** REQUIRED **
     *              }
     *          ]
     *      }
    **/
    execute(context) {
        if (context.proxy) {
            delete context.proxy;
            return;
        }
        const diagramEmitter = this._diagramEmitter,
        elementFactory = this._elementFactory,
        canvas = this._canvas,
        eventBus = this._eventBus,
        umlWebClient = this._umlWebClient,
        diagramContext = this._diagramContext;
        
        diagramEmitter.fire('command', {
            name: 'edge.connect',
            context: context,
        });

        context.connectionData.elementType = 'edge';

        // check connection
        if (!context.connectionData) {
            throw Error('bad context given to edge.connect, must supply connectionData');
        }
        if (!context.connectionData.waypoints) {
            context.connectionData.waypoints = connectRectangles(context.connectionData.source, context.connectionData.target, getMid(context.connectionData.source), getMid(context.connectionData.target));
        }
        if (context.connectionData.waypoints.length < 2) {
            throw Error('bad waypoints fiven to edge.connect connectionData, must supply atleast 2 waypoints!');
        }

        // create connection
        context.connection = elementFactory.createConnection(context.connectionData);
        if (context.connectionData.createModelElement) {
            eventBus.fire('edge.connect.create', context); // TODO
        }
        createDiagramEdge(context.connection, umlWebClient, diagramContext);
        canvas.addConnection(context.connection);

        // place children
        context.connection.numTargetLabels = 0,
        context.connection.numSourceLabels = 0,
        context.connection.numCenterLabels = 0;
        for (const child of context.children) {
            placeEdgeLabel(child, context.connection);
            if (child.parent) {
                canvas.addShape(child, child.parent);
            } else {
                canvas.addShape(child);
            }
            switch (child.elementType) {
                case 'label':
                    createDiagramLabel(child, umlWebClient, diagramContext);
                    break;
                case 'nameLabel':
                    createNameLabel(child, umlWebClient, diagramContext);
                    break;
                case 'typedElementLabel':
                    createTypedElementLabel(child, umlWebClient, diagramContext);
                    break;
                case 'keywordLabel':
                    createKeywordLabel(child, umlWebClient, diagramContext);
                    break;
                case 'associationEndLabel':
                    createAssociationEndLabel(child, umlWebClient, diagramContext);
                    break;
                case 'multiplicityLabel':
                    createMultiplicityLabel(child, umlWebClient, diagramContext);
                    break;
                default:
                    throw Error('Bad state! contact dev with stacktrace!');
            }
        }
    }
    revert(context) {
        throw Error('TODO! revert edgeConnectHandler!');
    }
}

function getOrientation(waypoint, middleOfShape) {
    if (waypoint.x > middleOfShape.x) {
        // to right
        return 'right';
    } else if (waypoint.x < middleOfShape.x) {
        // to left
        return 'left';
    } else if (waypoint.y > middleOfShape.y) {
        // to bottom
        return 'bottom';
    } else if (waypoint.y < middleOfShape.y) {
        return 'top';
    }
}

function placeFistLabel(child, waypoint, orientation) {
    switch (orientation) {
        case 'right':
            // place above
            child.x = waypoint.x + 5;
            child.y = waypoint.y - child.height - 5;
            break;
        case 'left':
            // place above
            child.x = waypoint.x - child.width - 5;
            child.y = waypoint.y - child.width - 5;
            break;
        case 'bottom':
            // place to left
            child.x = waypoint.x - child.width - 5;
            child.y = waypoint.y + 5;
            break;
        case 'top':
            // place to left
            child.x = waypoint.x - child.width - 5;
            child.y = waypoint.y - child.height - 5;
            break;
        default:
            throw Error('invalid orientation given to label for placement ' + orientation);
    }
}

function placeSecondLabel(child, waypoint, orientation) {
    switch (orientation) {
        case 'right':
            // place below
            child.x = waypoint.x + 5;
            child.y = waypoint.y + 5;
            break;
        case 'left':
            // place below
            child.x = waypoint.x - child.width - 5;
            child.y = waypoint.y + 5;
            break;
        case 'bottom':
            // place to right
            child.x = waypoint.x + 5;
            child.y = waypoint.y + 5;
            break;
        case 'top':
            // place to right
            child.x = waypoint.x + 5;
            child.y = waypoint.y + child.width + 5;
            break;
        default:
            throw Error('invalid orientation given to label for placement ' + orientation);
    }
}

export function placeEdgeLabel(child, connection) {
    if (child.elementType === 'label' || child.elementType === 'nameLabel' || child.elementType === 'typedElementLabel' || child.elementType === 'keywordLabel' || child.elementType === 'associationEndLabel' || child.elementType === 'multiplicityLabel') {
                child.labelTarget = connection;
                child.parent = connection;
                if (!child.width || !child.height) {
                    throw Error('Must fill out height and width of edge child before calling edge.connect!');
                }
                
                switch (child.placement) {
                    case 'source': {
                        let sourceWaypointPosition = connection.waypoints[0];
                        let sourceShapeMidPosition = getMid(connection.source);
                        let sourceOrientation = getOrientation(sourceWaypointPosition, sourceShapeMidPosition);
                        if (connection.numSourceLabels == 0) {
                            placeFistLabel(child, sourceWaypointPosition, sourceOrientation);
                        } else if (connection.numSourceLabels == 1) {
                            // place below
                            placeSecondLabel(child, sourceWaypointPosition, sourceOrientation);
                        } else {
                            throw Error('TODO handle more than 2 source labels!');
                        }
                        connection.numSourceLabels += 1;
                        break;
                    }
                    case 'center': {
                        let centerPoint;
                        let orientation;
                        if (connection.waypoints.length % 2 == 0) {
                            // even number of waypoints
                            let centerPoint1 = connection.waypoints[connection.waypoints.length / 2 - 1];
                            let centerPoint2 = connection.waypoints[connection.waypoints.length / 2];
                            centerPoint = {
                                x: (centerPoint1.x + centerPoint1.y) / 2,
                                y: (centerPoint1.y + centerPoint2.y) / 2,
                            };
                            if (Math.abs(centerPoint2.x - centerPoint1.x) / 2 > Math.abs(centerPoint2.y - centerPoint1.y) / 2) {
                                orientation = 'horizontal';
                            } else {
                                orientation = 'vertical';
                            }
                        } else {
                            const middleIndex = Math.floor(connection.waypoints.length / 2); 
                            centerPoint = connection.waypoints[middleIndex];
                            let centerPoint1 = connection.waypoints[middleIndex - 1];
                            let centerPoint2 = connection.waypoints[middleIndex + 1];
                            if (Math.abs(centerPoint2.x - centerPoint1.x) / 2 > Math.abs(centerPoint2.y - centerPoint1.y) / 2) {
                                orientation = 'horizontal';
                            } else {
                                orientation = 'vertical';
                            }
                        }
                        if (connection.numCenterLabels == 0) {
                            switch (orientation) {
                                case 'horizontal':
                                    // place above
                                    child.x = centerPoint.x - child.width / 2;
                                    child.y = centerPoint.y + child.height + 5;
                                    break;
                                case 'vertical':
                                    // place to left
                                    child.x = centerPoint.x - child.width - 5;
                                    child.y = centerPoint.y + child.height / 2;
                                    break;
                                default:
                                    throw Error('invalid orientation given to center placement label ' + orientation);
                            }
                        } else if (connection.numCenterLabels == 1) {
                            switch (orientation) {
                                case 'horizontal':
                                    // place below
                                    child.x = centerPoint.x - child.width / 2;
                                    child.y = centerPoint.y - 5;
                                    break;
                                case 'vertical':
                                    // place to right
                                    child.x = centerPoint.x + 5;
                                    child.y = centerPoint.y + child.height / 2;
                                    break;
                                default:
                                    throw Error('invalid orientation fiven to center placement label ' + orientation);
                            }
                        } else {
                            throw Error('TODO more than two center placement labels for edge! contact dev');
                        }
                        connection.numCenterLabels += 1;
                        break;
                    }
                    case 'target': {
                        const targetWaypoint = connection.waypoints.slice(-1)[0];
                        const middleOfTargetShape = getMid(connection.target);
                        const targetOrientation = getOrientation(targetWaypoint, middleOfTargetShape);
                        if (connection.numTargetLabels == 0) {
                            placeFistLabel(child, targetWaypoint, targetOrientation);
                        } else if (connection.numTargetLabels == 1) {
                            placeSecondLabel(child, targetWaypoint, targetOrientation);
                        } else {
                            throw Error('TODO handle more than 2 target labels!');
                        }
                        connection.numTargetLabels += 1;   
                        break;
                    }
                    default:
                        throw Error('Invalid placement ' + child.placement + ' given to EdgeConnect');
                }
    } else {
        throw Error('todo');
    }
                
}

export default class EdgeConnect {
    constructor(commandStack) {
        commandStack.registerHandler('edge.connect', EdgeConnectHandler);
    }
}
