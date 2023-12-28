import { createElementUpdate } from '../../../../umlUtil';
import { createDiagramEdge } from '../../api/diagramInterchange';
import { randomID } from 'uml-client/lib/element';
import { createDiagramLabel, createDiagramShape } from '../../api/diagramInterchange';
import { adjustShape } from '../InteractWithModel';
import { getMultiplicityText } from '../UMLRenderer';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { assign } from 'min-dash';

export const OWNED_END_RADIUS = 5;

export default class Association extends RuleProvider {
    constructor(eventBus, umlWebClient, diagramEmitter, diagramContext, modeling, umlRenderer, elementFactory, canvas, graphicsFactory) {
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

                    createAssociationConnection(event, association, modeling);
                    const lastWaypoint = event.context.connection.waypoints.slice(-1)[0];
                    const propertyShape = createAssociationEndShape(event, memberEnd, lastWaypoint, modeling);
                    createAssociationEndLabel(propertyShape, umlRenderer, elementFactory, canvas, umlWebClient, diagramContext);

                    // send to server and rest of client
                    await createDiagramEdge(event.context.connection, umlWebClient, diagramContext);
                    await createDiagramShape(propertyShape, umlWebClient, diagramContext);
                    diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, clazz, association));
                }
                createAssociation();
                return false; // stop propogation
            } else if (event.context.start.connectType === 'composition') {
                // composition
                const createAssociation = async () => {
                    const association = await umlWebClient.post('association');
                    const sourceEnd = await umlWebClient.post('property');
                    const targetEnd = await umlWebClient.post('property');
                    sourceEnd.type.set(event.context.start.modelElement);
                    targetEnd.aggregation = 'composite';
                    targetEnd.type.set(event.hover.modelElement);
                    association.ownedEnds.add(sourceEnd);
                    association.ownedEnds.add(targetEnd);
                    diagramContext.context.packagedElements.add(association);
                    
                    umlWebClient.put(association);
                    umlWebClient.put(sourceEnd);
                    umlWebClient.put(targetEnd);
                    umlWebClient.put(diagramContext.context);

                    createAssociationConnection(event, association, modeling);
                    await createDiagramEdge(event.context.connection, umlWebClient, diagramContext);
                    diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, association));
                };
                createAssociation();
                return false;
            } else if (event.context.start.connectType === 'directedAssociation') {
                // directed association
                const createAssociation = async () => {
                    const association = await umlWebClient.post('association');
                    const memberEnd = await umlWebClient.post('property');
                    const ownedEnd = await umlWebClient.post('property');
                    memberEnd.clazz.set(event.context.start.modelElement);
                    memberEnd.type.set(event.hover.modelElement);
                    memberEnd.name = event.hover.modelElement.name.toLowerCase();
                    ownedEnd.type.set(event.context.start.modelElement);
                    association.ownedEnds.add(ownedEnd);
                    association.memberEnds.add(memberEnd);
                    diagramContext.context.packagedElements.add(association);
                    umlWebClient.put(association);
                    umlWebClient.put(memberEnd);
                    umlWebClient.put(ownedEnd);
                    umlWebClient.put(event.context.start.modelElement);
                    umlWebClient.put(diagramContext.context);

                    createAssociationConnection(event, association, modeling);
                    const lastWaypoint = event.context.connection.waypoints.slice(-1)[0];
                    const propertyShape = createAssociationEndShape(event, memberEnd, lastWaypoint, modeling);
                    createAssociationEndLabel(propertyShape, umlRenderer, elementFactory, canvas, umlWebClient, diagramContext);
                    await createDiagramEdge(event.context.connection, umlWebClient, diagramContext);
                    await createDiagramShape(propertyShape , umlWebClient, diagramContext);
                    diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, association));
                };
                createAssociation();
                return false;
            } else if (event.context.start.connectType === 'association') {
                // association
                const createAssociation = async () => {
                    const association = await umlWebClient.post('association');
                    const sourceEnd = await umlWebClient.post('property');
                    const targetEnd = await umlWebClient.post('property');
                    sourceEnd.type.set(event.context.start.modelElement);
                    association.ownedEnds.add(sourceEnd);
                    targetEnd.type.set(event.hover.modelElement);
                    association.ownedEnds.add(targetEnd);
                    diagramContext.context.packagedElements.add(association);
                    umlWebClient.put(association);
                    umlWebClient.put(sourceEnd);
                    umlWebClient.put(targetEnd);
                    umlWebClient.put(diagramContext.context);

                    createAssociationConnection(event, association, modeling);
                    await createDiagramEdge(event.context.connection, umlWebClient, diagramContext);
                    diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, association));
                };
                createAssociation();
                return false;
            } else if (event.context.start.connectType === 'biDirectionalAssociation') {
                // TODO bi-directional association
                const createAssociation = async () => {
                    const association = await umlWebClient.post('association');
                    const sourceEnd = await umlWebClient.post('property');
                    const targetEnd = await umlWebClient.post('property');
                    sourceEnd.type.set(event.context.start.modelElement);
                    sourceEnd.clazz.set(event.hover.modelElement);
                    sourceEnd.name = event.context.start.modelElement.name.toLowerCase();
                    association.memberEnds.add(sourceEnd);
                    targetEnd.type.set(event.hover.modelElement);
                    targetEnd.clazz.set(event.context.start.modelElement);
                    targetEnd.name = event.hover.modelElement.name.toLowerCase();
                    association.memberEnds.add(targetEnd);
                    diagramContext.context.packagedElements.add(association);
                    umlWebClient.put(association);
                    umlWebClient.put(sourceEnd);
                    umlWebClient.put(targetEnd);
                    umlWebClient.put(event.hover.modelElement);
                    umlWebClient.put(event.context.start.modelElement);
                    umlWebClient.put(diagramContext.context);

                    createAssociationConnection(event, association, modeling);
                    const sourceShape = createAssociationEndShape(event, sourceEnd, event.context.connection.waypoints[0], modeling);
                    createAssociationEndLabel(sourceShape, umlRenderer, elementFactory, canvas, umlWebClient, diagramContext);
                    const targetShape = createAssociationEndShape(event, targetEnd, event.context.connection.waypoints.slice(-1)[0], modeling);
                    createAssociationEndLabel(targetShape,umlRenderer, elementFactory, canvas, umlWebClient, diagramContext);
                    await createDiagramEdge(event.context.connection, umlWebClient, diagramContext);
                    await createDiagramShape(sourceShape, umlWebClient, diagramContext);
                    await createDiagramShape(targetShape, umlWebClient, diagramContext);
                    diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, association));
                };
                createAssociation();
                return false;
            }
        });

        // handle all global connects
        eventBus.on('directedComposition.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'directedComposition';
            });
        });

        eventBus.on('composition.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'composition';
            });
        });

        eventBus.on('directedAssociation.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'directedAssociation';
            });
        });

        eventBus.on('association.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'association';
            });
        });
        
        eventBus.on('biDirectionalAssociation.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'biDirectionalAssociation';
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
        eventBus.on('shape.move.end', 900, (event) => {
            const shape = event.shape;
            if (shape.labelTarget && shape.labelTarget.modelElement && shape.labelTarget.modelElement.isSubClassOf('property')) {
                assign(shape,
                    {
                        parent : shape.labelTarget.parent
                    });
                graphicsFactory.update('shape', shape, canvas.getGraphics(shape));
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

Association.$inject = ['eventBus', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'modeling', 'umlRenderer', 'elementFactory', 'canvas', 'graphicsFactory'];

function checkConnectionEnds(connection, umlWebClient, modeling, umlRenderer) {
    if (!connection.children) {
        return;
    }
    for (const end of connection.children) {
        if (end.modelElement.elementType() === 'property' && !end.labelTarget) {
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
    canvas.addShape(propertyLabel, propertyShape.parent);
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
    if (labelBounds.width < 10) {
        labelBounds.width = 10;
    }
    if (labelBounds.height < 10) {
        labelBounds.height = 10;
    }
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

function createAssociationConnection(event, association, modeling) {
    event.context.connection = modeling.connect(
        event.context.start, 
        event.hover, 
        {
            id: randomID(),
            modelElement: association
        }, 
        {}
    );
}

function createAssociationEndShape(event, modelElement, waypoint, modeling) {
    return modeling.createShape(
        {
            id: randomID(),
            modelElement: modelElement
        },
        {
            x: waypoint.x - OWNED_END_RADIUS,
            y: waypoint.y - OWNED_END_RADIUS,
            width: 2 * OWNED_END_RADIUS,
            height: 2 * OWNED_END_RADIUS,
        },
        event.context.connection
    );
}
