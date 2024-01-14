import { createElementUpdate, deleteElementElementUpdate } from "../../../umlUtil";
import { deleteUmlDiagramElement, createDiagramEdge } from "../api/diagramInterchange";
import { removeShapeAndEdgeFromServer } from "./ElementUpdate";
import { h } from "vue";
import { getMid } from "diagram-js/lib/layout/LayoutUtil";
import { connectRectangles } from "diagram-js/lib/layout/ManhattanLayout";
import { randomID } from "../umlUtil";
import { createCommentClick } from "../../../umlUtil";
import { createProperty } from "./Property";

export default class UmlContextMenu {
    constructor(eventBus, diagramEmitter, umlWebClient, modeling, modelElementMap, elementRegistry, canvas, diagramContext, directEditing, create, elementFactory) {    
        eventBus.on('element.contextmenu', (event) => {
            if (event.element.modelElement && !event.originalEvent.ctrlKey) {
                showContextMenu(
                    event.originalEvent.clientX, 
                    event.originalEvent.clientY, 
                    event.element, 
                    umlWebClient, 
                    diagramEmitter, 
                    modeling, 
                    modelElementMap, 
                    elementRegistry, 
                    canvas, 
                    diagramContext,
                    directEditing,
                    create,
                    elementFactory
                );
                event.originalEvent.preventDefault();
            }
        });
    }
}

UmlContextMenu.$inject = ['eventBus', 'diagramEmitter', 'umlWebClient', 'modeling', 'modelElementMap', 'elementRegistry', 'canvas', 'diagramContext', 'directEditing', 'create', 'elementFactory'];

export async function deleteModelElement(element, diagramEmitter, umlWebClient, modeling) {
    const elementsToRemove = [element];
    if (element.children) {
        for (const end of element.children) {
            elementsToRemove.push(end);
            await umlWebClient.deleteElement(await umlWebClient.get(end.id));
            for (const endLabel of end.labels) {
                elementsToRemove.push(endLabel);
                await umlWebClient.deleteElement(await umlWebClient.get(endLabel.id), umlWebClient);
            }
        }
    }
    modeling.removeElements(elementsToRemove);
    const owner = await element.modelElement.owner.get();
    diagramEmitter.fire('elementUpdate', deleteElementElementUpdate(element.modelElement));
    await umlWebClient.deleteElement(element.modelElement);
    if (owner) {
        umlWebClient.put(owner);
        diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
    }
}

export async function showContextMenu(x, y, element, umlWebClient, diagramEmitter, modeling, modelElementMap, elementRegistry, canvas, diagramContext, directEditing, create, elementFactory) {
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
                directEditing.activate(element);
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
    if (element.waypoints) {
        menu.items.push({
            label: 'Remove Edge',
            disabled: umlWebClient.readonly,
            onClick: async () => {
                await deleteUmlDiagramElement(element.id, umlWebClient);
                modeling.removeConnection(element, umlWebClient);
            }
        });
    } else {
        menu.items.push({
            label: 'Remove Shape',
            disabled: umlWebClient.readonly,
            onClick: async () => {
                // delete shape or edge
                await removeShapeAndEdgeFromServer(element, umlWebClient);
                modeling.removeShape(element);
            }
        });
    }
    menu.items.push({
        label: 'Delete Element',
        disabled: umlWebClient.readonly,
        onClick: () => {
            deleteModelElement(element, diagramEmitter, umlWebClient, modeling);
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
                    for await (const property of element.modelElement.attributes) {
                        if (!modelElementMap.get(property.id)) {
                            createProperty(property, element, modelElementMap, modeling, umlWebClient, diagramContext);
                        }
                    }
                }
            });
            for await (const property of element.modelElement.attributes) {
                if (property.association.has()) {
                    associations.push(await property.association.get());
                }
                const propertyOption = {
                    label: property.name,
                    icon: h('img', {
                        src: require('../../icons/property.svg')
                    }),
                    disabled: umlWebClient.readonly,
                };
                if (!modelElementMap.get(property.id)) {
                    propertyOption.onClick = () => {
                        createProperty(property, element, modelElementMap, modeling, umlWebClient, diagramContext);
                    }
                } else {
                    propertyOption.disabled = true;
                }
                showPropertiesOption.children.push(propertyOption);
            }
        } else {
            showPropertiesOption.disabled = true;
        }
        if (!(element.modelElement.generalizations.size() === 0 && associations.length === 0)) {
            showRelationshipsOption.children.push({
                label: 'Show All',
                disabled: umlWebClient.readonly,
                onClick: async () => {
                    for await (const generalization of element.modelElement.generalizations) {
                        if (!modelElementMap.get(generalization.id)) {
                            await drawGeneralization(element, generalization, umlWebClient, modelElementMap, elementRegistry, modeling, canvas, diagramContext);
                        }
                    }
                    for (const association of associations) {
                        if (!modelElementMap.get(association.id)) {
                            await drawAssociation(element, association, umlWebClient, modelElementMap, elementRegistry, modeling, canvas, diagramContext);
                        }
                    }
                }
            });
            for await (const generalization of element.modelElement.generalizations) {
                showRelationshipsOption.children.push({
                    label: (await generalization.general.get()).name,
                    icon: h('img', {
                        src: require('../../icons/generalization.svg')
                    }),
                    disabled: umlWebClient.readonly || modelElementMap.get(generalization.id) !== undefined,
                    onClick: () => {
                        drawGeneralization(element, generalization, umlWebClient, modelElementMap, elementRegistry, modeling, canvas, diagramContext);
                    }
                });
            }
            for (const association of associations) {
                showRelationshipsOption.children.push({
                    label: await association.name, // TODO better label
                    icon: h('img', {
                        src: require('../../icons/association.svg')
                    }),
                    disabled: umlWebClient.readonly || modelElementMap.get(association.id) !== undefined,
                    onClick: () => {
                        drawAssociation(element, association, umlWebClient, modelElementMap, elementRegistry, modeling, canvas, diagramContext);
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

async function drawGeneralization(element, generalization, umlWebClient, modelElementMap, elementRegistry, modeling, canvas, diagramContext) {
    const generalShapeIDs = modelElementMap.get(generalization.general.id());
    for (const shapeID of generalShapeIDs) {
        const generalShape = elementRegistry.get(shapeID);
        const relationship = modeling.createConnection(
            element,
            generalShape,
            0, 
            {
                id: randomID(),
                modelElement: generalization,
                source: element,
                target: generalShape,
                waypoints: connectRectangles(element, generalShape, getMid(element), getMid(generalShape)),
                children: [],
            },
            canvas.getRootElement()
        );
        await createDiagramEdge(relationship, umlWebClient, diagramContext);
    }
}

async function drawAssociation(element, association, umlWebClient, modelElementMap, elementRegistry, modeling, canvas, diagramContext) {
    let targetShapeIds;
    for await (const end of association.memberEnds) {
        if (end.featuringClassifier.id() === element.modelElement.id) {
            targetShapeIds = modelElementMap.get(end.type.id());
        }
    }
    for (const shapeID of targetShapeIds) {
        const targetShape = elementRegistry.get(shapeID);
        const relationship = modeling.createConnection(
            element,
            targetShape,
            0, 
            {
                id: randomID(),
                modelElement: association,
                source: element,
                target: targetShape,
                waypoints: connectRectangles(element, targetShape, getMid(element), getMid(targetShape))
            },
            canvas.getRootElement()
        );
        await createDiagramEdge(relationship, umlWebClient, diagramContext);
    }
}
