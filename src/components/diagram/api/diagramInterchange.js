import { Bounds, Point } from './diagramCommon';

export class DiagramElement {
    
    id = '';

    owningElement = null; // Type is DiagramElement
    ownedElement = []; // Type is [DiagramElement]

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

            // TODO fill out owned and owning elements
            
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
    } // TODO owning and owned elements
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
