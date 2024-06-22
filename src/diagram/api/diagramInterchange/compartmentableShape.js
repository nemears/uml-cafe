import { DiagramElement, createDiagramElementFeatures } from './diagramElement';
import { Shape, createDiagramShapeFeatures, fillOutShapeFeatures } from './shape';
import { COMPARTMENTS_ID, COMPARTMENT_ID, COMPARTMENTABLE_SHAPE_ID, CLASSIFIER_SHAPE_ID } from './ids';

export class Compartment extends DiagramElement {
    // maybe TODO
    elementType() {
        return 'compartment';
    }
}

export class CompartmentableShape extends Shape {
    compartments = [];
    elementType() {
        return 'compartmentableShape';
    }
}

export class ClassifierShape extends CompartmentableShape {
    elementType() {
        return 'classifierShape';
    }
}

export async function createCompartmentableShapeFeatures(shape, shapeInstance, umlWebClient, diagramContext) {
    const compartmentSlot = umlWebClient.post('slot');
    compartmentSlot.definingFeature.set(COMPARTMENTS_ID);
    for (const compartment of shape.compartments) {
        const compartmentVal = umlWebClient.post('instanceValue');
        compartmentVal.instance.set(compartment.id);
        compartmentSlot.values.add(compartmentVal);
        umlWebClient.put(compartmentVal);
    }
    shapeInstance.slots.add(compartmentSlot);

    umlWebClient.put(compartmentSlot);

    await createDiagramShapeFeatures(shape, shapeInstance, umlWebClient, diagramContext);
}

export async function createComparment(compartment, umlWebClient, diagramContext) {
    const compartmentInstance = umlWebClient.post('instanceSpecification', { id: compartment.id });
    compartmentInstance.classifiers.add(COMPARTMENT_ID);
    diagramContext.diagram.packagedElements.add(compartmentInstance);

    await createDiagramElementFeatures(compartment, umlWebClient, compartmentInstance, diagramContext);

    umlWebClient.put(compartmentInstance);
    umlWebClient.put(diagramContext.diagram);

    const ret = new Compartment();
    return ret;
}

export async function createCompartmentableShape(shape, umlWebClient, diagramContext) {
    const compartmentableShapeInstance = umlWebClient.post('instanceSpecification', { id: shape.id });
    compartmentableShapeInstance.classifiers.add(COMPARTMENTABLE_SHAPE_ID);
    diagramContext.diagram.packagedElements.add(compartmentableShapeInstance);

    await createDiagramShapeFeatures(shape, compartmentableShapeInstance, umlWebClient, diagramContext);

    umlWebClient.put(compartmentableShapeInstance);
    umlWebClient.put(diagramContext.diagram);

    const ret = new CompartmentableShape();
    ret.bounds.x = shape.x;
    ret.bounds.y = shape.y;
    ret.bounds.width = shape.width;
    ret.bounds.height = shape.height;
    for (const compartment of shape.compartments) {
        ret.compartments.push(compartment.id); // change in future
    }
    return ret;
}

export async function createClassifierShape(shape, umlWebClient, diagramContext) {
    const classifierShapeInstance = umlWebClient.post('instanceSpecification', { id : shape.id });
    classifierShapeInstance.classifiers.add(CLASSIFIER_SHAPE_ID);
    diagramContext.diagram.packagedElements.add(classifierShapeInstance);

    await createCompartmentableShapeFeatures(shape, classifierShapeInstance, umlWebClient, diagramContext);

    umlWebClient.put(classifierShapeInstance);
    umlWebClient.put(diagramContext.diagram);

    const ret = new ClassifierShape();
    ret.bounds.x = shape.x;
    ret.bounds.y = shape.y;
    ret.bounds.width = shape.width;
    ret.bounds.height = shape.height;
    for (const compartment of shape.compartments) {
        ret.compartments.push(compartment.id);
    }
    return ret;
}

export async function fillOutCompartmentableShapeFeatures(compartmentableShape, compartmentableShapeSlot, umlClient) {
    if (compartmentableShapeSlot.definingFeature.id() === COMPARTMENTS_ID) {
        for await (const values of compartmentableShapeSlot.values) {
            compartmentableShape.compartments.push(values.instance.id());
        }
    } else {
        await fillOutShapeFeatures(compartmentableShape, compartmentableShapeSlot, umlClient);
    }
}
