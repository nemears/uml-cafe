// This holds functions for translating diagram-js objects to the UML DI objects
// defined in the uml 2.5.2 specification. 
//


export async function translateDJElementToUMLDiagramElement(djElement, umlElement, diManager, umlDiagram) {
    if (djElement.owningElement) {
        if (djElement.owningElement.id !== umlElement.owningElement.id()) {
            const owningElementDI = await diManager.get(djElement.owningElement.id);
            await owningElementDI.ownedElement.add(umlElement);
            await diManager.put(owningElementDI);
        }
    } else if (!umlElement.owningElement.has()) {
        if (!umlDiagram.ownedElement.contains(umlElement)) {
            await umlDiagram.ownedElement.add(umlElement);
            await diManager.put(umlDiagram);
        }
    }

    if (djElement.modelElement) {
        if (!umlElement.modelElement.contains(djElement.modelElement.id)) {
            const modelElement = await diManager.post('uml-cafe-profile.ProxyElement');
            modelElement.modelElementID = djElement.modelElement.id;
            await umlElement.modelElement.add(modelElement);
            await diManager.put(modelElement);
        }
    }
    if (djElement.sharedStyle) {
        if (!umlElement.sharedStyle.has()) {
            await umlElement.sharedStyle.set(djElement.sharedStyle);
        }
    }
}

export async function translateDJShapeToUMLShape(djShape, umlShape, diManager, umlDiagram) {
    let bounds;
    if (umlShape.bounds.has()) {
        bounds = await umlShape.bounds.get();
    } else {
        bounds = diManager.post('Diagram Common.Bounds');
    }
    bounds.x = djShape.x;
    bounds.y = djShape.y;
    bounds.width = djShape.width;
    bounds.height = djShape.height;
    await umlShape.bounds.set(bounds);
    await diManager.put(bounds);
    await translateDJElementToUMLDiagramElement(djShape, umlShape, diManager, umlDiagram);
}

export async function translateDJEdgeToUMLEdge(djEdge, umlEdge, diManager, umlDiagram) {
    await umlEdge.source.set(djEdge.source.id);
    await umlEdge.target.set(djEdge.target.id);
    // waypoints
    await umlEdge.waypoints.clear();
    for (const point of djEdge.waypoints) {
        const umlPoint = diManager.post('Diagram Common.Point');
        umlPoint.x = point.x;
        umlPoint.y = point.y;
        await umlEdge.waypoints.add(umlPoint);
        await diManager.put(umlPoint);
    }
    await translateDJElementToUMLDiagramElement(djEdge, umlEdge, diManager, umlDiagram);
}

export async function translateDJSCompartmentableShapeToUmlCompartmentableShape(djShape, umlShape, diManager, umlDiagram) {
    const elementsToRemove = [];
    const elementsToAdd = [];
    for (const compartment of djShape.compartments) {
        if (!umlShape.compartment.contains(compartment.id)) {
            elementsToAdd.push(compartment);
        }
    }
    for await (const umlCompartment of umlShape.compartment) {
        if (!djShape.compartments.find((el) => el.id === umlCompartment.id)) {
            elementsToRemove.push(umlCompartment);
        }
    }
    for (const compartment of elementsToAdd) {
        const diCompartment = diManager.post('UML DI.UMLCompartment', {id:compartment.id});
        await umlShape.compartment.add(diCompartment);
        await diManager.put(diCompartment);
    }
    for (const umlCompartment of elementsToRemove) {
        await umlShape.compartment.remove(umlCompartment);
        await diManager.delete(umlCompartment);
    }
    await translateDJShapeToUMLShape(djShape, umlShape, diManager, umlDiagram);
}

export async function translateDJLabelToUMLLabel(djLabel, umlLabel, diManager, umlDiagram) {
    umlLabel.text = djLabel.text;
    await translateDJShapeToUMLShape(djLabel, umlLabel, diManager, umlDiagram);
}
