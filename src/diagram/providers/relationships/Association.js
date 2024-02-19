import { createElementUpdate } from '../../../umlUtil';
import { randomID } from 'uml-client/lib/element';
import { getMultiplicityText } from '../UMLRenderer';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { getTextDimensions } from '../ClassDiagramPaletteProvider';
import { adjustShape } from '../UmlShapeProvider';
import { placeEdgeLabel } from '../EdgeConnect';

export const OWNED_END_RADIUS = 5;

export default class Association extends RuleProvider {
    constructor(eventBus, umlWebClient, umlRenderer, canvas, graphicsFactory, commandStack, diagramContext, elementFactory, diagramEmitter) {
        super(eventBus);
        eventBus.on('connect.end', 1100, (event) => {
            // check if it can connect
            if (
                event.context.start.connectType === 'directedComposition' ||
                event.context.start.connectType === 'composition' ||
                event.context.start.connectType === 'directedAssociation' ||
                event.context.start.connectType === 'association' ||
                event.context.start.connectType === 'biDirectionalAssociation'
            ) {
                commandStack.execute('edge.connect', {
                    connectionData: {
                        id: randomID(),
                        modelElement: {
                            id: randomID(),
                            elementType() {
                                'association'
                            }
                        },
                        createModelElement: true,
                        source: event.context.start,
                        target: event.hover,
                        children: [],
                    },
                    connectType: event.context.start.connectType,
                    children: [],
                });
                return false; // stop propogation
            }
        });
        eventBus.on('edge.connect.create', (context) => {
            function createAssociationEndLabelForProperty(property, placement) {
                return elementFactory.createLabel({
                    id: randomID(),
                    width: Math.round(getTextDimensions(property.name, umlRenderer).width) + 10,
                    height: 24,
                    modelElement: property,
                    labelTarget: context.connection,
                    parent: context.connection,
                    elementType: 'associationEndLabel',
                    text: property.name,
                    placement: placement,
                });
            }
            if (context.connectType === 'directedComposition') {
                // create the association and properties
                const association = umlWebClient.post('association', {id: context.connection.modelElement.id});
                context.connection.modelElement = association;
                const memberEnd = umlWebClient.post('property');
                const ownedEnd = umlWebClient.post('property');
                memberEnd.type.set(context.connection.target.modelElement);
                memberEnd.aggregation = 'composite';

                // custom to call ends the lower case of their type
                memberEnd.name = context.connection.target.modelElement.name.toLowerCase();

                ownedEnd.type.set(context.connection.source.modelElement);
                association.memberEnds.add(memberEnd);
                association.ownedEnds.add(ownedEnd); 
                const clazz = context.connection.source.modelElement;
                memberEnd.clazz.set(clazz);
                diagramContext.context.packagedElements.add(association);

                umlWebClient.put(association);
                umlWebClient.put(memberEnd);
                umlWebClient.put(ownedEnd);
                umlWebClient.put(clazz);
                umlWebClient.put(diagramContext.context);

                if (memberEnd.name) {
                    // initialize with associationEnd label
                    context.children.push(createAssociationEndLabelForProperty(memberEnd, 'target'));
                }
                diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, clazz, context.connection.modelElement)); 
            } else if (context.connectType === 'composition') {
                const association = umlWebClient.post('association', {id: context.connection.modelElement.id});
                context.connection.modelElement = association;
                const sourceEnd = umlWebClient.post('property');
                const targetEnd = umlWebClient.post('property');
                sourceEnd.type.set(context.connection.source.modelElement);
                targetEnd.aggregation = 'composite';
                targetEnd.type.set(context.connection.target.modelElement);
                targetEnd.name = context.connection.target.modelElement.name.toLowerCase();
                association.ownedEnds.add(sourceEnd);
                association.ownedEnds.add(targetEnd);
                diagramContext.context.packagedElements.add(association);
                
                umlWebClient.put(association);
                umlWebClient.put(sourceEnd);
                umlWebClient.put(targetEnd);
                umlWebClient.put(diagramContext.context);
                if (targetEnd.name !== '') {
                    context.children.push(createAssociationEndLabelForProperty(targetEnd, 'target'));
                }
                diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, context.connection.modelElement));
            } else if (context.connectType === 'directedAssociation') {
                const source = context.connection.source.modelElement,
                target = context.connection.target.modelElement;
                const association = umlWebClient.post('association', {id:context.connection.modelElement.id});
                context.connection.modelElement = association;
                const memberEnd = umlWebClient.post('property');
                const ownedEnd = umlWebClient.post('property');
                memberEnd.clazz.set(source);
                memberEnd.type.set(target);
                memberEnd.name = target.name.toLowerCase();
                ownedEnd.type.set(source);
                association.ownedEnds.add(ownedEnd);
                association.memberEnds.add(memberEnd);
                diagramContext.context.packagedElements.add(association);
                umlWebClient.put(association);
                umlWebClient.put(memberEnd);
                umlWebClient.put(ownedEnd);
                umlWebClient.put(source);
                umlWebClient.put(diagramContext.context);

                if (memberEnd.name !== '') {
                    context.children.push(createAssociationEndLabelForProperty(memberEnd, 'target'));
                }

                diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, context.connection.modelElement));
            } else if (context.connectType === 'association') {
                const source = context.connection.source.modelElement;
                const target = context.connection.target.modelElement;
                const association = umlWebClient.post('association', {id:context.connection.modelElement.id});
                context.connection.modelElement = association;
                const sourceEnd = umlWebClient.post('property');
                const targetEnd = umlWebClient.post('property');
                sourceEnd.type.set(source);
                sourceEnd.name = source.name.toLowerCase();
                association.ownedEnds.add(sourceEnd);
                targetEnd.type.set(target);
                targetEnd.name = target.name.toLowerCase();
                association.ownedEnds.add(targetEnd);
                diagramContext.context.packagedElements.add(association);
                umlWebClient.put(association);
                umlWebClient.put(sourceEnd);
                umlWebClient.put(targetEnd);
                umlWebClient.put(diagramContext.context);

                if (sourceEnd.name !== '') {
                    context.children.push(createAssociationEndLabelForProperty(sourceEnd, 'source'));
                }

                if (targetEnd.name !== '') {
                    context.children.push(createAssociationEndLabelForProperty(targetEnd, 'target'));
                }

                diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, context.connection.modelElement));
            } else if (context.connectType === 'biDirectionalAssociation') {
                const target = context.connection.target.modelElement;
                const source = context.connection.source.modelElement;
                const association = umlWebClient.post('association', {id:context.connection.modelElement.id});
                context.connection.modelElement = association;
                const sourceEnd = umlWebClient.post('property');
                const targetEnd = umlWebClient.post('property');
                sourceEnd.type.set(source);
                sourceEnd.clazz.set(target);
                sourceEnd.name = source.name.toLowerCase();
                association.memberEnds.add(sourceEnd);
                targetEnd.type.set(target);
                targetEnd.clazz.set(source);
                targetEnd.name = target.name.toLowerCase();
                association.memberEnds.add(targetEnd);
                diagramContext.context.packagedElements.add(association);
                umlWebClient.put(association);
                umlWebClient.put(sourceEnd);
                umlWebClient.put(targetEnd);
                umlWebClient.put(source);
                umlWebClient.put(target);
                umlWebClient.put(diagramContext.context);

                if (sourceEnd.name) {
                    context.children.push(createAssociationEndLabelForProperty(sourceEnd, 'source'));
                }

                if (targetEnd.name) {
                    context.children.push(createAssociationEndLabelForProperty(targetEnd, 'target'));
                }

                diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, source, target));
            }
        });
        eventBus.on('edgeCreateUndo', (context) => {
            const deleteMembers = async () => {
                const elsToDeleteOwners = [await context.context.connection.modelElement.owner.get()];
                for await (const memberEnd of context.context.connection.modelElement.memberEnds) {
                    const memberEndOwner = await memberEnd.owner.get();
                    if (!elsToDeleteOwners.includes(memberEndOwner)) {
                        elsToDeleteOwners.push(memberEndOwner);
                    }
                }
                for await (const memberEnd of context.context.connection.modelElement.memberEnds) {
                    await umlWebClient.deleteElement(memberEnd)
                }
                await umlWebClient.deleteElement(context.context.connection.modelElement);
                diagramEmitter.fire('elementUpdate', createElementUpdate(...elsToDeleteOwners));
            }
            deleteMembers();
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

        eventBus.on('server.update', 900, (event) => {
            if (event.serverElement.modelElement.elementType() === 'association' && 
                event.serverElement.elementType() === 'edge') {
                    for (const child of event.localElement.children) {
                        graphicsFactory.update('shape', child, canvas.getGraphics(child));
                    }
                }
        });
        eventBus.on('edge.move.end', (event) => {
            checkConnectionEnds(event.connection, graphicsFactory, canvas, umlWebClient);
        });
        eventBus.on('resize.end', (event) => {
            const shape = event.shape;
            for (const connection of shape.incoming) {
                checkConnectionEnds(connection, graphicsFactory, canvas, umlWebClient);
            }
            for (const connection of shape.outgoing) {
                checkConnectionEnds(connection, graphicsFactory, canvas, umlWebClient);
            }
        });
        eventBus.on('uml.shape.move', (context) => {
            const shape = context.shape;
            for (const connection of shape.incoming) {
                checkConnectionEnds(connection, graphicsFactory, canvas, umlWebClient);
            }
            for (const connection of shape.outgoing) {
                checkConnectionEnds(connection, graphicsFactory, canvas, umlWebClient);
            } 
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

Association.$inject = ['eventBus', 'umlWebClient', 'umlRenderer', 'canvas', 'graphicsFactory', 'commandStack', 'diagramContext', 'elementFactory', 'diagramEmitter'];

export function createAssociationEndLabel(association, property, umlRenderer, elementFactory, canvas) {
    let labelName = property.name;
    let labelBounds = getLabelBounds(property, association, umlRenderer);
    const propertyLabel = elementFactory.createLabel({
        id: randomID(),
        labelTarget: association,
        modelElement: property,
        text: labelName,
        x: labelBounds.x,
        y: labelBounds.y,
        width: labelBounds.width,
        height: labelBounds.height,
    });
    canvas.addShape(propertyLabel, association);
    return propertyLabel;
}

export function getLabelBounds(property, association, umlRenderer) {
    let labelName = property.name;
    labelName += " " + getMultiplicityText(property);
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
    let propertyPoint;
    if (association.source.modelElement.id === property.type.id()) {
        typeShape = association.source;
        propertyPoint = association.waypoints[0];
    } else if (association.target.modelElement.id === property.type.id()) {
        typeShape = association.target;
        propertyPoint = association.waypoints.slice(-1)[0];
    } else {
        throw new Error('bad state!');
    }
    if (propertyPoint.y <= typeShape.y) {
        // it is above the shape
        // put it above and to the right
        labelBounds.x = propertyPoint.x + 20;
        labelBounds.y = propertyPoint.y - 20;
    } else {
        // it is either below or to either side
        if (propertyPoint.x <= typeShape.x) {
            // it is to left
            // place it above and to the left making sure it doesn't overflow above
            labelBounds.x = propertyPoint.x - labelBounds.width;
            labelBounds.y = propertyPoint.y - 20;
        } else if (propertyPoint.x + (2 * OWNED_END_RADIUS) > (typeShape.x + typeShape.width)) {
            // it is to the right
            // place it above and to the right
            labelBounds.x = propertyPoint.x + 20;
            labelBounds.y = propertyPoint.y - 20;
        } else {
            // it is below
            // place it below and to the right
            labelBounds.x = propertyPoint.x + 20;
            labelBounds.y = propertyPoint.y + labelBounds.height;
        }
    }
    return labelBounds;
}



async function checkConnectionEnds(connection, graphicsFactory, canvas, umlWebClient) {
    // move label
    connection.numTargetLabels = 0;
    connection.numSourceLabels = 0;
    connection.numCenterLabels = 0;
    for (const label of connection.labels) {
        // TODO only update if the waypoint corresponding to the label has changed
        placeEdgeLabel(label, connection);
        graphicsFactory.update('shape', label, canvas.getGraphics(label));

        // update it to server
        if (umlWebClient) await adjustShape(label, await umlWebClient.get(label.id), umlWebClient);
    }
}
