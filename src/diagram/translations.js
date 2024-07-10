// This holds functions for translating diagram-js objects to the UML DI objects
// defined in the uml 2.5.2 specification. 
//


export async function translateDJElementToUMLDiagramElement(djElement, umlElement, diManager, umlDiagram) {
    if (djElement.owningElement) {
        const owningElementDI = await diManager.get(djElement.owningElement.id);
        await owningElementDI.ownedElement.add(umlElement);
        await diManager.put(owningElementDI);
    } else {
        await umlDiagram.ownedElement.add(umlElement);
        await diManager.put(umlDiagram);
    }

    if (djElement.modelElement) {
        if (!umlElement.modelElement.contains(djElement.modelElement.id)) {
            const modelElement = await diManager.post('uml-cafe-profile.ProxyElement');
            modelElement.modelElementID = djElement.modelElement.id;
            await umlElement.modelElement.add(modelElement);
            await diManager.put(modelElement);
        }
    }
}

export async function translateDJShapeToUMLShape(djShape, umlShape, diManager, umlDiagram) {
    const bounds = diManager.post('Diagram Common.Bounds');
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
    await translateDJElementToUMLDiagramElement(djEdge, umlEdge, diManager, umlDiagram);
}

export async function translateDJSCompartmentableShapeToUmlCompartmentableShape(djShape, umlShape, diManager, umlDiagram) {
    for (const compartment of djShape.compartments) {
        const diCompartment = diManager.post('UML DI.UMLCompartment', {id:compartment.id});
        await umlShape.compartment.add(diCompartment);
        await diManager.put(diCompartment);
    }    
    await translateDJShapeToUMLShape(djShape, umlShape, diManager, umlDiagram);
}

export async function translateDJLabelToUMLLabel(djLabel, umlLabel, diManager, umlDiagram) {
    umlLabel.text = djLabel.text;
    await translateDJShapeToUMLShape(djLabel, umlLabel, diManager, umlDiagram);
}
