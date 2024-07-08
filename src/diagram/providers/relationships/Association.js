import { createElementUpdate } from '../../../umlUtil';
import { randomID } from 'uml-client/lib/types/element';
import { getMultiplicityText } from '../UMLRenderer';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { getTextDimensions } from '../ClassDiagramPaletteProvider';
import { adjustShape } from '../UmlShapeProvider';
import { placeEdgeLabel } from '../EdgeConnect';
import { createAssociationEndLabel, createMultiplicityLabel, createNameLabel, updateLabel } from '../../api/diagramInterchange/label';
import { deleteUmlDiagramElement } from '../../api/diagramInterchange/util';
import { createAssociationNameLabel } from '../RelationshipEdgeCreator';

export const OWNED_END_RADIUS = 5;

export default class Association extends RuleProvider {
    constructor(eventBus, umlWebClient, umlRenderer, canvas, graphicsFactory, commandStack, diagramContext, elementFactory, diagramEmitter, elementRegistry, modelElementMap) {
        super(eventBus);
        commandStack.registerHandler('memberEnds.show', ShowMemberEndsHandler);
        eventBus.on('connect.end', 1100, (event) => {
            // check if it can connect
            if (isAssociationConnectType(event.context.start.connectType)) {
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
        eventBus.on('edge.connect.undo', (context) => {
            const deleteMembers = async () => {
                const connection = context.connection;
                const elsToDeleteOwners = [await connection.modelElement.owner.get()];
                for await (const memberEnd of connection.modelElement.memberEnds) {
                    const memberEndOwner = await memberEnd.owner.get();
                    if (!elsToDeleteOwners.includes(memberEndOwner)) {
                        elsToDeleteOwners.push(memberEndOwner);
                    }
                }
                for await (const memberEnd of connection.modelElement.memberEnds) {
                    const labelIndex = context.children.findIndex(child => child.modelElement.id === memberEnd.id);
                    if (labelIndex >= 0) {
                        context.children.splice(labelIndex, 1);
                    }
                    await umlWebClient.deleteElement(memberEnd);
                }
                await umlWebClient.deleteElement(connection.modelElement);
                umlWebClient.put(diagramContext.context);
                diagramEmitter.fire('elementUpdate', createElementUpdate(...elsToDeleteOwners));
            }
            if (isAssociationConnectType(context.connectType)) {
                deleteMembers();
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

        eventBus.on('server.update', 900, (event) => {
            if (event.serverElement.modelElement && event.serverElement.modelElement.elementType() === 'association' && 
                event.serverElement.elementType() === 'edge') {
                    // check if name has changed
                    const edge = elementRegistry.get(event.serverElement.id);
                    const association = edge.modelElement;
                    if (association.name === '') {
                        // check to make sure that there is no name label for us
                        for (const label of edge.labels) {
                            if (label.elementType === 'nameLabel' && label.modelElement.id === association.id) {
                                canvas.removeShape(label);
                                deleteUmlDiagramElement(label.id, umlWebClient);
                                edge.labels.splice(edge.labels.indexOf(label),1);
                                edge.children.splice(edge.children.indexOf(label), 1);
                                edge.numCenterLabels -= 1;
                            }
                        }
                    } else {
                        let nameLabel;
                        for (const label of edge.labels) {
                            if (label.elementType === 'nameLabel' && label.modelElement.id === association.id) {
                                nameLabel = label;
                                break;
                            }
                        }

                        if (!nameLabel) {
                            // make one
                            nameLabel = createAssociationNameLabel(edge, elementFactory, umlRenderer);
                            placeEdgeLabel(nameLabel, edge);
                            canvas.addShape(nameLabel, edge);
                            createNameLabel(nameLabel, umlWebClient, diagramContext);
                        } else if (nameLabel.text !== association.name) {
                            nameLabel.text = association.name;
                            nameLabel.width = Math.round(getTextDimensions(association.name, umlRenderer).width) + 15;
                            updateLabel(nameLabel, umlWebClient);
                            graphicsFactory.update('shape', nameLabel, canvas.getGraphics(nameLabel));
                        }
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
        eventBus.on('server.update', 1100, (context) => {
            const serverLabel = context.serverElement,
            localLabel = context.localElement,
            elementType = serverLabel.elementType();
            const setTextAndWidth = (text) => {
                const textWidth = Math.round(getTextDimensions(text, umlRenderer).width) + 10;
                localLabel.text = text;
                serverLabel.text = text;
                // determine whether to move
                let shape = undefined;
                if (localLabel.placement === 'target') {
                    shape = localLabel.labelTarget.target;
                } else if (localLabel.placement === 'source') {
                    shape = localLabel.labelTarget.source
                } else {
                    throw Error('Bad placement');
                }

                if (shape.x > localLabel.x) {
                    // adjust width
                    const dWidth = textWidth - localLabel.width;
                    localLabel.x -= dWidth;
                    serverLabel.bounds.x -= dWidth;
                }

                localLabel.width = textWidth;
                serverLabel.bounds.width = textWidth;
            };
            
            if (elementType === 'associationEndLabel') {
                if (serverLabel.modelElement.name !== serverLabel.text) {
                    
                    // resize label
                    setTextAndWidth(serverLabel.modelElement.name);
                    updateLabel(localLabel, umlWebClient);
                    graphicsFactory.update('shape', localLabel, canvas.getGraphics(localLabel));
                }
            }

            if (elementType === 'multiplicityLabel') {
                const doLater = async () => {
                    // TODO should be easier when guarenteed lower and upper work
                    const lowerValue = await serverLabel.modelElement.lowerValue.get();
                    const upperValue = await serverLabel.modelElement.upperValue.get();
                    if (!lowerValue || !upperValue) {
                        return;
                    }
                    if (lowerValue.elementType() !== 'literalInt') {
                        return;
                    }
                    if (upperValue.elementType() !== 'literalInt' || upperValue.elementType() !== 'literalUnlimitedNatural') {
                        return;
                    }
                    const multiplicityText = lowerValue.value + '..' + upperValue.value;
                    setTextAndWidth(multiplicityText);
                    updateLabel(localLabel, umlWebClient);
                };
                doLater();
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

Association.$inject = ['eventBus', 'umlWebClient', 'umlRenderer', 'canvas', 'graphicsFactory', 'commandStack', 'diagramContext', 'elementFactory', 'diagramEmitter', 'elementRegistry', 'modelElementMap'];

class ShowMemberEndsHandler {
    constructor(elementFactory, canvas, umlWebClient, diagramContext, umlRenderer) {
        this._elementFactory = elementFactory;
        this._canvas = canvas;
        this._umlWebClient = umlWebClient;
        this._diagramContext = diagramContext;
        this._umlRenderer = umlRenderer;
    }
    execute(context) {
        const doLater = async () => {
            const elementFactory = this._elementFactory,
            canvas = this._canvas,
            umlWebClient = this._umlWebClient,
            diagramContext = this._diagramContext,
            umlRenderer = this._umlRenderer;
            const edge = context.edge;
            const getTextWidth = (text) => {
                return Math.round(getTextDimensions(text, umlRenderer).width) + 10
            }
            for (const property of context.ends) {
                const createPropertyLabelOfType = async (labelType, text) => {
                    // create it
                    let placement = undefined
                    if (property.type.id() === edge.source.modelElement.id) {
                        placement = 'source';
                    }
                    if (property.type.id() === edge.target.modelElement.id) {
                        placement = 'target';
                    }
                    if (!placement) {
                        return undefined;
                    }
                    const ret = elementFactory.createLabel({
                        id: randomID(),
                        width: getTextWidth(text),
                        height: 24,
                        modelElement: property,
                        labelTarget: edge,
                        parent: edge,
                        elementType: labelType,
                        text: text,
                        placement: placement,
                    });
                    placeEdgeLabel(ret, edge);
                    canvas.addShape(ret, edge);
                    switch (labelType) {
                        case 'associationEndLabel':
                            await createAssociationEndLabel(ret, umlWebClient, diagramContext);
                            break;
                        case 'multiplicityLabel':
                            await createMultiplicityLabel(ret, umlWebClient, diagramContext);
                            break;
                        default:
                            throw Error('bad label for property update!');
                    }
                    return ret;
                };

                // determine if we need to update a the associationEndLabel associated with this property being updated
                let associationEndLabel = undefined;
                for (const label of edge.labels) {
                    if (label.elementType === 'associationEndLabel' && label.modelElement.id === property.id) {
                        associationEndLabel = label;
                        break;
                    }
                }
                
                if (!associationEndLabel && property.name !== '') {
                    // create it since the name has been updated to not be empty
                    context.associationEndLabel = await createPropertyLabelOfType('associationEndLabel', property.name);
                }

                let multiplicityLabel = undefined;
                for (const label of edge.labels) {
                    if (label.elementType === 'multiplicityLabel' && label.modelElement.id === property.id) {
                        multiplicityLabel = label;
                        break;
                    }
                }

                if (!multiplicityLabel && (await isPropertyValidForMultiplicityLabel(property))) {
                    let multiplicityText = (await property.lowerValue.get()).value + '..' + (await property.upperValue.get()).value;
                    context.multiplicityLabel = await createPropertyLabelOfType('multiplicityLabel', multiplicityText);
                }
            }
        }
        doLater();
    }
    revert(context) {
        const canvas = this._canvas,
        umlWebClient = this._umlWebClient;
        const deleteLabel = (label) => {
            deleteUmlDiagramElement(label.id, umlWebClient);
            if (label.placement === 'source') {
                context.edge.numSourceLabels -= 1;
            } else if (label.placement === 'target') {
                context.edge.numTargetLabels -= 1;
            }
            const index = context.edge.labels.indexOf(label);
            if (index > -1) {
                context.edge.labels.splice(index, 1);
            }
            canvas.removeShape(label);
        }
        if (context.associationEndLabel) {
            // there was an associationEndLabel created delete it
            deleteLabel(context.associationEndLabel);
            delete context.associationEndLabel;
        }

        if (context.multiplicityLabel) {
            // there was a multiplicityLabel created, delete it
            deleteLabel(context.multiplicityLabel);
            delete context.multiplicityLabel;
        }
    }
}

ShowMemberEndsHandler.$inject = ['elementFactory', 'canvas', 'umlWebClient', 'diagramContext', 'umlRenderer'];

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

function isAssociationConnectType(connectType) {
    return connectType === 'directedComposition' ||
           connectType === 'composition' ||
           connectType === 'directedAssociation' ||
           connectType === 'association' ||
           connectType === 'biDirectionalAssociation';
}

export async function isPropertyValidForMultiplicityLabel(property) {
    let isNotValidForMultiplicityLabel = false;
    if (!property.lowerValue.has()) {
        isNotValidForMultiplicityLabel = true;
    } else {
        const lowerValue = await property.lowerValue.get();
        switch (lowerValue.elementType()) {
            case 'literalInt':
                if (lowerValue.value === undefined) {
                    isNotValidForMultiplicityLabel = true;
                }
                // TODO more vetting
                break;
            default:
                // bad type
                isNotValidForMultiplicityLabel = true;
                console.warn('bad type for multiplicity, cannot make label!');
                break;
        }
    }
    if (!property.upperValue.has()) {
        isNotValidForMultiplicityLabel = true;
    } else {
        const upperValue = await property.upperValue.get();
        switch (upperValue.elementType()) {
            case 'literalInt':
            case 'literalUnlimitedNatural':
                if (upperValue.value === undefined) {
                    isNotValidForMultiplicityLabel = true;
                }
                // TODO more vetting
                break;
            default:
                // bad type
                isNotValidForMultiplicityLabel = true;
                console.warn('bad type for multiplicity, cannot make label!');
                break;
        }
    }

    return !isNotValidForMultiplicityLabel;
}
