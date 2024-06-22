import { ELEMENT_ID_SLOT_ID, MODEL_ELEMENT_SLOT_ID, OWNED_ELEMENTS_SLOT_ID, OWNING_ELEMENT_SLOT_ID } from './ids';

// class for api
export class DiagramElement {
    
    id = '';

    owningElement = null; // Type is DiagramElement
    ownedElements = []; // Type is [DiagramElement]

    modelElement = null; // Type is uml-client/element

    // styles
    localStyle = undefined;
    sharedStyle = undefined;

    // TODO methods
}

// Helper methods
export async function createDiagramElementFeatures(shape, umlWebClient, shapeInstance, diagramContext) {
    if (shape.modelElement) {
        const modelElementInstance = umlWebClient.post('instanceSpecification');
        const modelElementSlot = umlWebClient.post('slot');
        const modelElementValue = umlWebClient.post('instanceValue');
        const idSlot = umlWebClient.post('slot');
        const idVal = umlWebClient.post('literalString');
        modelElementInstance.classifiers.add('XI35viryLd5YduwnSbWpxSs3npcu');
        idVal.value = shape.modelElement.id;
        idSlot.definingFeature.set(ELEMENT_ID_SLOT_ID);
        idSlot.values.add(idVal);
        modelElementInstance.slots.add(idSlot);
        modelElementValue.instance.set(modelElementInstance);
        modelElementSlot.values.add(modelElementValue);
        modelElementSlot.definingFeature.set(MODEL_ELEMENT_SLOT_ID);
        shapeInstance.slots.add(modelElementSlot);
        diagramContext.diagram.packagedElements.add(modelElementInstance);
        umlWebClient.put(modelElementInstance);
        umlWebClient.put(modelElementSlot);
        umlWebClient.put(modelElementValue);
        umlWebClient.put(idSlot);
        umlWebClient.put(idVal);
    }

    // set up owning and owned elements
    let owningElementSlot = undefined;
    let owningElementValue = undefined;
    let owningElementInstance = undefined;
    let owningElementOwnedElementsSlot = undefined;
    let owningElementOwnedElementsValue = undefined;
    let ownedElementsSlot = undefined;
    let ownedElementValues = [];
    if (shape.parent) {
        owningElementInstance = await umlWebClient.get(shape.parent.id);
        if (!owningElementInstance) {
            // owner is root, sub it with diagram (weird diagram-js frame behavior edge case)
            owningElementInstance = await umlWebClient.get(diagramContext.umlDiagram.id);
        }
        owningElementSlot = umlWebClient.post('slot');
        owningElementValue = umlWebClient.post('instanceValue');
        owningElementSlot.definingFeature.set(OWNING_ELEMENT_SLOT_ID);
        owningElementValue.instance.set(owningElementInstance);
        owningElementSlot.values.add(owningElementValue);
        shapeInstance.slots.add(owningElementSlot);
        for await (const owningElementInstanceSlot of owningElementInstance.slots) {
            if (owningElementInstanceSlot.definingFeature.id() === OWNED_ELEMENTS_SLOT_ID) {
                owningElementOwnedElementsSlot = owningElementInstanceSlot;
                break;
            }
        }
        if (!owningElementOwnedElementsSlot) {
            owningElementOwnedElementsSlot = umlWebClient.post('slot');
            owningElementOwnedElementsSlot.definingFeature.set(OWNED_ELEMENTS_SLOT_ID);
            owningElementInstance.slots.add(owningElementOwnedElementsSlot);
            umlWebClient.put(owningElementOwnedElementsSlot);
        }
        // see if parent already is tracking us (ownedElements is a set)
        let createInstanceValue = true;
        for await (const owningElementsOwnedElementsValue of owningElementOwnedElementsSlot.values) {
            if (owningElementsOwnedElementsValue.instance.id() === shapeInstance.id) {
                createInstanceValue = false;
            }
        }
        if (createInstanceValue) {
            owningElementOwnedElementsValue = umlWebClient.post('instanceValue');
            owningElementOwnedElementsValue.instance.set(shapeInstance);
            owningElementOwnedElementsSlot.values.add(owningElementOwnedElementsValue);
            umlWebClient.put(owningElementOwnedElementsValue);
        }
    }
    ownedElementsSlot = umlWebClient.post('slot');
    ownedElementsSlot.definingFeature.set(OWNED_ELEMENTS_SLOT_ID);
    if (shape.children)  {
        if (shape.children.length > 0) {
            for (const ownedElement of shape.children) {
                const ownedElementValue = umlWebClient.post('instanceValue');
                ownedElementValue.instance.set(ownedElement.id);
                ownedElementsSlot.values.add(ownedElementValue);
                umlWebClient.put(ownedElementValue);
            }
        } else {
            console.warn("Please add children array to your UmlDiagramElements before creating them!");
        }
    }
    shapeInstance.slots.add(ownedElementsSlot);


    if (shape.parent) {
        umlWebClient.put(owningElementSlot);
        umlWebClient.put(owningElementValue);
        umlWebClient.put(owningElementInstance);
        umlWebClient.put(owningElementOwnedElementsSlot);
        if (owningElementOwnedElementsValue) {
            umlWebClient.put(owningElementOwnedElementsValue);
        }
    }
    umlWebClient.put(ownedElementsSlot);
    if (shape.children.length > 0) {
        for (const ownedElementValue of ownedElementValues) {
            umlWebClient.put(ownedElementValue);
        } 
    }
}

export async function fillOutDiagramElementFeatures(diagramElement, slot, umlClient) {
    if (slot.definingFeature.id() === MODEL_ELEMENT_SLOT_ID) {
        // modelElement get id and set value
        for await(let modelElementSlot of (await(await slot.values.front()).instance.get()).slots) {
            if (modelElementSlot.definingFeature.id() === ELEMENT_ID_SLOT_ID) {
                // get value of id and set modelElement value
                const modelElementValue = await modelElementSlot.values.front();
                const modelElementID = modelElementValue.value;
                const modelElement = await umlClient.get(modelElementID);
                await modelElement.owner.get();
                diagramElement.modelElement = modelElement;
                return true;
            }
        }
    } else if (slot.definingFeature.id() === OWNING_ELEMENT_SLOT_ID) {
        // owningElement
        const owningElementValue = await slot.values.front();
        if (owningElementValue.elementType() !== 'instanceValue') {
            throw Error('invalid type for owningElementValue!');
        }
        if (!owningElementValue.instance.has()) {
            throw Error('owningElement value has no corresponding instance!');
        }
        diagramElement.owningElement = owningElementValue.instance.id();
        return true;
    } else if (slot.definingFeature.id() === OWNED_ELEMENTS_SLOT_ID) {
        // ownedElements
        for await (const ownedElementValue of slot.values) {
            if (ownedElementValue.elementType() !== 'instanceValue') {
                throw Error('invalid value type for ownedElement Slot value, must be an instanceValue!');
            }
            if (!ownedElementValue.instance.has()) {
                throw Error('ownedElement value has no corresponding instance!');
            }
            diagramElement.ownedElements.push(ownedElementValue.instance.id());
        }
        return true;
    }
    return false;
}
