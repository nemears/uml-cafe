export async function makeUMLWaypoints(relationship, umlWebClient, waypointsSlot, diagramContext) {
    for (const point of relationship.waypoints) {
        const pointInstance = await umlWebClient.post('instanceSpecification');
        pointInstance.classifiers.add('iJOykGQ4z9anpcPG_cawroBzlZPL');
        const xSlot = await umlWebClient.post('slot');
        xSlot.definingFeature.set('0TTKoNWbe13DJ3ou_1KhyS9sE1iU');
        pointInstance.slots.add(xSlot);
        const xValue = await umlWebClient.post('literalReal');
        xValue.value = point.x;
        xSlot.values.add(xValue);
        const ySlot = await umlWebClient.post('slot');
        ySlot.definingFeature.set('wecoFZpGF2kLOJ0sBneePO3nB47z');
        pointInstance.slots.add(ySlot);
        const yValue = await umlWebClient.post('literalReal');
        yValue.value = point.y;
        ySlot.values.add(yValue);
        const pointValue = await umlWebClient.post('instanceValue');
        pointValue.instance.set(pointInstance);
        waypointsSlot.values.add(pointValue);
        diagramContext.diagram.packagedElements.add(pointInstance);
        await umlWebClient.put(xSlot);
        await umlWebClient.put(ySlot);
        await umlWebClient.put(xValue);
        await umlWebClient.put(yValue);
        await umlWebClient.put(pointValue);
        await umlWebClient.put(pointInstance);
    }
    await umlWebClient.put(waypointsSlot);    
}


