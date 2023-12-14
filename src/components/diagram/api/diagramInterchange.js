import { Bounds, Point } from './diagramCommon';

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
        if (classifierID === 'KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g') {
            // it is a shape
            const ret = new Shape();
            ret.id = id;
            // fill out bounds
            for await (let shapeSlot of umlDiagramElement.slots) {
               if (shapeSlot.definingFeature.id() === 'KbKmDNU19SWMJwggKTQ9FrzAzozO') {
                   // this is the bounds
                   const boundsInstance = await (await shapeSlot.values.front()).instance.get();
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
               } else {
                   if (await getDiagramElementFeatures(shapeSlot, ret, umlClient)) {
                        continue;
                   }
               }
            }
            return ret;
        } else if (classifierID === 'u2fIGW2nEDfMfVxqDvSmPd5e_wNR') {
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
                } else {
                   if (await getDiagramElementFeatures(edgeSlot, ret, umlClient)) {
                        continue;
                   }
                }
            }
            return ret;
        }
    }
}

async function getDiagramElementFeatures(slot, diagramElement, umlClient) {
    if (slot.definingFeature.id() === 'xnI9Aiz3GaF91K8H7KAPe95oDgyE') {
        // modelElement get id and set value
        for await(let modelElementSlot of (await(await slot.values.front()).instance.get()).slots) {
            if (modelElementSlot.definingFeature.id() === '3gx55nLEvmzDt2kKK7gYgxsTBD6M') {
                // get value of id and set modelElement value
                diagramElement.modelElement = await umlClient.get((await modelElementSlot.values.front()).value);
                return true;
            }
        }
    } else if (slot.definingFeature.id() === '3&io9rgm9t1Vu9l8EEwU3QBNblgX') {
        // owningElement
        diagramElement.owningElement = (await slot.values.front()).instance.id();
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
        if (classifierID === 'KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g') {
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
        } else if (classifierID === 'u2fIGW2nEDfMfVxqDvSmPd5e_wNR') {
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
        }
    }
}

export async function createModelElementSlot(shape, umlWebClient, shapeInstance, diagramContext) {
    // TODO do this with more detail, rn we are just making element and ID
    const modelElementInstance = await umlWebClient.post('instanceSpecification');
    const modelElementSlot = await umlWebClient.post('slot');
    const modelElementValue = await umlWebClient.post('instanceValue');
    const idSlot = await umlWebClient.post('slot');
    const idVal = await umlWebClient.post('literalString');
    modelElementInstance.classifiers.add(await umlWebClient.get('XI35viryLd5YduwnSbWpxSs3npcu'));
    idVal.value = shape.modelElement.id;
    idSlot.definingFeature.set(await umlWebClient.get('3gx55nLEvmzDt2kKK7gYgxsTBD6M'));
    idSlot.values.add(idVal);
    modelElementInstance.slots.add(idSlot);
    modelElementValue.instance.set(modelElementInstance);
    modelElementSlot.values.add(modelElementValue);
    modelElementSlot.definingFeature.set(await umlWebClient.get('xnI9Aiz3GaF91K8H7KAPe95oDgyE'));
    shapeInstance.slots.add(modelElementSlot);
    diagramContext.diagram.packagedElements.add(modelElementInstance);
    umlWebClient.put(modelElementInstance);
    umlWebClient.put(modelElementSlot);
    umlWebClient.put(modelElementValue);
    umlWebClient.put(idSlot);
    umlWebClient.put(idVal); 
}

export async function createDiagramShape(shape, umlWebClient, diagramContext) {
    // set up shape
    const shapeInstance = await umlWebClient.post('instanceSpecification', {id:shape.id});
    shapeInstance.classifiers.add(await umlWebClient.get('KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g'));
    diagramContext.diagram.packagedElements.add(shapeInstance);
    
    // set up bounds
    const boundsInstance = await umlWebClient.post('instanceSpecification');
    diagramContext.diagram.packagedElements.add(boundsInstance);
    boundsInstance.classifiers.add(await umlWebClient.get('GrSBY10MECO6g8EesG5ZdXVQ5m5B'));
    const boundsSlot = await umlWebClient.post('slot');
    boundsSlot.definingFeature.set(await umlWebClient.get('KbKmDNU19SWMJwggKTQ9FrzAzozO'));
    const boundsValue = await umlWebClient.post('instanceValue');
    boundsValue.instance.set(boundsInstance);
    boundsSlot.values.add(boundsValue);
    shapeInstance.slots.add(boundsSlot);
    
    // set up x
    const xSlot = await umlWebClient.post('slot');
    xSlot.definingFeature.set(await umlWebClient.get('OaYzOYryv5lrW2YYkujnjL02rSlo'));
    boundsInstance.slots.add(xSlot);
    const xValue = await umlWebClient.post('literalInt');
    xValue.value = shape.x;
    xSlot.values.add(xValue);

    // set up y
    const ySlot = await umlWebClient.post('slot');
    ySlot.definingFeature.set(await umlWebClient.get('RhD_fTVUMc4ceJ4topOlpaFPpoiB'));
    boundsInstance.slots.add(ySlot);
    const yValue = await umlWebClient.post('literalInt');
    yValue.value = shape.y;
    ySlot.values.add(yValue);

    // set up width
    const widthValue = await umlWebClient.post('literalInt');
    widthValue.value = shape.width;
    const widthSlot = await umlWebClient.post('slot');
    widthSlot.definingFeature.set(await umlWebClient.get('&TCEXx1uZQsa7g1KPT9ocVwNiwV7'));
    widthSlot.values.add(widthValue);
    boundsInstance.slots.add(widthSlot);

    // set up height
    const heightValue = await umlWebClient.post('literalInt');
    heightValue.value = shape.height;
    const heightSlot = await umlWebClient.post('slot');
    heightSlot.definingFeature.set(await umlWebClient.get('ELF54xP3DUMrFbgteAQkIXONqnlg'));
    heightSlot.values.add(heightValue);
    boundsInstance.slots.add(heightSlot);
    
    // set up modelElement
    await createModelElementSlot(shape, umlWebClient, shapeInstance, diagramContext);

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
        owningElementSlot = await umlWebClient.post('slot');
        owningElementValue = await umlWebClient.post('instanceValue');
        owningElementSlot.definingFeature.set(await umlWebClient.get('3&io9rgm9t1Vu9l8EEwU3QBNblgX'));
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
            owningElementOwnedElementsSlot = await umlWebClient.post('slot');
            owningElementOwnedElementsSlot.definingFeature.set(await umlWebClient.get('rnm_zSDRk_kdPiWTfx6QZRkgUvFe'));
            owningElementInstance.slots.add(owningElementOwnedElementsSlot);
        }
        owningElementOwnedElementsValue = await umlWebClient.post('instanceValue');
        owningElementOwnedElementsValue.instance.set(shapeInstance);
        owningElementOwnedElementsSlot.values.add(owningElementOwnedElementsValue);
    }
    if (shape.children.length > 0) {
        ownedElementsSlot = await umlWebClient.post('slot');
        ownedElementsSlot.definingFeature.set(await umlWebClient.get('rnm_zSDRk_kdPiWTfx6QZRkgUvFe'));
        for (const ownedElement of shape.children) {
            const ownedElementValue = await umlWebClient.post('instanceValue');
            ownedElementValue.instance.set(await umlWebClient.get(ownedElement.id));
            ownedElementsSlot.values.add(ownedElementValue);
        }
        shapeInstance.slots.add(ownedElementsSlot);
    }

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
