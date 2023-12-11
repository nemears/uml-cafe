export async function makeUMLWaypoints(relationship, umlWebClient, waypointsSlot, diagram) {
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
        diagram.packagedElements.add(pointInstance);
        await umlWebClient.put(xSlot);
        await umlWebClient.put(ySlot);
        await umlWebClient.put(xValue);
        await umlWebClient.put(yValue);
        await umlWebClient.put(pointValue);
        await umlWebClient.put(pointInstance);
    }
    await umlWebClient.put(waypointsSlot);
}

export async function createEdge(relationship, umlWebClient, diagramContext) {
    // edge
    const edgeInstance = await umlWebClient.post('instanceSpecification', {id: relationship.id});
    edgeInstance.classifiers.add('u2fIGW2nEDfMfVxqDvSmPd5e_wNR');

    // source
    const sourceSlot = await umlWebClient.post('slot');
    sourceSlot.definingFeature.set('Xxh7mjF9IMK0rhyrbSXOGA1_7vVo');
    const sourceValue = await umlWebClient.post('instanceValue');
    sourceValue.instance.set(await umlWebClient.get(relationship.source.id));
    sourceSlot.values.add(sourceValue);
    edgeInstance.slots.add(sourceSlot);

    // target
    const targetSlot = await umlWebClient.post('slot')
    targetSlot.definingFeature.set('R2flL_8p_&Zc7HP07QfAyUI7EtCg');
    const targetValue = await umlWebClient.post('instanceValue');
    targetValue.instance.set(await umlWebClient.get(relationship.target.id));
    targetSlot.values.add(targetValue);
    edgeInstance.slots.add(targetSlot);

    // model element
    // TODO do this with more detail, rn we are just making element and ID
    const modelElementInstance = await umlWebClient.post('instanceSpecification');
    const modelElementSlot = await umlWebClient.post('slot');
    const modelElementValue = await umlWebClient.post('instanceValue');
    const idSlot = await umlWebClient.post('slot');
    const idVal = await umlWebClient.post('literalString');
    modelElementInstance.classifiers.add(await umlWebClient.get('XI35viryLd5YduwnSbWpxSs3npcu'));
    idVal.value = relationship.modelElement.id;
    idSlot.definingFeature.set(await umlWebClient.get('3gx55nLEvmzDt2kKK7gYgxsTBD6M'));
    idSlot.values.add(idVal);
    modelElementInstance.slots.add(idSlot);
    modelElementValue.instance.set(modelElementInstance);
    modelElementSlot.values.add(modelElementValue);
    modelElementSlot.definingFeature.set(await umlWebClient.get('xnI9Aiz3GaF91K8H7KAPe95oDgyE'));
    edgeInstance.slots.add(modelElementSlot);
    diagramContext.diagram.packagedElements.add(modelElementInstance);

    // waypoints
    const waypointsSlot = await umlWebClient.post('slot');
    waypointsSlot.definingFeature.set('Zf2K&k0k&jwaAz1GLsTSk7rN742p');
    edgeInstance.slots.add(waypointsSlot);
    await makeUMLWaypoints(relationship, umlWebClient, waypointsSlot, diagramContext.diagram);
    diagramContext.diagram.packagedElements.add(edgeInstance);
    await umlWebClient.put(sourceSlot);
    await umlWebClient.put(sourceValue);
    await umlWebClient.put(targetSlot);
    await umlWebClient.put(targetValue);
    await umlWebClient.put(modelElementInstance );
    await umlWebClient.put(modelElementSlot);
    await umlWebClient.put(modelElementValue);
    await umlWebClient.put(idSlot);
    await umlWebClient.put(idVal);
    await umlWebClient.put(diagramContext.diagram);
    await umlWebClient.put(edgeInstance);

    return edgeInstance;
}
