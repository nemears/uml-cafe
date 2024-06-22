import { SHAPE_ID, SHAPE_BOUNDS_SLOT_ID, EDGE_ID, EDGE_WAYPOINTS_SLOT_ID, LABEL_ID, NAME_LABEL_ID, TYPED_ELEMENT_LABEL_ID, KEYWORD_LABEL_ID, ASSOCIATION_END_LABEL_ID, MULTIPLICITY_LABEL_ID, COMPARTMENT_ID, CLASSIFIER_SHAPE_ID, OWNED_ELEMENTS_SLOT_ID, OWNING_ELEMENT_SLOT_ID, CLASS_DIAGRAM_ID } from './ids';
import { isShape } from './is'
import { Shape, fillOutShapeFeatures } from './shape';
import { Edge, fillOutEdgeFeatures } from './edge';
import { Label, NameLabel, TypedElementLabel, KeywordLabel, AssociationEndLabel, MultiplicityLabel, fillOutLabelFeatures } from "./label";
import { Compartment, ClassifierShape, fillOutCompartmentableShapeFeatures } from "./compartmentableShape";
import { fillOutDiagramElementFeatures } from "./diagramElement";
import { fillOutDiagramFeatures } from "./diagram";
import { ClassDiagram } from './classDiagram';

export async function fillOutStringSlot(slot, diObject, memberName) {
    if (slot.values.size() > 0) {
        diObject[memberName] = (await slot.values.front()).value;
    }
}

export function createStringSlot(slotDefiningFeatureID, value, owningInstance, umlWebClient) {
    const slot = umlWebClient.post('slot');
    const slotValue = umlWebClient.post('literalString');
    slot.definingFeature.set(slotDefiningFeatureID);
    slotValue.value = value ? value : '';
    slot.values.add(slotValue);
    owningInstance.slots.add(slot);
    umlWebClient.put(slot);
    umlWebClient.put(slotValue);
}

export function createBooleanSlot(slotDefiningFeatureID, value, owningInstance, umlWebClient) {
    const slot = umlWebClient.post('slot');
    const slotValue = umlWebClient.post('literalBool');
    slot.definingFeature.set(slotDefiningFeatureID);
    slotValue.value = value ? true : false;
    slot.values.add(slotValue);
    owningInstance.slots.add(slot);
    umlWebClient.put(slot);
    umlWebClient.put(slotValue);
}

export async function getUmlDiagramElement(id, umlClient) {
    // get the element with the client
    const umlDiagramElement = await umlClient.get(id);

    if (!umlDiagramElement) {
        console.error('could not get diagram element ' + id + ' from server, it must have been deleted and not kept track of!');
        return undefined;
    }

    const fillOutElement = async (element, f) => {
        element.id = umlDiagramElement.id;
        for await (const slot of umlDiagramElement.slots) {
            await f(element, slot, umlClient);
        }
    };
    
    // determine which type of diagramElement it is
    for (let classifierID of umlDiagramElement.classifiers.ids()) {
        if (classifierID === SHAPE_ID) {
            const ret = new Shape();
            await fillOutElement(ret, fillOutShapeFeatures);
            return ret;
        } else if (classifierID === EDGE_ID) {
            const ret = new Edge();
            await fillOutElement(ret, fillOutEdgeFeatures);
            return ret;
        } else if (classifierID === LABEL_ID) {
            const ret = new Label();
            await fillOutElement(ret, fillOutLabelFeatures);
            return ret;
        } else if (classifierID === COMPARTMENT_ID) {
            const ret = new Compartment();
            await fillOutElement(ret, fillOutDiagramElementFeatures);
            return ret;
        } else if (classifierID === CLASSIFIER_SHAPE_ID) {
            const ret = new ClassifierShape();
            await fillOutElement(ret, fillOutCompartmentableShapeFeatures);
            return ret;
        } else if (classifierID === NAME_LABEL_ID) {
            const ret = new NameLabel();
            await fillOutElement(ret, fillOutLabelFeatures);
            return ret;
        } else if (classifierID === TYPED_ELEMENT_LABEL_ID) {
            const ret = new TypedElementLabel();
            await fillOutElement(ret, fillOutLabelFeatures);
            return ret;
        } else if (classifierID === KEYWORD_LABEL_ID) {
            const ret = new KeywordLabel();
            await fillOutElement(ret, fillOutLabelFeatures);
            return ret;
        } else if (classifierID === ASSOCIATION_END_LABEL_ID) {
            const ret = new AssociationEndLabel();
            await fillOutElement(ret, fillOutLabelFeatures);
            return ret;
        } else if (classifierID === MULTIPLICITY_LABEL_ID) {
            const ret = new MultiplicityLabel();
            await fillOutElement(ret, fillOutLabelFeatures);
            return ret;
        } else if (classifierID === CLASS_DIAGRAM_ID) {
            const ret = new ClassDiagram();
            await fillOutElement(ret, fillOutDiagramFeatures);
            return ret;
        }
    }
    return undefined;
}

export async function deleteUmlDiagramElement(diagramElementID, umlWebClient) {
    const diagramElementInstance = await umlWebClient.get(diagramElementID);
    if (!diagramElementInstance) {
        console.warn('could not delete diagramElement ' + diagramElementID + ' from server, already removed!');
        return;
    }
    
    const cleanupDiagramElementSlots = async (diagramElementSlot) => {
        if (diagramElementSlot.definingFeature.id() === OWNED_ELEMENTS_SLOT_ID) {                    
            // delete owned elements if not already deleted
            for await (const ownedElementValue of diagramElementSlot.values) {
                if (ownedElementValue.instance.has()) {
                    await deleteUmlDiagramElement(ownedElementValue.instance.id(), umlWebClient);
                }
            }
        } else if (diagramElementSlot.definingFeature.id() === OWNING_ELEMENT_SLOT_ID) {
            const owningElementInstance = await (await diagramElementSlot.values.front()).instance.get();
            for await (const owningElementSlot of owningElementInstance.slots) {
                if (owningElementSlot.definingFeature.id() === OWNED_ELEMENTS_SLOT_ID) {
                    let instanceValueToRemove = undefined;
                    for await (const value of owningElementSlot.values) {
                        if (value.isSubClassOf('instanceValue')) {
                            if (value.instance.id() === diagramElementInstance.id) {
                                instanceValueToRemove = value;
                                break;
                            }
                        }
                    }
                    if (!instanceValueToRemove) {
                        throw Error('bad state, cannot find ownedElement value to correspond');
                    }
                    umlWebClient.deleteElement(instanceValueToRemove);
                    umlWebClient.put(owningElementSlot);
                    break;
                }
            }
            umlWebClient.put(owningElementInstance);
        }
    }
    for (const classifierID of diagramElementInstance.classifiers.ids()) {
        if (isShape(classifierID)) {
            // shape
            for await (const shapeSlot of diagramElementInstance.slots) {
                if (shapeSlot.definingFeature.id() === SHAPE_BOUNDS_SLOT_ID) {
                    // bounds get and delete instance
                    await umlWebClient.deleteElement(await (await shapeSlot.values.front()).instance.get());
                } else {
                    await cleanupDiagramElementSlots(shapeSlot);
                }
            }
            
            await umlWebClient.deleteElement(diagramElementInstance);
            break;
        } else if (classifierID === EDGE_ID) {
            // edge
            for await (const edgeSlot of diagramElementInstance.slots) {
                if (edgeSlot.definingFeature.id() === EDGE_WAYPOINTS_SLOT_ID) {
                    // waypoints
                    for await (const waypointValue of edgeSlot.values) {
                        await umlWebClient.deleteElement(await waypointValue.instance.get());
                    }
                } else {
                    await cleanupDiagramElementSlots(edgeSlot);
                }
            }
            await umlWebClient.deleteElement(diagramElementInstance);
            break;
        } else {
            await umlWebClient.deleteElement(diagramElementInstance);
        }
    }
}
