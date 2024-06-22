import { DiagramElement, createDiagramElementFeatures, fillOutDiagramElementFeatures } from './diagramElement';
import { POINT_ID, POINT_X_SLOT_ID, POINT_Y_SLOT_ID, Point } from '../diagramCommon';
import { EDGE_ID, EDGE_SOURCE_SLOT_ID, EDGE_TARGET_SLOT_ID, EDGE_WAYPOINTS_SLOT_ID } from './ids';

export class Edge extends DiagramElement {
    source = '';
    target = '';
    waypoints = [];
    elementType() {
        return 'edge'
    }
}

export async function createDiagramEdge(relationship, umlWebClient, diagramContext) {
    const edgeInstance = umlWebClient.post('instanceSpecification', {id: relationship.id});
    edgeInstance.classifiers.add(EDGE_ID);

    // source
    const sourceSlot = umlWebClient.post('slot');
    sourceSlot.definingFeature.set(EDGE_SOURCE_SLOT_ID);
    const sourceValue = umlWebClient.post('instanceValue');
    sourceValue.instance.set(relationship.source.id);
    sourceSlot.values.add(sourceValue);
    edgeInstance.slots.add(sourceSlot);

    // target
    const targetSlot = umlWebClient.post('slot')
    targetSlot.definingFeature.set(EDGE_TARGET_SLOT_ID);
    const targetValue = umlWebClient.post('instanceValue');
    targetValue.instance.set(relationship.target.id);
    targetSlot.values.add(targetValue);
    edgeInstance.slots.add(targetSlot);
    
    // waypoints
    const waypointsSlot = umlWebClient.post('slot');
    waypointsSlot.definingFeature.set(EDGE_WAYPOINTS_SLOT_ID);
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

export function makeUMLWaypoints(relationship, umlWebClient, waypointsSlot, diagramContext) {
    for (const point of relationship.waypoints) {
        const pointInstance = umlWebClient.post('instanceSpecification');
        pointInstance.classifiers.add(POINT_ID);
        const xSlot = umlWebClient.post('slot');
        xSlot.definingFeature.set(POINT_X_SLOT_ID);
        pointInstance.slots.add(xSlot);
        const xValue = umlWebClient.post('literalReal');
        xValue.value = point.x;
        xSlot.values.add(xValue);
        const ySlot = umlWebClient.post('slot');
        ySlot.definingFeature.set(POINT_Y_SLOT_ID);
        pointInstance.slots.add(ySlot);
        const yValue = umlWebClient.post('literalReal');
        yValue.value = point.y;
        ySlot.values.add(yValue);
        const pointValue = umlWebClient.post('instanceValue');
        pointValue.instance.set(pointInstance);
        waypointsSlot.values.add(pointValue);
        diagramContext.diagram.packagedElements.add(pointInstance);
        umlWebClient.put(xSlot);
        umlWebClient.put(ySlot);
        umlWebClient.put(xValue);
        umlWebClient.put(yValue);
        umlWebClient.put(pointValue);
        umlWebClient.put(pointInstance);
    }
    umlWebClient.put(waypointsSlot);    
}

export async function fillOutEdgeFeatures(edge, edgeSlot, umlClient) {
    if (edgeSlot.definingFeature.id() === EDGE_WAYPOINTS_SLOT_ID) {
        // waypoints
        for await (const waypointValue of edgeSlot.values) {
            const point = new Point();
            for await (const pointSlot of (await waypointValue.instance.get()).slots) {
                if (pointSlot.definingFeature.id() === POINT_X_SLOT_ID) {
                    point.x = (await pointSlot.values.front()).value;
                } else if (pointSlot.definingFeature.id() === POINT_Y_SLOT_ID) {
                    point.y = (await pointSlot.values.front()).value;
                }
            }
            edge.waypoints.push(point);
        }
    } else if (edgeSlot.definingFeature.id() === EDGE_SOURCE_SLOT_ID) {
        // source
        // just setting to id for now?
        edge.source = (await edgeSlot.values.front()).instance.id();
    } else if (edgeSlot.definingFeature.id() === EDGE_TARGET_SLOT_ID) {
        // target
        // just setting to id for now
        edge.target = (await edgeSlot.values.front()).instance.id();
    } else {
        await fillOutDiagramElementFeatures(edgeSlot, edge, umlClient);
    }
}
