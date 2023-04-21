export async function createClassShape(shape, umlWebClient, diagramContext) {
    const shapeInstance = await umlWebClient.post('instanceSpecification', {id:shape.shapeID});
    shapeInstance.classifiers.add(await umlWebClient.get('&7qxHqMCh5Cwd3&s053vQD&xPsAK'));
    diagramContext.diagram.packagedElements.add(shapeInstance);
    const pointInstance = await umlWebClient.post('instanceSpecification');
    diagramContext.diagram.packagedElements.add(pointInstance);
    pointInstance.classifiers.add(await umlWebClient.get('Wd18iwR4ijeaG7WrKZJX966ySqPg'));
    const pointSlot = await umlWebClient.post('slot');
    pointSlot.definingFeature.set(await umlWebClient.get('bHizRf2FLBphg0iYSQsXnbn_BJ2c'));
    const pointValue = await umlWebClient.post('instanceValue');
    pointValue.instance.set(pointInstance);
    pointSlot.values.add(pointValue);
    shapeInstance.slots.add(pointSlot);
    const xSlot = await umlWebClient.post('slot');
    xSlot.definingFeature.set(await umlWebClient.get('TL9YRNP&uSq5O&ZX0BNUqSl3uHTO'));
    pointInstance.slots.add(xSlot);
    const xValue = await umlWebClient.post('literalInt');
    xValue.value = shape.x;
    xSlot.values.add(xValue);
    const ySlot = await umlWebClient.post('slot');
    ySlot.definingFeature.set(await umlWebClient.get('WQEwSh2OYmb1Yj2Hu5Fdk_S6qFP5'));
    pointInstance.slots.add(ySlot);
    const yValue = await umlWebClient.post('literalInt');
    yValue.value = shape.y;
    ySlot.values.add(yValue);
    const widthValue = await umlWebClient.post('literalInt');
    widthValue.value = shape.width;
    const widthSlot = await umlWebClient.post('slot');
    widthSlot.definingFeature.set(await umlWebClient.get('MbxzX87yGS4s8kl&FehOVttIWs2q'));
    widthSlot.values.add(widthValue);
    shapeInstance.slots.add(widthSlot);
    const heightValue = await umlWebClient.post('literalInt');
    heightValue.value = shape.height;
    const heightSlot = await umlWebClient.post('slot');
    heightSlot.definingFeature.set(await umlWebClient.get('pmvMVFeRTg6QF87n8ey97MIyopwb'));
    heightSlot.values.add(heightValue);
    shapeInstance.slots.add(heightSlot);
    const elementIdValue = await umlWebClient.post('literalString');
    elementIdValue.value = shape.elementID;
    const elementIdSlot = await umlWebClient.post('slot');
    elementIdSlot.definingFeature.set(await umlWebClient.get('5aQ4hcDk32eSc3R&84uIyACddmu0'));
    elementIdSlot.values.add(elementIdValue);
    shapeInstance.slots.add(elementIdSlot);

    umlWebClient.put(diagramContext.diagram);
    umlWebClient.put(shapeInstance);
    umlWebClient.put(pointSlot);
    umlWebClient.put(pointInstance);
    umlWebClient.put(pointValue);
    umlWebClient.put(xSlot);
    umlWebClient.put(xValue);
    umlWebClient.put(ySlot);
    umlWebClient.put(yValue);
    umlWebClient.put(heightSlot);
    umlWebClient.put(heightValue);
    umlWebClient.put(widthSlot);
    umlWebClient.put(widthValue);
    umlWebClient.put(elementIdSlot);
    umlWebClient.put(elementIdValue);
}

export default function InteractWithModel(eventBus, umlWebClient, diagramEmitter, diagramContext, elementRegistry, modeling) {

    const asyncCreateShape = async (event) => {
        if (!event.element.newUMLElement) {
            if (event.element.newShapeElement) {
                createClassShape(event.element, umlWebClient, diagramContext);
            }
            return;
        }

        // create new uml class
        const classID = event.element.elementID;
        let clazz = await umlWebClient.post('class', {id:classID});
        diagramContext.context.packagedElements.add(clazz);
        umlWebClient.put(clazz);
        umlWebClient.put(diagramContext.context);
        await umlWebClient.get(classID);

        diagramEmitter.fire('shape.added', event);

        // create shape
        createClassShape(event.element, umlWebClient, diagramContext);
    };

    eventBus.on('shape.added',  function(event) {
        asyncCreateShape(event);
    });

    eventBus.on('shape.remove', async (event) => {
        if (!event.element.deletedFromModel && !event.element.classLabel) {
            const shapeEl = await umlWebClient.get(event.element.id);
            if (shapeEl) {
                umlWebClient.deleteElement(shapeEl);
                umlWebClient.put(diagramContext.diagram);
            }
        }
    });

    const adjustPoint = async (event, shapeInstance) => {
        let pointInstance = undefined;
        for await (let slot of shapeInstance.slots) {
            if (slot.definingFeature.id() === 'bHizRf2FLBphg0iYSQsXnbn_BJ2c') {
                pointInstance = await (await slot.values.front()).instance.get();
                break;
            }
        }
        for await (let slot of pointInstance.slots) {
            if (slot.definingFeature.id() === 'TL9YRNP&uSq5O&ZX0BNUqSl3uHTO') {
                const value = await slot.values.front();
                value.value = event.shape.x;
                umlWebClient.put(value);
            } else if (slot.definingFeature.id() === 'WQEwSh2OYmb1Yj2Hu5Fdk_S6qFP5') {
                const value = await slot.values.front();
                value.value = event.shape.y;
                umlWebClient.put(value);
            }
        }
    }

    eventBus.on('shape.move.end', async (event) => {
        // get point instance
        const shapeInstance = await umlWebClient.get(event.shape.shapeID);
        adjustPoint(event, shapeInstance);
    });

    eventBus.on('resize.end', async (event) => {
        const shapeInstance = await umlWebClient.get(event.shape.shapeID);
        adjustPoint(event, shapeInstance);
        for await (let slot of shapeInstance.slots) {
            if (slot.definingFeature.id() === 'MbxzX87yGS4s8kl&FehOVttIWs2q') {
                const value = await slot.values.front();
                value.value = event.shape.width;
                umlWebClient.put(value);
            } else if (slot.definingFeature.id() === 'pmvMVFeRTg6QF87n8ey97MIyopwb') {
                const value = await slot.values.front();
                value.value = event.shape.height;
                umlWebClient.put(value);
            }
        }
    });

    diagramEmitter.on('removeShape', (data) => {
        if (data.shapes) {
            for (const shape of data.shapes) {
                const element = elementRegistry.get(shape);
                element.deletedFromModel = true;
                // if (element) {
                    modeling.removeElements([ element ].concat(element.incoming).concat(element.outgoing));
                // }
            }
        }
    });
}

InteractWithModel.$inject = ['eventBus', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'elementRegistry', 'modeling'];