import { Bounds, Point } from './diagramCommon';
import { adjustShape } from '../providers/UmlShapeProvider';
import { makeUMLWaypoints } from '../providers/relationships/relationshipUtil';

export class DiagramElement {
    
    id = '';

    owningElement = null; // Type is DiagramElement
    ownedElements = []; // Type is [DiagramElement]

    modelElement = null; // Type is uml-client/element

    // TODO styles

}

export class Shape extends DiagramElement {
    bounds = new Bounds();
    elementType() {
        return 'shape';
    }
}

export class Edge extends DiagramElement {
    source = '';
    target = '';
    waypoints = [];
    elementType() {
        return 'edge'
    }
}

export class Diagram extends Shape {
    // DI
    name =  '';
    documentation = '';
    resolution = ''
    // UML DI
    isFrame = true;
    isIso = true;
    isInheritedLighter = false;
    heading = undefined;
    elementType() {
        return 'diagram';
    }
}

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

/**
 * enum NavigabilityNotationKind
 * always
 * oneway
 * never
 **/

export class DiagramWithAssociation extends Diagram {
    isAssociationDotShown = false; // TODO implement
    navigabilityNotation = 'oneway'; // TODO implement
    nonNavigabilityNotation = 'never'; // TODO implement
    elementType() {
        return 'diagramWithAssociation';
    }
}

export class StructureDiagram extends DiagramWithAssociation {
    elementType() {
        return 'structureDiagram';
    }
}

export class ClassDiagram extends StructureDiagram {
    elementType() {
        return 'classDiagram';
    }
}

export const BOUNDS_ID = 'KbKmDNU19SWMJwggKTQ9FrzAzozO';
const TEXT_ID = 'GJKibcaKH82QYL&Sm3&rX5Mlc8ps';
export const LABEL_ID = 'urWpoxZVhva76RnwyRAhLgduprmm';
export const SHAPE_ID = 'KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g'; 
export const EDGE_ID = 'u2fIGW2nEDfMfVxqDvSmPd5e_wNR';
export const NAME_LABEL_ID = 'zEjDYYrgzD&3EaysBzu0Gd362cVa';
export const KEYWORD_LABEL_ID = 'LhAHXAksl7rSYGupT6s7tfl9oDsY';
export const COMPARTMENT_ID = 'XEkIdyR4AD2A_BIxl8WN5ZrcRP0&';
export const COMPARTMENTABLE_SHAPE_ID = 'z1DL0UzKw39EJh&SA5llseAEYgyd';
export const CLASSIFIER_SHAPE_ID = 'Z6TrdLUX1PnxDxERdehoiwuo4Thd';
export const COMPARTMENTS_ID = '94EL1DpEJq&sqIIyUkljNkGiLErL';
export const TYPED_ELEMENT_LABEL_ID = 'kY&kIIA_XPbHZrs73YN&uDcSAhuh';
export const ASSOCIATION_END_LABEL_ID = 'aaOkfblFlFn7QjVstTUgbCoNqyl8';
export const MULTIPLICITY_LABEL_ID = '5pVpZ7MJzq5mysPkikGPT9kcvE10';
export const OWNED_ELEMENTS_SLOT_ID = 'rnm_zSDRk_kdPiWTfx6QZRkgUvFe';
export const OWNING_ELEMENT_SLOT_ID = '3&io9rgm9t1Vu9l8EEwU3QBNblgX';
export const CLASS_DIAGRAM_ID = 'OlOjWJGfJyejrDUQ&zPwT68unIFd';
export const DIAGRAM_NAME_SLOT_ID = 'CN7vzxOOpQJkGS964DTMuDWQkLlz';
export const DIAGRAM_DOCUMENTATION_SLOT_ID = '6CjufML0&O3S4cmtN2cL44BYr8HL';
export const DIAGRAM_RESOLUTION_SLOT_ID = '4Tize6jbCmObf93emecyjJFvRjo3';
export const DIAGRAM_IS_FRAME_SLOT_ID = '7mT9JY5EGA4TDqjv0R0Ncd9x5OyU';
export const DIAGRAM_IS_INHERITED_LIGHTER_SLOT_ID = '4phpVkyDwulQSgJPc6gX7mIVhSbE';
export const DIAGRAM_IS_ISO_SLOT_ID = '&DNyiZYBunaQcQexHq7OfqrZrEuU';
export const DIAGRAM_HEADING_SLOT_ID = 'jHSNDVVMy40lH6TTEOeTtGBnrZGv';

// functions

async function fillOutLabel(label, umlDiagramElement, id, umlClient) {
    label.id = id;
    for await (const associationEndLabelSlot of umlDiagramElement.slots) {
        if (associationEndLabelSlot.definingFeature.id() === BOUNDS_ID) {
            await filloutBounds(associationEndLabelSlot, label);
        } else if (associationEndLabelSlot.definingFeature.id() === TEXT_ID) {
            label.text = (await associationEndLabelSlot.values.front()).value;
        } else if (await getDiagramElementFeatures(associationEndLabelSlot, label, umlClient)) {
            continue;
        }
    }
    return label;
}

export async function getUmlDiagramElement(id, umlClient) {
    // get the element with the client
    const umlDiagramElement = await umlClient.get(id);

    if (!umlDiagramElement) {
        console.error('could not get diagram element ' + id + ' from server, it must have been deleted and kept track of!');
        return undefined;
    }
    
    // determine which type of diagramElement it is
    for (let classifierID of umlDiagramElement.classifiers.ids()) {
        if (classifierID === SHAPE_ID) {
            // it is a shape
            const ret = new Shape();
            ret.id = id;
            // fill out bounds
            for await (let shapeSlot of umlDiagramElement.slots) {
               if (shapeSlot.definingFeature.id() === BOUNDS_ID) {
                   // this is the bounds
                   await filloutBounds(shapeSlot, ret);
               } else if (await getDiagramElementFeatures(shapeSlot, ret, umlClient)) {
                    continue;
               }
            }
            return ret;
        } else if (classifierID === EDGE_ID) {
            // edge
            const ret = new Edge();
            ret.id = id;
            for await (const edgeSlot of umlDiagramElement.slots) {
                if (edgeSlot.definingFeature.id() === 'Zf2K&k0k&jwaAz1GLsTSk7rN742p') {
                    // waypoints
                    for await (const waypointValue of edgeSlot.values) {
                        const point = new Point();
                        for await (const pointSlot of (await waypointValue.instance.get()).slots) {
                            if (pointSlot.definingFeature.id() === '0TTKoNWbe13DJ3ou_1KhyS9sE1iU') {
                                point.x = (await pointSlot.values.front()).value;
                            } else if (pointSlot.definingFeature.id() === 'wecoFZpGF2kLOJ0sBneePO3nB47z') {
                                point.y = (await pointSlot.values.front()).value;
                            }
                        }
                        ret.waypoints.push(point);
                    }
                } else if (edgeSlot.definingFeature.id() === 'Xxh7mjF9IMK0rhyrbSXOGA1_7vVo') {
                    // source
                    // just setting to id for now?
                    ret.source = (await edgeSlot.values.front()).instance.id();
                } else if (edgeSlot.definingFeature.id() === 'R2flL_8p_&Zc7HP07QfAyUI7EtCg') {
                    // target
                    // just setting to id for now
                    ret.target = (await edgeSlot.values.front()).instance.id();
                } else if (await getDiagramElementFeatures(edgeSlot, ret, umlClient)) {
                    continue;
                }
            }
            return ret;
        } else if (classifierID === LABEL_ID) {
            // UmlLabel
            const ret = new Label();
            await fillOutLabel(ret, umlDiagramElement, id, umlClient);
            return ret;
        } else if (classifierID === COMPARTMENT_ID) {
            const ret = new Compartment();
            ret.id = id;
            for await (const compartmentSlot of umlDiagramElement.slots) {
                if (await getDiagramElementFeatures(compartmentSlot, ret, umlClient)) {
                    continue;
                }
            }
            return ret;
        } else if (classifierID === CLASSIFIER_SHAPE_ID) {
            // ClassifierShape
            const ret = new ClassifierShape();
            ret.id = id;
            for await (const classifierShapeSlot of umlDiagramElement.slots) {
                if (classifierShapeSlot.definingFeature.id() === COMPARTMENTS_ID) {
                    for await (const values of classifierShapeSlot.values) {
                        ret.compartments.push(values.instance.id());
                    }
                } else if (classifierShapeSlot.definingFeature.id() === BOUNDS_ID) {
                    await filloutBounds(classifierShapeSlot, ret);
                } else if (await getDiagramElementFeatures(classifierShapeSlot, ret, umlClient)) {
                    continue;
                }
            }
            return ret;
        } else if (classifierID === NAME_LABEL_ID) {
            const ret = new NameLabel();
            await fillOutLabel(ret, umlDiagramElement, id, umlClient);
            return ret;
        } else if (classifierID === TYPED_ELEMENT_LABEL_ID) {
            const ret = new TypedElementLabel();
            await fillOutLabel(ret, umlDiagramElement, id, umlClient);
            return ret;
        } else if (classifierID === KEYWORD_LABEL_ID) {
            const ret = new KeywordLabel();
            await fillOutLabel(ret, umlDiagramElement, id, umlClient);
            return ret;
        } else if (classifierID === ASSOCIATION_END_LABEL_ID) {
            const ret = new AssociationEndLabel();
            await fillOutLabel(ret, umlDiagramElement, id, umlClient);
            return ret;
        } else if (classifierID === MULTIPLICITY_LABEL_ID) {
            const ret = new MultiplicityLabel();
            await fillOutLabel(ret, umlDiagramElement, id, umlClient);
            return ret;
        } else if (classifierID === CLASS_DIAGRAM_ID) {
            const ret = new ClassDiagram();
            ret.id = id;
            for await (const classDiagramSlot of umlDiagramElement.slots) {
                if (classDiagramSlot.definingFeature.id() === DIAGRAM_NAME_SLOT_ID) {
                    await fillOutStringSlot(classDiagramSlot, ret, 'name');
                } else if (classDiagramSlot.definingFeature.id() === DIAGRAM_DOCUMENTATION_SLOT_ID) {
                    await fillOutStringSlot(classDiagramSlot, ret, 'documentation');
                } else if (classDiagramSlot.definingFeature.id() === DIAGRAM_RESOLUTION_SLOT_ID) {
                    await fillOutStringSlot(classDiagramSlot, ret, 'resolution');
                } else if (classDiagramSlot.definingFeature.id() === DIAGRAM_IS_FRAME_SLOT_ID) {
                    await fillOutStringSlot(classDiagramSlot, ret, 'isFrame');
                } else if (classDiagramSlot.definingFeature.id() === DIAGRAM_IS_ISO_SLOT_ID) {
                    await fillOutStringSlot(classDiagramSlot, ret, 'isIso');
                } else if (classDiagramSlot.definingFeature.id() === DIAGRAM_IS_INHERITED_LIGHTER_SLOT_ID) {
                    await fillOutStringSlot(classDiagramSlot, ret, 'isInheritedLighter');
                } else if (await getDiagramElementFeatures(classDiagramSlot, ret, umlClient)) {
                    continue;
                } else if (classDiagramSlot.definingFeature.id() === DIAGRAM_HEADING_SLOT_ID) {
                    const headingValue = await classDiagramSlot.values.front();
                    if (!headingValue) {
                        continue;
                    }
                    if (!headingValue.instance.has()) {
                        throw Error("bad heading state, cannot find heading instance!");
                    }
                    ret.heading =  headingValue.instance.id();
                }
            }
            return ret;
        }
    }
    return undefined;
}

async function filloutBounds(shapeSlot, ret) {
    if (shapeSlot.values.size() !== 1) {
        throw new Error('bounds slot ' + shapeSlot.id + ' can only have 1 value!');
    }
    const boundsValue = await shapeSlot.values.front();
    if (boundsValue.elementType() !== 'instanceValue') {
        throw new Error('bounds value ' + boundsValue.id + ' not an instanceValue!');
    }
    if (!boundsValue.instance.has()) {
        throw new Error('bounds value ' + boundsValue.id + ' does not have an instance!');
    }
    const boundsInstance = await boundsValue.instance.get();
    for await (let boundsSlot of boundsInstance.slots) {
        if (boundsSlot.definingFeature.id() === 'OaYzOYryv5lrW2YYkujnjL02rSlo') {
            // x value
            ret.bounds.x = (await boundsSlot.values.front()).value;
        } else if (boundsSlot.definingFeature.id() === 'RhD_fTVUMc4ceJ4topOlpaFPpoiB') {
            // y value
            ret.bounds.y = (await boundsSlot.values.front()).value;
        } else if (boundsSlot.definingFeature.id() === '&TCEXx1uZQsa7g1KPT9ocVwNiwV7') {
            // width value
            ret.bounds.width = (await boundsSlot.values.front()).value;
        } else if (boundsSlot.definingFeature.id() === 'ELF54xP3DUMrFbgteAQkIXONqnlg') {
            // height value
            ret.bounds.height = (await boundsSlot.values.front()).value;
        } 
    }
}

async function getDiagramElementFeatures(slot, diagramElement, umlClient) {
    if (slot.definingFeature.id() === 'xnI9Aiz3GaF91K8H7KAPe95oDgyE') {
        // modelElement get id and set value
        for await(let modelElementSlot of (await(await slot.values.front()).instance.get()).slots) {
            if (modelElementSlot.definingFeature.id() === '3gx55nLEvmzDt2kKK7gYgxsTBD6M') {
                // get value of id and set modelElement value
                const modelElementValue = await modelElementSlot.values.front();
                const modelElementID = modelElementValue.value;
                const modelElement = await umlClient.get(modelElementID);
                await modelElement.owner.get();
                diagramElement.modelElement = modelElement;
                return true;
            }
        }
    } else if (slot.definingFeature.id() === '3&io9rgm9t1Vu9l8EEwU3QBNblgX') {
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
    } else if (slot.definingFeature.id() === 'rnm_zSDRk_kdPiWTfx6QZRkgUvFe') {
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

async function fillOutStringSlot(slot, diObject, memberName) {
    if (slot.values.size() > 0) {
        diObject[memberName] = (await slot.values.front()).value;
    }
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
    return elementType === 'classDiagram'; // TODO
}

export function isShape(id) {
    return  id === SHAPE_ID ||
            id === COMPARTMENTABLE_SHAPE_ID ||
            id === CLASSIFIER_SHAPE_ID ||
            id === 'shape' ||
            id === 'classifierShape' ||
            id === 'compartmentableShape' ||
            isLabel(id);
}

export async function deleteUmlDiagramElement(diagramElementID, umlWebClient) {
    const diagramElementInstance = await umlWebClient.get(diagramElementID);
    if (!diagramElementInstance) {
        console.warn('could not delete diagramElement ' + diagramElementID + ' from server, already removed!');
        return;
    }
    for (const classifierID of diagramElementInstance.classifiers.ids()) {
        if (isShape(classifierID)) {
            // shape
            for await (const shapeSlot of diagramElementInstance.slots) {
                if (shapeSlot.definingFeature.id() === 'KbKmDNU19SWMJwggKTQ9FrzAzozO') {
                    // bounds get and delete instance
                    await umlWebClient.deleteElement(await (await shapeSlot.values.front()).instance.get());
                } else if (shapeSlot.definingFeature.id() === OWNED_ELEMENTS_SLOT_ID) {                    
                    // delete owned elements if not already deleted
                    for await (const ownedElementValue of shapeSlot.values) {
                        if (ownedElementValue.instance.has()) {
                            await deleteUmlDiagramElement(ownedElementValue.instance.id(), umlWebClient);
                        }
                    }
                } else if (shapeSlot.definingFeature.id() === OWNING_ELEMENT_SLOT_ID) {
                    const owningElementInstance = await (await shapeSlot.values.front()).instance.get();
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
            
            // TODO incoming outgoing, maybe not, maybe just on client side being tracked
            await umlWebClient.deleteElement(diagramElementInstance);
            break;
        } else if (classifierID === EDGE_ID) {
            // edge
            for await (const edgeSlot of diagramElementInstance.slots) {
                if (edgeSlot.definingFeature.id() === 'Zf2K&k0k&jwaAz1GLsTSk7rN742p') {
                    // waypoints
                    for await (const waypointValue of edgeSlot.values) {
                        await umlWebClient.deleteElement(await waypointValue.instance.get());
                    }
                }
            }
            await umlWebClient.deleteElement(diagramElementInstance);
            break;
        } else {
            await umlWebClient.deleteElement(diagramElementInstance);
        }
    }
}



export async function createDiagramElementFeatures(shape, umlWebClient, shapeInstance, diagramContext) {
    if (shape.modelElement) {
        const modelElementInstance = umlWebClient.post('instanceSpecification');
        const modelElementSlot = umlWebClient.post('slot');
        const modelElementValue = umlWebClient.post('instanceValue');
        const idSlot = umlWebClient.post('slot');
        const idVal = umlWebClient.post('literalString');
        modelElementInstance.classifiers.add('XI35viryLd5YduwnSbWpxSs3npcu');
        idVal.value = shape.modelElement.id;
        idSlot.definingFeature.set('3gx55nLEvmzDt2kKK7gYgxsTBD6M');
        idSlot.values.add(idVal);
        modelElementInstance.slots.add(idSlot);
        modelElementValue.instance.set(modelElementInstance);
        modelElementSlot.values.add(modelElementValue);
        modelElementSlot.definingFeature.set('xnI9Aiz3GaF91K8H7KAPe95oDgyE');
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
        }
        owningElementOwnedElementsValue = umlWebClient.post('instanceValue');
        owningElementOwnedElementsValue.instance.set(shapeInstance);
        owningElementOwnedElementsSlot.values.add(owningElementOwnedElementsValue);
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
        umlWebClient.put(owningElementOwnedElementsValue);
    }
    umlWebClient.put(ownedElementsSlot);
    if (shape.children.length > 0) {
        for (const ownedElementValue of ownedElementValues) {
            umlWebClient.put(ownedElementValue);
        } 
    }
}

async function createDiagramShapeFeatures(shape, shapeInstance, umlWebClient, diagramContext) {
    // set up bounds
    const boundsInstance = umlWebClient.post('instanceSpecification');
    diagramContext.diagram.packagedElements.add(boundsInstance);
    boundsInstance.classifiers.add('GrSBY10MECO6g8EesG5ZdXVQ5m5B');
    const boundsSlot = umlWebClient.post('slot');
    boundsSlot.definingFeature.set('KbKmDNU19SWMJwggKTQ9FrzAzozO');
    const boundsValue = umlWebClient.post('instanceValue');
    boundsValue.instance.set(boundsInstance);
    boundsSlot.values.add(boundsValue);
    shapeInstance.slots.add(boundsSlot);
    
    // set up x
    const xSlot = umlWebClient.post('slot');
    xSlot.definingFeature.set('OaYzOYryv5lrW2YYkujnjL02rSlo');
    boundsInstance.slots.add(xSlot);
    const xValue = umlWebClient.post('literalInt');
    xValue.value = shape.x;
    xSlot.values.add(xValue);

    // set up y
    const ySlot = umlWebClient.post('slot');
    ySlot.definingFeature.set('RhD_fTVUMc4ceJ4topOlpaFPpoiB');
    boundsInstance.slots.add(ySlot);
    const yValue = umlWebClient.post('literalInt');
    yValue.value = shape.y;
    ySlot.values.add(yValue);

    // set up width
    const widthValue = umlWebClient.post('literalInt');
    widthValue.value = shape.width;
    const widthSlot = umlWebClient.post('slot');
    widthSlot.definingFeature.set('&TCEXx1uZQsa7g1KPT9ocVwNiwV7');
    widthSlot.values.add(widthValue);
    boundsInstance.slots.add(widthSlot);

    // set up height
    const heightValue = umlWebClient.post('literalInt');
    heightValue.value = shape.height;
    const heightSlot = umlWebClient.post('slot');
    heightSlot.definingFeature.set('ELF54xP3DUMrFbgteAQkIXONqnlg');
    heightSlot.values.add(heightValue);
    boundsInstance.slots.add(heightSlot);
   
    // put to server
    umlWebClient.put(boundsSlot);
    umlWebClient.put(boundsInstance);
    umlWebClient.put(boundsValue);
    umlWebClient.put(xSlot);
    umlWebClient.put(xValue);
    umlWebClient.put(ySlot);
    umlWebClient.put(yValue);
    umlWebClient.put(heightSlot);
    umlWebClient.put(heightValue);
    umlWebClient.put(widthSlot);
    umlWebClient.put(widthValue);

    // set up modelElement
    await createDiagramElementFeatures(shape, umlWebClient, shapeInstance, diagramContext);
}

async function createDiagramLabelFeatures(label, labelInstance, umlWebClient, diagramContext) {
    // text
    const textSlot = umlWebClient.post('slot');
    const textVal = umlWebClient.post('literalString');
    textSlot.definingFeature.set('GJKibcaKH82QYL&Sm3&rX5Mlc8ps');
    textSlot.values.add(textVal);
    textVal.value = label.text;
    labelInstance.slots.add(textSlot);

    umlWebClient.put(textSlot);
    umlWebClient.put(textVal);

    await createDiagramShapeFeatures(label, labelInstance, umlWebClient, diagramContext);

    
}

async function createCompartmentableShapeFeatures(shape, shapeInstance, umlWebClient, diagramContext) {
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

function createStringSlot(slotDefiningFeatureID, value, owningInstance, umlWebClient) {
    const slot = umlWebClient.post('slot');
    const slotValue = umlWebClient.post('literalString');
    slot.definingFeature.set(slotDefiningFeatureID);
    slotValue.value = value ? value : '';
    slot.values.add(slotValue);
    owningInstance.slots.add(slot);
    umlWebClient.put(slot);
    umlWebClient.put(slotValue);
}

function createBooleanSlot(slotDefiningFeatureID, value, owningInstance, umlWebClient) {
    const slot = umlWebClient.post('slot');
    const slotValue = umlWebClient.post('literalBool');
    slot.definingFeature.set(slotDefiningFeatureID);
    slotValue.value = value ? true : false;
    slot.values.add(slotValue);
    owningInstance.slots.add(slot);
    umlWebClient.put(slot);
    umlWebClient.put(slotValue);
}

function createDiagramFeatures(diagram, diagramInstance, umlWebClient) {
    createStringSlot(DIAGRAM_NAME_SLOT_ID, diagram.name, diagramInstance, umlWebClient);
    createStringSlot(DIAGRAM_DOCUMENTATION_SLOT_ID, diagram.documentation, diagramInstance, umlWebClient);
    createStringSlot(DIAGRAM_RESOLUTION_SLOT_ID, diagram.resolution, diagramInstance, umlWebClient);
    createBooleanSlot(DIAGRAM_IS_FRAME_SLOT_ID, diagram.isFrame === undefined ? true : diagram.isFrame, diagramInstance, umlWebClient);
    createBooleanSlot(DIAGRAM_IS_INHERITED_LIGHTER_SLOT_ID, diagram.isInheritedLighter, diagramInstance, umlWebClient);
    createBooleanSlot(DIAGRAM_IS_ISO_SLOT_ID, diagram.isIso === undefined ? true : diagram.isIso, diagramInstance, umlWebClient);
    const headingSlot = umlWebClient.post('slot');
    headingSlot.definingFeature.set(DIAGRAM_HEADING_SLOT_ID);
    diagramInstance.slots.add(headingSlot);
    if (diagram.heading) {
        const headingValue = umlWebClient.post('instanceValue');
        headingSlot.values.add(headingValue);
        headingValue.instance.set(diagram.heading.id);
        umlWebClient.put(headingValue);
    }
    umlWebClient.put(headingSlot);
}

export async function createDiagramShape(shape, umlWebClient, diagramContext) {
    // set up shape
    const shapeInstance = umlWebClient.post('instanceSpecification', {id:shape.id});
    shapeInstance.classifiers.add(SHAPE_ID);
    diagramContext.diagram.packagedElements.add(shapeInstance);
    
    await createDiagramShapeFeatures(shape, shapeInstance, umlWebClient, diagramContext);
    
    // put shape last so that data is complete on updating diagram
    umlWebClient.put(shapeInstance);
    const ret = new Shape();
    ret.id = shape.id;
    ret.bounds.x = shape.x;
    ret.bounds.y = shape.y;
    ret.bounds.width = shape.width;
    ret.bounds.height = shape.height;
    ret.modelElement = shape.modelElement;
    return ret;
}

async function createLabelOfType(label, typeID, umlWebClient, diagramContext) {
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

export async function createDiagramEdge(relationship, umlWebClient, diagramContext) {
    const edgeInstance = umlWebClient.post('instanceSpecification', {id: relationship.id});
    edgeInstance.classifiers.add(EDGE_ID);

    // source
    const sourceSlot = umlWebClient.post('slot');
    sourceSlot.definingFeature.set('Xxh7mjF9IMK0rhyrbSXOGA1_7vVo');
    const sourceValue = umlWebClient.post('instanceValue');
    sourceValue.instance.set(relationship.source.id);
    sourceSlot.values.add(sourceValue);
    edgeInstance.slots.add(sourceSlot);

    // target
    const targetSlot = umlWebClient.post('slot')
    targetSlot.definingFeature.set('R2flL_8p_&Zc7HP07QfAyUI7EtCg');
    const targetValue = umlWebClient.post('instanceValue');
    targetValue.instance.set(relationship.target.id);
    targetSlot.values.add(targetValue);
    edgeInstance.slots.add(targetSlot);
    
    // waypoints
    const waypointsSlot = umlWebClient.post('slot');
    waypointsSlot.definingFeature.set('Zf2K&k0k&jwaAz1GLsTSk7rN742p');
    makeUMLWaypoints(relationship, umlWebClient, waypointsSlot, diagramContext);
    edgeInstance.slots.add(waypointsSlot);
    
    diagramContext.diagram.packagedElements.add(edgeInstance);

    umlWebClient.put(sourceSlot);
    umlWebClient.put(sourceValue);
    umlWebClient.put(targetSlot);
    umlWebClient.put(targetValue);
    umlWebClient.put(diagramContext.diagram);

    // super type
    await createDiagramElementFeatures(relationship, umlWebClient, edgeInstance, diagramContext);

    // trigger other clients by putting this element
    umlWebClient.put(edgeInstance);
    
    return edgeInstance;
}

export async function createClassDiagram(diagram, umlWebClient, diagramContext) {
    const diagramInstance = umlWebClient.post('instanceSpecification', {id: diagram.id});
    diagramInstance.classifiers.add(CLASS_DIAGRAM_ID);

    createDiagramFeatures(diagram, diagramInstance, umlWebClient);

    // TODO Diagram with associations

    await createDiagramElementFeatures(diagram, umlWebClient,  diagramInstance, diagramContext);

    diagramContext.diagram.packagedElements.add(diagramInstance);
    umlWebClient.put(diagramInstance);
    umlWebClient.put(diagramContext.diagram);

    const ret = new ClassDiagram();
    ret.id = diagram.id;
    if (diagram.name) {
        ret.name = diagram.name;
    }
    if (diagram.documentation) {
        ret.documentation = diagram.documentation;
    }
    if (diagram.resolution) {
        ret.resolution = diagram.resolution;
    }
    ret.isFrame = diagram.isFrame === undefined ? true : diagram.isFrame;
    ret.isIso = diagram.isIso === undefined ? true : diagram.isIso;
    ret.isInheritedLighter = diagram.isInheritedLighter ? true : false;
    if (diagram.heading) {
        ret.heading = diagram.heading.id;
    }
    return ret;
}

export async function updateClassDiagram(classDiagram, umlWebClient) {
    const diagramInstance = await umlWebClient.get(classDiagram.id);
    for await (const diagramSlot of diagramInstance.slots) {
        if (classDiagram.heading && diagramSlot.definingFeature.id() === DIAGRAM_HEADING_SLOT_ID) {
            let headingValue = await diagramSlot.values.front();
            if (!headingValue) {
                headingValue = umlWebClient.post('instanceValue');
                diagramSlot.values.add(headingValue);
                umlWebClient.put(diagramSlot);
            }
            headingValue.instance.set(classDiagram.heading.id);
            umlWebClient.put(headingValue);
        } else if (classDiagram.name && diagramSlot.definingFeature.id() === DIAGRAM_NAME_SLOT_ID) {
            const headingValue = await diagramSlot.values.front();
            headingValue.value = classDiagram.name;
            umlWebClient.put(headingValue);
        }
        // TODO others
    }
    umlWebClient.put(diagramInstance);
}

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
