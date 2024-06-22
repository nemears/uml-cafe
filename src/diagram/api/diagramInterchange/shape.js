import { Bounds, BOUNDS_ID, BOUNDS_X_SLOT_ID, BOUNDS_Y_SLOT_ID, BOUNDS_WIDTH_SLOT_ID, BOUNDS_HEIGHT_SLOT_ID } from '../diagramCommon';
import { DiagramElement, createDiagramElementFeatures, fillOutDiagramElementFeatures } from './diagramElement';
import { SHAPE_BOUNDS_SLOT_ID, SHAPE_ID } from './ids';

export class Shape extends DiagramElement {
    bounds = new Bounds();
    elementType() {
        return 'shape';
    }
}


export async function createDiagramShapeFeatures(shape, shapeInstance, umlWebClient, diagramContext) {
    // set up bounds
    const boundsInstance = umlWebClient.post('instanceSpecification');
    diagramContext.diagram.packagedElements.add(boundsInstance);
    boundsInstance.classifiers.add(BOUNDS_ID);
    const boundsSlot = umlWebClient.post('slot');
    boundsSlot.definingFeature.set(SHAPE_BOUNDS_SLOT_ID);
    const boundsValue = umlWebClient.post('instanceValue');
    boundsValue.instance.set(boundsInstance);
    boundsSlot.values.add(boundsValue);
    shapeInstance.slots.add(boundsSlot);
    
    // set up x
    const xSlot = umlWebClient.post('slot');
    xSlot.definingFeature.set(BOUNDS_X_SLOT_ID);
    boundsInstance.slots.add(xSlot);
    const xValue = umlWebClient.post('literalInt');
    xValue.value = shape.x;
    xSlot.values.add(xValue);

    // set up y
    const ySlot = umlWebClient.post('slot');
    ySlot.definingFeature.set(BOUNDS_Y_SLOT_ID);
    boundsInstance.slots.add(ySlot);
    const yValue = umlWebClient.post('literalInt');
    yValue.value = shape.y;
    ySlot.values.add(yValue);

    // set up width
    const widthValue = umlWebClient.post('literalInt');
    widthValue.value = shape.width;
    const widthSlot = umlWebClient.post('slot');
    widthSlot.definingFeature.set(BOUNDS_WIDTH_SLOT_ID);
    widthSlot.values.add(widthValue);
    boundsInstance.slots.add(widthSlot);

    // set up height
    const heightValue = umlWebClient.post('literalInt');
    heightValue.value = shape.height;
    const heightSlot = umlWebClient.post('slot');
    heightSlot.definingFeature.set(BOUNDS_HEIGHT_SLOT_ID);
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

export async function fillOutShapeFeatures(shape, shapeSlot, umlClient) {
    // fill out bounds
       if (shapeSlot.definingFeature.id() === SHAPE_BOUNDS_SLOT_ID) {
           // this is the bounds
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
                if (boundsSlot.definingFeature.id() === BOUNDS_X_SLOT_ID) {
                    // x value
                    shape.bounds.x = (await boundsSlot.values.front()).value;
                } else if (boundsSlot.definingFeature.id() === BOUNDS_Y_SLOT_ID) {
                    // y value
                    shape.bounds.y = (await boundsSlot.values.front()).value;
                } else if (boundsSlot.definingFeature.id() === BOUNDS_WIDTH_SLOT_ID) {
                    // width value
                    shape.bounds.width = (await boundsSlot.values.front()).value;
                } else if (boundsSlot.definingFeature.id() === BOUNDS_HEIGHT_SLOT_ID) {
                    // height value
                    shape.bounds.height = (await boundsSlot.values.front()).value;
                } 
            }
       } else {
           await fillOutDiagramElementFeatures(shape, shapeSlot, umlClient);
       }
}
