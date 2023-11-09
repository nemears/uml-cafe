import { Bounds } from './diagramCommon';

export class DiagramElement {
    
    owningElement = null; // Type is DiagramElement
    ownedElement = []; // Type is [DiagramElement]

    modelElement = null; // Type is uml-client/element

    // TODO styles

}

export class Shape extends DiagramElement {
    bounds = new Bounds();
}

export async function getUmlDiagramElement(id, umlClient) {
    // get the element with the client
    const umlDiagramElement = await umlClient.get(id);
    
    // determine which type of diagramElement it is
    for (let classifierID of umlDiagramElement.classifiers.ids()) {
        if (classifierID === 'KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g') {
            // it is a shape
            const ret = new Shape();
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
               } else if (shapeSlot.definingFeature.id() === 'xnI9Aiz3GaF91K8H7KAPe95oDgyE') {
                    // modelElement get id and set value
                    for await(let modelElementSlot of (await(await shapeSlot.values.front()).instance.get()).slots) {
                        if (modelElementSlot.definingFeature.id() === '3gx55nLEvmzDt2kKK7gYgxsTBD6M') {
                            // get value of id and set modelElement value
                           ret.modelElement = await umlClient.get((await modelElementSlot.values.front()).value);
                        }
                    }
               } 
            }

            // TODO fill out owned and owning elements
            
            return ret;
        }
    }
}
