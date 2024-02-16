export function makeUMLWaypoints(relationship, umlWebClient, waypointsSlot, diagramContext) {
    for (const point of relationship.waypoints) {
        const pointInstance = umlWebClient.post('instanceSpecification');
        pointInstance.classifiers.add('iJOykGQ4z9anpcPG_cawroBzlZPL');
        const xSlot = umlWebClient.post('slot');
        xSlot.definingFeature.set('0TTKoNWbe13DJ3ou_1KhyS9sE1iU');
        pointInstance.slots.add(xSlot);
        const xValue = umlWebClient.post('literalReal');
        xValue.value = point.x;
        xSlot.values.add(xValue);
        const ySlot = umlWebClient.post('slot');
        ySlot.definingFeature.set('wecoFZpGF2kLOJ0sBneePO3nB47z');
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


