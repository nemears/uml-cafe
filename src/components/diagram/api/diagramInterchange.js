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
    name =  '';
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
            ret.id = id;
            for await (const labelSlot of umlDiagramElement.slots) {
                if (labelSlot.definingFeature.id() === BOUNDS_ID) {
                    await filloutBounds(labelSlot, ret);
                } else if (labelSlot.definingFeature.id() === TEXT_ID) {
                    ret.text = (await labelSlot.values.front()).value;
                } else if (await getDiagramElementFeatures(labelSlot, ret, umlClient)) {
                    continue;
                } 
            }

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
            diagramElement.ownedElements.push(ownedElementValue.instance.id());
        }
        return true;
    }
    return false;
}

export async function deleteUmlDiagramElement(diagramElementID, umlWebClient) {
    const diagramElementInstance = await umlWebClient.get(diagramElementID);
    if (!diagramElementInstance) {
        console.warn('could not delete diagramElement ' + diagramElementID + ' from server, already removed!');
        return;
    }
    for (const classifierID of diagramElementInstance.classifiers.ids()) {
        if (classifierID === SHAPE_ID || classifierID === LABEL_ID) {
            // shape
            for await (const shapeSlot of diagramElementInstance.slots) {
                if (shapeSlot.definingFeature.id() === 'KbKmDNU19SWMJwggKTQ9FrzAzozO') {
                    // bounds get and delete instance
                    await umlWebClient.deleteElement(await (await shapeSlot.values.front()).instance.get());
                } else if (shapeSlot.definingFeature.id() === 'rnm_zSDRk_kdPiWTfx6QZRkgUvFe') {
                    // delete owned elements
                    for await (const ownedElementValue of shapeSlot.values) {
                        await deleteUmlDiagramElement(ownedElementValue.instance.id(), umlWebClient);
                    }
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
    if (!shape.modelElement) {
        console.warn('no model element for ' + shape.ElementType() + ' ' + shape.id);
    } else {
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
        owningElementSlot = umlWebClient.post('slot');
        owningElementValue = umlWebClient.post('instanceValue');
        owningElementSlot.definingFeature.set('3&io9rgm9t1Vu9l8EEwU3QBNblgX');
        owningElementValue.instance.set(owningElementInstance);
        owningElementSlot.values.add(owningElementValue);
        shapeInstance.slots.add(owningElementSlot);
        for await (const owningElementInstanceSlot of owningElementInstance.slots) {
            if (owningElementInstanceSlot.definingFeature.id() === 'rnm_zSDRk_kdPiWTfx6QZRkgUvFe') {
                owningElementOwnedElementsSlot = owningElementInstanceSlot;
                break;
            }
        }
        if (!owningElementOwnedElementsSlot) {
            owningElementOwnedElementsSlot = umlWebClient.post('slot');
            owningElementOwnedElementsSlot.definingFeature.set('rnm_zSDRk_kdPiWTfx6QZRkgUvFe');
            owningElementInstance.slots.add(owningElementOwnedElementsSlot);
        }
        owningElementOwnedElementsValue = umlWebClient.post('instanceValue');
        owningElementOwnedElementsValue.instance.set(shapeInstance);
        owningElementOwnedElementsSlot.values.add(owningElementOwnedElementsValue);
    }
    if (shape.children.length > 0) {
        ownedElementsSlot = umlWebClient.post('slot');
        ownedElementsSlot.definingFeature.set('rnm_zSDRk_kdPiWTfx6QZRkgUvFe');
        for (const ownedElement of shape.children) {
            const ownedElementValue = umlWebClient.post('instanceValue');
            ownedElementValue.instance.set(ownedElement.id);
            ownedElementsSlot.values.add(ownedElementValue);
        }
        shapeInstance.slots.add(ownedElementsSlot);
    }

    if (shape.parent) {
        umlWebClient.put(owningElementSlot);
        umlWebClient.put(owningElementValue);
        umlWebClient.put(owningElementInstance);
        umlWebClient.put(owningElementOwnedElementsSlot);
        umlWebClient.put(owningElementOwnedElementsValue);
    }
    if (shape.children.length > 0) {
        umlWebClient.put(ownedElementsSlot);
        for (const ownedElementValue of ownedElementValues) {
            umlWebClient.put(ownedElementValue);
        } 
    }
    umlWebClient.put(diagramContext.diagram);
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
    
    // set up modelElement
    await createDiagramElementFeatures(shape, umlWebClient, shapeInstance, diagramContext);

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

export async function createDiagramLabel(label, umlWebClient, diagramContext) {
   // set up shape
    const labelInstance = umlWebClient.post('instanceSpecification', { id : label.id });
    labelInstance.classifiers.add(LABEL_ID);
    diagramContext.diagram.packagedElements.add(labelInstance); 

    await createDiagramLabelFeatures(label, labelInstance, umlWebClient, diagramContext);

    umlWebClient.put(labelInstance);
    umlWebClient.put(diagramContext.diagram); 

    const ret = new Label();
    ret.bounds.x = label.x;
    ret.bounds.y = label.y;
    ret.bounds.width = label.width;
    ret.bounds.height = label.height;
    ret.id = label.id;
    ret.text = label.text;
    return ret;
}

export async function createNameLabel(label, umlWebClient, diagramContext) {
    // set up shape
    const labelInstance = umlWebClient.post('instanceSpecification', { id : label.id });
    labelInstance.classifiers.add(NAME_LABEL_ID);
    diagramContext.diagram.packagedElements.add(labelInstance); 

    await createDiagramLabel(label, labelInstance, umlWebClient, diagramContext);

    umlWebClient.put(labelInstance);
    umlWebClient.put(diagramContext.diagram);

    const ret = new NameLabel();
    ret.bounds.x = label.x;
    ret.bounds.y = label.y;
    ret.bounds.width = label.width;
    ret.bounds.height = label.height;
    ret.id = label.id;
    ret.text = label.text;
    return ret;
}

export async function createKeywordLabel(label, umlWebClient, diagramContext) {
    // set up shape
    const labelInstance = umlWebClient.post('instanceSpecification', { id : label.id });
    labelInstance.classifiers.add(KEYWORD_LABEL_ID);
    diagramContext.diagram.packagedElements.add(labelInstance); 

    await createDiagramLabel(label, labelInstance, umlWebClient, diagramContext);

    umlWebClient.put(labelInstance);
    umlWebClient.put(diagramContext.diagram);

    const ret = new KeywordLabel();
    ret.bounds.x = label.x;
    ret.bounds.y = label.y;
    ret.bounds.width = label.width;
    ret.bounds.height = label.height;
    ret.id = label.id;
    ret.text = label.text;
    return ret; 
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

    await createCompartmentableShapeFeatures(shape, compartmentableShapeInstance, umlWebClient, diagramContext);

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
