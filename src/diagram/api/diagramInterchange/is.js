import { SHAPE_ID, LABEL_ID, NAME_LABEL_ID, TYPED_ELEMENT_LABEL_ID, KEYWORD_LABEL_ID, ASSOCIATION_END_LABEL_ID, MULTIPLICITY_LABEL_ID, COMPARTMENTABLE_SHAPE_ID, CLASSIFIER_SHAPE_ID, CLASS_DIAGRAM_ID } from './ids';

export function isShape(id) {
    return  id === SHAPE_ID ||
            id === 'shape' ||
            isCompartmentableShape(id) ||
            isDiagram(id) ||
            isLabel(id);
}

export function isLabel(elementType) {
    return  elementType === 'label' || 
            elementType === 'nameLabel' || 
            elementType === 'typedElementLabel' || 
            elementType === 'keywordLabel' || 
            elementType === 'associationEndLabel' || 
            elementType === 'multiplicityLabel' ||
            elementType === LABEL_ID ||
            elementType === NAME_LABEL_ID ||
            elementType === TYPED_ELEMENT_LABEL_ID ||
            elementType === KEYWORD_LABEL_ID ||
            elementType === ASSOCIATION_END_LABEL_ID ||
            elementType === MULTIPLICITY_LABEL_ID;
}

export function isDiagram(elementType) {
    return elementType === 'classDiagram' ||
           elementType === CLASS_DIAGRAM_ID; // TODO
}

export function isCompartmentableShape(id) {
    return  id === COMPARTMENTABLE_SHAPE_ID ||
            id === CLASSIFIER_SHAPE_ID ||
            id === 'classifierShape' ||
            id === 'compartmentableShape';
}
