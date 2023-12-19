import { createElementUpdate } from '../../../../umlUtil';
import { createEdge } from './relationshipUtil';
import { randomID } from 'uml-client/lib/element';
import { createDiagramLabel, createDiagramShape } from '../../api/diagramInterchange';
import { adjustShape } from '../InteractWithModel';
import { getMultiplicityText } from '../UMLRenderer';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export const OWNED_END_RADIUS = 5;

export default class DirectedComposition extends RuleProvider {
    constructor(eventBus, umlWebClient, diagramEmitter, diagramContext, modeling, umlRenderer, elementFactory, canvas) {
        super(eventBus);
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

                    // custom to call ends the lower case of their type
                    memberEnd.name = event.hover.modelElement.name.toLowerCase();

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

                    // create property shape at end of association
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

                    // create Label
                    createAssociationEndLabel(propertyShape, umlRenderer, elementFactory, canvas, umlWebClient, diagramContext);

                    // send to server and rest of client
                    await createEdge(event.context.connection, umlWebClient, diagramContext);
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
                checkConnectionEnds(connection, umlWebClient, modeling, umlRenderer);
            }
            for (const connection of shape.outgoing) {
                checkConnectionEnds(connection, umlWebClient, modeling, umlRenderer);
            }
        });
        eventBus.on('connection.move.end', (event) => {
            checkConnectionEnds(event.connection, umlWebClient, modeling, umlRenderer);
        });
        eventBus.on('resize.end', (event) => {
            const shape = event.shape;
            for (const connection of shape.incoming) {
                checkConnectionEnds(connection, umlWebClient, modeling, umlRenderer);
            }
            for (const connection of shape.outgoing) {
                checkConnectionEnds(connection, umlWebClient, modeling, umlRenderer);
            }
        });
        eventBus.on('bendpoint.move.end', (event) => {
            const connection = event.connection;
            checkConnectionEnds(connection, umlWebClient, modeling, umlRenderer);
        });
        eventBus.on('connectionSegment.move.move', (event) => {
            const connection = event.connection;
            checkConnectionEnds(connection, umlWebClient, modeling, umlRenderer);
        });
    }

    init() {
        this.addRule('connection.start', (context) => {
           return canConnect(context);
        });

        this.addRule('connection.create', (context) => {
            return canConnect(context);
        });
        this.addRule('connection.reconnect', (context) => {
            return canConnect(context);
        });
    }
}

function canConnect(context) {
    if (!context.source || !context.source.connectType) {
        return true;
    }
    if (context.source.connectType === 'directeComposition') {
        if (!context.source.modelElement) {
            return false;
        }
        if (!context.source.modelElement.isSubClassOf('classifier')) {
            return false;
        }
    }
    return true;
}

DirectedComposition.$inject = ['eventBus', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'modeling', 'umlRenderer', 'elementFactory', 'canvas'];

function checkConnectionEnds(connection, umlWebClient, modeling, umlRenderer) {
    for (const end of connection.children) {
        if (end.modelElement.elementType() === 'property') {
            let newEndBounds = {
                width: 2 * OWNED_END_RADIUS,
                height: 2 * OWNED_END_RADIUS,
            };
            if (end.modelElement.type.id() === connection.source.modelElement.id) {
                const firstWaypoint = connection.waypoints[0];
                newEndBounds.x = firstWaypoint.x - OWNED_END_RADIUS;
                newEndBounds.y = firstWaypoint.y - OWNED_END_RADIUS;
            } else if (end.modelElement.type.id() === connection.target.modelElement.id) {
                const lastWaypoint = connection.waypoints.slice(-1)[0];
                newEndBounds.x = lastWaypoint.x - OWNED_END_RADIUS;
                newEndBounds.y = lastWaypoint.y - OWNED_END_RADIUS;
            }
            modeling.resizeShape(end, newEndBounds);
            const adjustEdgeShape = async () => {
                await adjustShape(end, await umlWebClient.get(end.id), umlWebClient);
            }
            adjustEdgeShape(); 

            // move label
            for (const label of end.labels) {
                modeling.resizeShape(
                    label,
                    getLabelBounds(end, umlRenderer)
                );
                // update it to server
                const adjustLabel = async () => {
                    await adjustShape(label, await umlWebClient.get(label.id), umlWebClient);
                };
                adjustLabel();
            }
        }
    }
}

export function createAssociationEndLabel(propertyShape, umlRenderer, elementFactory, canvas, umlWebClient, diagramContext) {
    let labelName = propertyShape.modelElement.name;
    let labelBounds = getLabelBounds(propertyShape, umlRenderer);
    const propertyLabel = elementFactory.createLabel({
        id: randomID(),
        labelTarget: propertyShape,
        modelElement: propertyShape.modelElement,
        text: labelName,
        x: labelBounds.x,
        y: labelBounds.y,
        width: labelBounds.width,
        height: labelBounds.height,
    });
    canvas.addShape(propertyLabel, canvas.findRoot(propertyShape));
    createDiagramLabel(propertyLabel, umlWebClient, diagramContext);
}

export function getLabelBounds(propertyShape, umlRenderer) {
    let labelName = propertyShape.modelElement.name;
    labelName += " " + getMultiplicityText(propertyShape);
    const options = {
        align: 'center-middle',
        box: {
            width: 200,
        }
    };
    const labelBounds = umlRenderer.textUtil.getDimensions(labelName, options);
    labelBounds.width = Math.ceil(labelBounds.width) + 10;
    labelBounds.height = Math.ceil(labelBounds.height);
    let typeShape;
    if (propertyShape.parent.source.modelElement.id === propertyShape.modelElement.type.id()) {
        typeShape = propertyShape.parent.source;
    } else if (propertyShape.parent.target.modelElement.id === propertyShape.modelElement.type.id()) {
        typeShape = propertyShape.parent.target;
    } else {
        throw new Error('bad state!');
    }
    if (propertyShape.y < typeShape.y) {
        // it is above the shape
        // put it above and to the right
        labelBounds.x = propertyShape.x + 20;
        labelBounds.y = propertyShape.y - 10;
    } else {
        // it is either below or to either side
        if (propertyShape.x < typeShape.x) {
            // it is to left
            // place it above and to the left making sure it doesn't overflow above
            labelBounds.x = propertyShape.x - labelBounds.width;
            labelBounds.y = propertyShape.y - 20;
        } else if (propertyShape.x + (2 * OWNED_END_RADIUS) > (typeShape.x + typeShape.width)) {
            // it is to the right
            // place it above and to the right
            labelBounds.x = propertyShape.x + 20;
            labelBounds.y = propertyShape.y - 10;
        } else {
            // it is below
            // place it below and to the right
            labelBounds.x = propertyShape.x + 20;
            labelBounds.y = propertyShape.y + labelBounds.height;
        }
    }
    return labelBounds;
}
