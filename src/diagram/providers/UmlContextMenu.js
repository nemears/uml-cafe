import { createElementUpdate, deleteElementElementUpdate } from "../../umlUtil";
import { createDiagramEdge, deleteUmlDiagramElement } from "../api/diagramInterchange";
import { h } from "vue";
import { getMid } from "diagram-js/lib/layout/LayoutUtil";
import { connectRectangles } from "diagram-js/lib/layout/ManhattanLayout";
import { randomID } from "../umlUtil";
import { createCommentClick } from "../../umlUtil";
import { removeDiagramElement } from "./ClassDiagramContextPadProvider";
import { getTextDimensions } from './ClassDiagramPaletteProvider';
import parse from "uml-client/lib/parse";

export default class UmlContextMenu {
    constructor(eventBus, diagramEmitter, umlWebClient, modelElementMap, directEditing, create, elementFactory, commandStack, canvas, relationshipEdgeCreator) {    
        this._eventBus = eventBus;
        this._diagramEmitter = diagramEmitter;
        this._umlWebClient = umlWebClient;
        this._modelElementMap = modelElementMap;
        this._directEditing = directEditing;
        this._create = create;
        this._elementFactory = elementFactory;
        this._commandStack = commandStack;
        this._relationshipEdgeCreator = relationshipEdgeCreator;

        commandStack.registerHandler('deleteModelElement', DeleteModelElementHandler);
        commandStack.registerHandler('edgeCreation', EdgeCreationHandler);

        const me = this;
        
        eventBus.on('element.contextmenu', (event) => {
            const x = event.originalEvent.clientX,
            y = event.originalEvent.clientY;
            if (!event.originalEvent.ctrlKey) {
                if (event.element.elementType === 'compartment') {
                    me.show(x, y, event.element.parent);
                } else if (event.element.elementType === 'nameLabel' && event.element.parent != canvas.findRoot(event.element)) {
                    me.show(x,y, event.element.parent);
                } else if (event.element.modelElement) {
                    me.show(x, y, event.element);
                }
                event.originalEvent.preventDefault();
            }
        });
    }
    async show(x, y, element) {
        const umlWebClient = this._umlWebClient, 
        diagramEmitter = this._diagramEmitter, 
        modelElementMap = this._modelElementMap, 
        directEditing = this._directEditing, 
        create = this._create, 
        elementFactory = this._elementFactory,
        commandStack = this._commandStack,
        relationshipEdgeCreator = this._relationshipEdgeCreator;
        const menu = {
            x: x,
            y: y,
            items: []
        };
        menu.items.push({
            label: 'Specification',
            onClick: () => {
                diagramEmitter.fire('specification', element.modelElement);
            }
        });
        if (element.modelElement.isSubClassOf('namedElement')) {
            menu.items.push({
                label: 'Rename',
                onClick: () => {
                    if (element.elementType === 'classifierShape') {
                        // find nameLabel
                        let nameLabel;
                        for (const child of element.children) {
                            if (child.elementType === 'nameLabel') {
                                nameLabel = child;
                                break;
                            }
                        }
                        if (!nameLabel) {
                            throw Error('could not find name label in children of classifierShape!');
                        }
                        directEditing.activate(nameLabel);
                    } else {
                        directEditing.activate(element);
                    }
                }
            });
        } else if (element.modelElement.isSubClassOf('comment')) {
            menu.items.push({
                label: 'Edit Body',
                onClick: () => {
                    directEditing.activate(element);
                }
            });
        }
        menu.items.push({
            label: 'Remove Element',
            disabled: umlWebClient.readonly,
            onClick: () => {
                removeDiagramElement(element, commandStack);
            }
        });
        menu.items.push({
            label: 'Delete Element',
            disabled: umlWebClient.readonly,
            onClick: () => {
                deleteModelElement(element, commandStack);
            }
        });
        menu.items.push({
            label: 'Create Comment',
            disabled: umlWebClient.readonly,
            onClick: (event) => {
                createCommentClick(event, element, create, elementFactory);
            }
        });
        if (element.modelElement.isSubClassOf('classifier')) {
            // show relationships
            const showRelationshipsOption = {
                label: 'Show Relationships',
                children: []
            };
            const showPropertiesOption = {
                label: 'Show Properties',
                children: []
            };
            const associations = [];
            if (element.modelElement.attributes.size() !== 0) {
                showPropertiesOption.children.push({
                    label: 'Show All',
                    disabled: umlWebClient.readonly,
                    onClick: async () => {
                        const context = {
                            clazzShape: element,
                            properties: []
                        };
                        for await (const property of element.modelElement.attributes) {
                            if (!modelElementMap.get(property.id)) {
                                context.properties.push(property);
                            }
                        }
                        commandStack.execute('propertyLabel.create', context);
                    }
                });
                for await (const property of element.modelElement.attributes) {
                    if (property.association.has()) {
                        associations.push(await property.association.get());
                    }
                    const propertyOption = {
                        label: property.name,
                        icon: h('img', {
                            src: require('../../assets/icons/general/property.svg')
                        }),
                        disabled: umlWebClient.readonly,
                    };
                    if (!modelElementMap.get(property.id)) {
                        propertyOption.onClick = () => {
                            const context = {
                                clazzShape: element,
                                properties: [property],
                            };
                            commandStack.execute('propertyLabel.create', context);
                        }
                    } else {
                        propertyOption.disabled = true;
                    }
                    showPropertiesOption.children.push(propertyOption);
                }
            } else {
                showPropertiesOption.disabled = true;
            }
            if (!(element.modelElement.generalizations.size() === 0 && element.modelElement.clientDependencies === 0 && associations.length === 0)) {
                showRelationshipsOption.children.push({
                    label: 'Show All',
                    disabled: umlWebClient.readonly,
                    onClick: async () => {
                        for await (const generalization of element.modelElement.generalizations) {
                            if (!modelElementMap.get(generalization.id)) {
                                await drawGeneralization(element, generalization, commandStack);
                            }
                        }
                        for await (const dependency of element.modelElement.clientDependencies) {
                            if (!modelElementMap.get(dependency.id)) {
                                await drawDependency(element, dependency, commandStack);
                            }
                        }
                        for (const association of associations) {
                            if (!modelElementMap.get(association.id)) {
                                await drawAssociation(element, association, commandStack);
                            }
                        }
                    }
                });
                for await (const generalization of element.modelElement.generalizations) {
                    showRelationshipsOption.children.push({
                        label: (await generalization.general.get()).name,
                        icon: h('img', {
                            src: require('../../assets/icons/general/generalization.svg')
                        }),
                        disabled: umlWebClient.readonly || modelElementMap.get(generalization.id) !== undefined,
                        onClick: () => {
                            drawGeneralization(element, generalization, commandStack);
                        }
                    });
                }
                for (const association of associations) {
                    showRelationshipsOption.children.push({
                        label: await association.name, // TODO better label
                        icon: h('img', {
                            src: require('../../assets/icons/general/association.svg')
                        }),
                        disabled: umlWebClient.readonly || modelElementMap.get(association.id) !== undefined,
                        onClick: () => {
                            relationshipEdgeCreator.create({
                                elements: [association]
                            });
                        }
                    });
                }
                for await (const dependency of element.modelElement.clientDependencies) {
                    showRelationshipsOption.children.push({
                        label: (await dependency.suppliers.front()).name,
                        icon: h('img', {
                            src: require('../../assets/icons/general/dependency.svg')
                        }),
                        disabled: umlWebClient.readonly || modelElementMap.get(dependency.id) !== undefined,
                        onClick: () => {
                            drawDependency(element, dependency, commandStack);
                        }
                    });
                }
            } else {
                showRelationshipsOption.disabled = true;
            }
            menu.items.push(showRelationshipsOption);
            menu.items.push(showPropertiesOption);
        }
        diagramEmitter.fire('contextmenu', menu);
    }
}
UmlContextMenu.$inject = ['eventBus', 'diagramEmitter', 'umlWebClient', 'modelElementMap', 'directEditing', 'create', 'elementFactory', 'commandStack', 'canvas', 'relationshipEdgeCreator'];

class DeleteModelElementHandler {
    constructor(canvas, umlWebClient, diagramEmitter, elementRegistry, diagramContext, eventBus) {
        this._canvas = canvas;
        this._umlWebClient = umlWebClient;
        this._diagramEmitter = diagramEmitter;
        this._elementRegistry = elementRegistry;
        this._diagramContext = diagramContext;
        this._eventBus = eventBus;
    }
    async doLater(context) {
        const umlWebClient = this._umlWebClient,
        diagramEmitter = this._diagramEmitter;
        for (const elementToRemove of context.elementsToRemove) {
            await deleteUmlDiagramElement(elementToRemove.id, umlWebClient)
        }
        const owner = await context.element.modelElement.owner.get();
        await umlWebClient.deleteElement(context.element.modelElement);
        diagramEmitter.fire('elementUpdate', deleteElementElementUpdate(context.element.modelElement));
        if (owner) {
            umlWebClient.put(owner);
            diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
        }
    }
    execute(context) {
        const diagramEmitter = this._diagramEmitter,
        eventBus = this._eventBus;
        if (context.proxy) {
            delete context.proxy;
            return context.element;
        }
        const elementsProxy = [];
        for (const elementContext of context.elements) {
            elementContext.parent = elementContext.element.parent;
            
            const element = elementContext.element;
            const elementsToRemove = [];
            const rawData = {};
            const owner = element.modelElement.owner.unsafe(); // should be good
            rawData[owner.id] = owner.emit();
            const queue = [element];
            while (queue.length > 0) {
                const front = queue.shift();
                if (front.modelElement) {
                    rawData[front.modelElement.id] = front.modelElement.emit();
                }
                elementsToRemove.unshift(front);
                for (const child of front.children) {
                    queue.push(child);
                }
            }
            elementContext.rawData = rawData;
            
            elementContext.elementsToRemove = elementsToRemove;
            elementContext.elementContext = {};
            elementContext.elementContext[elementContext.parent.id] = {
                children: elementContext.parent.children, // TODO incoming outgoing
            };
            eventBus.fire('removeElement', elementContext);
            this.doLater(elementContext);
            elementsProxy.push({
                element: {
                    id: elementContext.element.id
                },
                parent: {
                    id: elementContext.parent.id
                },
                rawData: rawData
            });
        }
        diagramEmitter.fire('command', {name: 'deleteModelElement', context: {
            elements: elementsProxy
        }});
    }
    revert(context) {
        const umlWebClient = this._umlWebClient,
        diagramEmitter = this._diagramEmitter,
        eventBus = this._eventBus;
        diagramEmitter.fire('command', {undo: {
            // TODO
        }});

        for (const elementContext of context.elements) {
            // TODO this probably needs to be a lot more complicated
            const elementsToUpdate = [];
            for (const rawData of Object.values(elementContext.rawData)) {
                const remadeElement = parse(rawData);
                umlWebClient.client._graph.set(remadeElement.id, remadeElement);
                remadeElement.manager = umlWebClient.client;
                umlWebClient.put(remadeElement);
                elementsToUpdate.push(remadeElement);
            }
            diagramEmitter.fire('elementUpdate', createElementUpdate(...elementsToUpdate));
            eventBus.fire('removeElement.undo', elementContext);
        }
        return context.elements.map((elementContext) => elementContext.element);
    }
}

DeleteModelElementHandler.$inject = ['canvas', 'umlWebClient', 'diagramEmitter', 'elementRegistry', 'diagramContext', 'eventBus'];

class EdgeCreationHandler {
    constructor(modelElementMap, elementRegistry, diagramEmitter, elementFactory, canvas, umlWebClient, diagramContext) {
        this._modelElementMap = modelElementMap;
        this._elementRegistry = elementRegistry;
        this._diagramEmitter = diagramEmitter;
        this._elementFactory = elementFactory;
        this._canvas = canvas;
        this._umlWebClient = umlWebClient;
        this._diagramContext = diagramContext;
    }
    execute(context) {
        const modelElementMap = this._modelElementMap,
        elementRegistry = this._elementRegistry,
        elementFactory = this._elementFactory,
        canvas = this._canvas,
        umlWebClient = this._umlWebClient,
        diagramContext = this._diagramContext,
        diagramEmitter = this._diagramEmitter;
        if (context.proxy) {
            delete context.proxy;
            context.source = elementRegistry.get(context.source.id);
            const connections = [];
            for (const connection of context.connections) {
                connections.push(elementRegistry.get(connection.id));
            }
            context.connections = connections;
            context.modelElement = umlWebClient.getLocal(context.modelElement);
            return context.source;
        }
        const targetShapeIds = modelElementMap.get(context.targetID);
        let oldConnections = context.connections;
        if (!oldConnections) {
            oldConnections = [];    
        }
        context.connections = [];
        let index = 0;
        for (const targetShapeID of targetShapeIds) {
            const target = elementRegistry.get(targetShapeID);
            if (oldConnections.length <= index) {
                oldConnections.push({id: randomID()});
            }
            const connection = elementFactory.createConnection(
                {
                    source: context.source,
                    target: target,
                    waypoints: connectRectangles(context.source, target, getMid(context.source), getMid(target)), 
                    id: oldConnections[index].id,
                    modelElement: context.modelElement,
                    children: []
                }
            );
            canvas.addConnection(connection, canvas.findRoot(target));
            context.connections.push(connection);
            createDiagramEdge(connection, umlWebClient, diagramContext); // async
            index++;
        }
        const connections = [];
        for (const connection of context.connections) {
            connections.push(
                {
                    id: connection.id
                }
            )
        }
        diagramEmitter.fire('command', {name: 'edgeCreation', context: {
            source: {
                id: context.source.id
            },
            targetID: context.targetID,
            modelElement: context.modelElement.id,
            connections: connections,
        }});
        return context.connections;
    }
    revert(context) {
        const canvas = this._canvas,
        umlWebClient = this._umlWebClient,
        diagramContext = this._diagramContext,
        diagramEmitter = this._diagramEmitter;
        diagramEmitter.fire('command', {undo: {
            // TODO
        }});
        for (const connection of context.connections) {
            deleteUmlDiagramElement(connection.id, umlWebClient, diagramContext);
            canvas.removeConnection(connection);
        }
    }
}

EdgeCreationHandler.$inject = ['modelElementMap', 'elementRegistry', 'diagramEmitter', 'elementFactory', 'canvas', 'umlWebClient', 'diagramContext'];

export function deleteModelElement(element, commandStack) {
    commandStack.execute('deleteModelElement', {
        element: element
    });
    
}

async function drawGeneralization(element, generalization, commandStack) {
    commandStack.execute('edgeCreation', {
        targetID : generalization.general.id(),
        source: element,
        modelElement: generalization,
        id: randomID(),
    });
}

async function drawDependency(element, dependency, commandStack) {
    commandStack.execute('edgeCreation', {
        targetID : dependency.suppliers.ids().front(),
        source: element,
        modelElement: dependency,
        id: randomID(),
    });
}

async function drawAssociation(element, association, commandStack, elementRegistry, elementFactory, umlRenderer) {
    let targetID;
    for await(const end of association.memberEnds) {
        if (end.type.id() !== element.modelElement.id) {
            targetID = end.type.id();     
        }
    }

    const elements = [];

    const target = elementRegistry.get(targetID);

    const associationEdge = elementFactory.createConnection({
        id: randomID(),
        source: element,
        target: target,
        waypoints: connectRectangles(element, target, getMid(element), getMid(target)),
        modelElement: association,
        elementType: 'edge',
        children: [],
    });
    elements.push(associationEdge);
    
    if (association.name !== '') {
        const textDimensions = getTextDimensions(association.name, umlRenderer);
        elements.push(elementFactory.createLabel({
            id: randomID(),
            text: association.name,
            width: Math.round(textDimensions.width) + 15,
            height: 24,
            placement: 'center',
            elementType: 'nameLabel',
        }));
    }
    
    for await (const end of association.memberEnds) {
        const createEndLabels = (end, placement) => {
            if (end.name !== '') {
                const textDimensions = getTextDimensions(end.name, umlRenderer);
                elements.push(elementFactory.createLabel({
                    id: randomID(),
                    rext: end.name,
                    width: Math.round(textDimensions.width) + 15,
                    height: 24,
                    placement: placement,
                    elementType: 'associationEndLabel',
                }));
            }
            if (end.lowerValue.has() && end.upperValue.has()) {
                // TODO
            } 
        };
        if (end.type.id() === element.modelElement.id) {
            createEndLabels(end, 'source');
        } else if (end.type.id() === targetID) {
            createEndLabels(end, 'target');
        }
    }

    commandStack.execute('elementCreation', {
        elements: elements
    });
    commandStack.execute('edgeCreation', {
        targetID: targetID,
        source: element,
        modelElement: association,
    }); 
}
