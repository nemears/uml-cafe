import { adjustShape } from '../../providers/UmlShapeProvider';
import { Shape, createDiagramShapeFeatures, fillOutShapeFeatures } from './shape';
import { TEXT_ID, LABEL_ID, NAME_LABEL_ID, KEYWORD_LABEL_ID, TYPED_ELEMENT_LABEL_ID, MULTIPLICITY_LABEL_ID, ASSOCIATION_END_LABEL_ID } from './ids'

export class Label extends Shape {
    text = '';
    elementType() {
        return 'label';
    }
}

export class NameLabel extends Label {
    elementType() {
        return 'nameLabel';
    }
}

export class KeywordLabel extends Label {
    elementType() {
        return 'keywordLabel';
    }
}

export class TypedElementLabel extends Label {
    elementType() {
        return 'typedElementLabel';
    }
}

export class AssociationEndLabel extends Label {
    elementType() {
        return 'associationEndLabel';
    }
}

export class MultiplicityLabel extends Label {
    elementType() {
        return 'multiplicityLabel';
    }
}



export async function createDiagramLabelFeatures(label, labelInstance, umlWebClient, diagramContext) {
    // text
    const textSlot = umlWebClient.post('slot');
    const textVal = umlWebClient.post('literalString');
    textSlot.definingFeature.set(TEXT_ID);
    textSlot.values.add(textVal);
    textVal.value = label.text;
    labelInstance.slots.add(textSlot);

    umlWebClient.put(textSlot);
    umlWebClient.put(textVal);

    await createDiagramShapeFeatures(label, labelInstance, umlWebClient, diagramContext);
}

export async function createLabelOfType(label, typeID, umlWebClient, diagramContext) {
    const labelInstance = umlWebClient.post('instanceSpecification', { id : label.id });
    labelInstance.classifiers.add(typeID);
    diagramContext.diagram.packagedElements.add(labelInstance); 

    await createDiagramLabelFeatures(label, labelInstance, umlWebClient, diagramContext);

    umlWebClient.put(labelInstance);
    umlWebClient.put(diagramContext.diagram); 

    let ret;
    switch (typeID) {
        case LABEL_ID:
            ret = new Label();
            break;
        case NAME_LABEL_ID:
            ret = new NameLabel();
            break;
        case TYPED_ELEMENT_LABEL_ID:
            ret = new TypedElementLabel();
            break;
        case KEYWORD_LABEL_ID:
            ret = new KeywordLabel();
            break;
        case ASSOCIATION_END_LABEL_ID:
            ret = new AssociationEndLabel();
            break;
        case MULTIPLICITY_LABEL_ID:
            ret = new MultiplicityLabel();
            break;
        default:
            throw Error('cannot determine which type of label to create by ID!');
    }
    ret.bounds.x = label.x;
    ret.bounds.y = label.y;
    ret.bounds.width = label.width;
    ret.bounds.height = label.height;
    ret.id = label.id;
    ret.text = label.text;
    return ret; 
}

export async function fillOutLabelFeatures(label, labelSlot, umlClient) {
    if (labelSlot.definingFeature.id() === TEXT_ID) {
        label.text = (await labelSlot.values.front()).value;
    } else {
        await fillOutShapeFeatures(label, labelSlot, umlClient);
    }
}

export async function createDiagramLabel(label, umlWebClient, diagramContext) {
    return await createLabelOfType(label, LABEL_ID, umlWebClient, diagramContext);
}

export async function createNameLabel(label, umlWebClient, diagramContext) {
    return await createLabelOfType(label, NAME_LABEL_ID, umlWebClient, diagramContext);
}

export async function createKeywordLabel(label, umlWebClient, diagramContext) {
    return await createLabelOfType(label, KEYWORD_LABEL_ID, umlWebClient, diagramContext);
}
export async function createTypedElementLabel(label, umlWebClient, diagramContext) {
    return await createLabelOfType(label, TYPED_ELEMENT_LABEL_ID, umlWebClient, diagramContext);
}

export async function createAssociationEndLabel(label, umlWebClient, diagramContext) {
    return await createLabelOfType(label, ASSOCIATION_END_LABEL_ID, umlWebClient, diagramContext);
}

export async function createMultiplicityLabel(label, umlWebClient, diagramContext) {
    return await createLabelOfType(label, MULTIPLICITY_LABEL_ID, umlWebClient, diagramContext);
}

// TODO replace functionality
export async function updateLabel(label, umlWebClient) {
    const labelInstance = await umlWebClient.get(label.id);
    adjustShape(label, labelInstance, umlWebClient);

    // push new text
    for await (const labelSlot of labelInstance.slots) {
        if (labelSlot.definingFeature.id() ===  TEXT_ID) {
            const labelValue = await labelSlot.values.front();
            labelValue.value = label.text;
            umlWebClient.put(labelValue);
        }
    }
}
