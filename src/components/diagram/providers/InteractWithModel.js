import { makeUMLWaypoints } from './relationships/Relationship'

export async function createClassShape(shape, umlWebClient, diagramContext) {
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
    // TODO do this with more detail, rn we are just making element and ID
    const modelElementInstance = await umlWebClient.post('instanceSpecification');
    const modelElementSlot = await umlWebClient.post('slot');
    const modelElementValue = await umlWebClient.post('instanceValue');
    const idSlot = await umlWebClient.post('slot');
    const idVal = await umlWebClient.post('literalString');
    modelElementInstance.classifiers.add(await umlWebClient.get('XI35viryLd5YduwnSbWpxSs3npcu'));
    idVal.value = shape.elementID;
    idSlot.definingFeature.set(await umlWebClient.get('3gx55nLEvmzDt2kKK7gYgxsTBD6M'));
    idSlot.values.add(idVal);
    modelElementInstance.slots.add(idSlot);
    modelElementValue.instance.set(modelElementInstance);
    modelElementSlot.values.add(modelElementValue);
    modelElementSlot.definingFeature.set(await umlWebClient.get('xnI9Aiz3GaF91K8H7KAPe95oDgyE'));
    shapeInstance.slots.add(modelElementSlot);
    diagramContext.diagram.packagedElements.add(modelElementInstance);

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
    umlWebClient.put(modelElementInstance);
    umlWebClient.put(modelElementSlot);
    umlWebClient.put(modelElementValue);
    umlWebClient.put(idSlot);
    umlWebClient.put(idVal);
    umlWebClient.put(diagramContext.diagram);

    // put shape last so that data is complete on updating diagram
    umlWebClient.put(shapeInstance);
}

export default function InteractWithModel(eventBus, umlWebClient, diagramEmitter, diagramContext, elementRegistry, modeling) {

    const asyncCreateShape = async (event) => {
        if (event.element.update) {
            // this means that the shape was created in response to an update from the backend
            // we do not have to make any new class or shape because it was not created by a user
            return;
        }

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

    eventBus.on('shape.remove', (event) => {
        const run = async () => {
            if (!event.element.deletedFromModel && !event.element.classLabel) {
                const shapeEl = await umlWebClient.get(event.element.id);
                if (shapeEl) {
                    umlWebClient.deleteElement(shapeEl);
                    umlWebClient.put(diagramContext.diagram);
                }
            }
        };
        run();
    });

    const adjustShape = async (event, shapeInstance) => {
        let boundsInstance = undefined;
        for await (let slot of shapeInstance.slots) {
            if (slot.definingFeature.id() === 'KbKmDNU19SWMJwggKTQ9FrzAzozO') {
                boundsInstance = await (await slot.values.front()).instance.get();
                break;
            }
        }
        for await (let slot of boundsInstance.slots) {
            if (slot.definingFeature.id() === 'OaYzOYryv5lrW2YYkujnjL02rSlo') {
                const value = await slot.values.front();
                value.value = event.shape.x;
                umlWebClient.put(value);
            } else if (slot.definingFeature.id() === 'RhD_fTVUMc4ceJ4topOlpaFPpoiB') {
                const value = await slot.values.front();
                value.value = event.shape.y;
                umlWebClient.put(value);
            } else if (slot.definingFeature.id() === '&TCEXx1uZQsa7g1KPT9ocVwNiwV7') {
                const value = await slot.values.front();
                value.value = event.shape.width;
                umlWebClient.put(value);
            } else if (slot.definingFeature.id() === 'ELF54xP3DUMrFbgteAQkIXONqnlg') {
                const value = await slot.values.front();
                value.value = event.shape.height;
                umlWebClient.put(value);
            }
        }
        umlWebClient.put(boundsInstance);
        umlWebClient.put(shapeInstance);
    }

    const adjustEdgeWaypoints = async (edge) => {
        const edgeInstance = await umlWebClient.get(edge.id);
        for await (const edgeSlot of edgeInstance.slots) {
            if (edgeSlot.definingFeature.id() === 'Zf2K&k0k&jwaAz1GLsTSk7rN742p') {
                let waypointValues = [];
                for await (const waypointValue of edgeSlot.values) {
                    umlWebClient.deleteElement(await waypointValue.instance.get());
                    waypointValues.push(waypointValue);
                }
                for (const waypointValue of waypointValues) {
                    edgeSlot.values.remove(waypointValue);
                    umlWebClient.deleteElement(waypointValue);
                }
                await makeUMLWaypoints(edge, umlWebClient, edgeSlot, await edgeInstance.owningPackage.get());
            }
        }
        umlWebClient.put(edgeInstance);
    };

    const adjustListOfEdges = async (listOfEdges) => {
        for (const edge of listOfEdges) {
            await adjustEdgeWaypoints(edge); 
        } 
    }

    const adjustAttachedEdges = async (shape) => {
        await adjustListOfEdges(shape.incoming);
        await adjustListOfEdges(shape.outgoing); 
    }

    eventBus.on('shape.move.end', async (event) => {
        // get point instance
        const shapeInstance = await umlWebClient.get(event.shape.id);
        adjustShape(event, shapeInstance);
        adjustAttachedEdges(event.shape);
        umlWebClient.put(diagramContext.diagram);
    });

    eventBus.on('resize.end', async (event) => {
        const shapeInstance = await umlWebClient.get(event.shape.id);
        adjustShape(event, shapeInstance);
        adjustAttachedEdges(event.shape);
        umlWebClient.put(diagramContext.diagram);
    });

    eventBus.on('connectionSegment.move.end', async (event) => {
        await adjustEdgeWaypoints(event.connection);
        umlWebClient.put(diagramContext.diagram);
    });

    eventBus.on('bendpoint.move.end', async (event) => {
        await adjustEdgeWaypoints(event.connection);
        umlWebClient.put(diagramContext.diagram);
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
