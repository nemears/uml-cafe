import { createElementUpdate, deleteElementElementUpdate } from "../../../createElementUpdate";
import { deleteUmlDiagramElement } from "../api/diagramInterchange";
import { removeShapeAndEdgeFromServer } from "./ElementUpdate";
import { h } from 'vue'
import { getMid } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout'
import { createEdge } from "./relationships/relationshipUtil";
import { randomID } from "../umlUtil";

export default class UmlContextMenu {
    constructor(eventBus, diagramEmitter, umlWebClient, modeling, modelElementMap, elementRegistry, canvas, diagramContext, directEditing) {
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
                    directEditing
                );
                event.originalEvent.preventDefault();
            }
        });
    }
}

UmlContextMenu.$inject = ['eventBus', 'diagramEmitter', 'umlWebClient', 'modeling', 'modelElementMap', 'elementRegistry', 'canvas', 'diagramContext', 'directEditing'];

export async function deleteModelElement(element, diagramEmitter, umlWebClient, modeling) {
    // TODO show popup menu

    // if (element.waypoints) {
    //     // edge
    //     await deleteUmlDiagramElement(element.id, umlWebClient);
    //     modeling.removeConnection(element, umlWebClient);
    // } else {
    //     // shape
    //     await removeShapeAndEdgeFromServer(element, umlWebClient);
    //     modeling.removeShape(element);
    // }

    const owner = await element.modelElement.owner.get();
    diagramEmitter.fire('elementUpdate', deleteElementElementUpdate(element.modelElement));
    await umlWebClient.deleteElement(element.modelElement);
    if (owner) {
        umlWebClient.put(owner);
        diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
    }
    // TODO fire element update
}

export async function showContextMenu(x, y, element, umlWebClient, diagramEmitter, modeling, modelElementMap, elementRegistry, canvas, diagramContext, directEditing) {
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
    if (element.modelElement.isSubClassOf('classifier')) {
        // show relationships
        const showRelationshipsOption = {
            label: 'Show Relationships',
            children: []
        };
        const associations = [];
        for await (const property of element.modelElement.attributes) {
            if (property.association.has()) {
                associations.push(await property.association.get());
            }
        }
        if (!(element.modelElement.generalizations.size() === 0 && associations.length === 0)) { // TODO other relationships besides generalizations
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
                waypoints: connectRectangles(element, generalShape, getMid(element), getMid(generalShape))
            },
            canvas.getRootElement()
        );
        await createEdge(relationship, umlWebClient, diagramContext);
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
        await createEdge(relationship, umlWebClient, diagramContext);
    }
}
