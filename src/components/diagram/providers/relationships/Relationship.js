import { randomID } from "../../umlUtil";
import { isObject } from 'min-dash';

import { getMid } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout'

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
        await umlWebClient.put(pointInstance);
        await umlWebClient.put(xSlot);
        await umlWebClient.put(ySlot);
        await umlWebClient.put(xValue);
        await umlWebClient.put(yValue);
        await umlWebClient.put(pointValue);
    }
    await umlWebClient.put(waypointsSlot);
    await umlWebClient.put(diagram);
}

export default class Relationship {
    constructor(eventName, eventType, eventBus, dragging, canvas, elementFactory) {
        this.eventName = eventName;
        this.eventType = eventType;
        this.dragging = dragging;
        
        this.type = 'orthogonal'; // can be orthogonal, direct, more in the future

        eventBus.on(`${eventName}.hover`, (event) => {
            // based off of diagram-js/lib/features/connect
            var context = event.context;

            if (context.hover && event.hover !== context.hover) {
                canvas.removeMarker(context.hover, 'connect-ok');
            }

            context.hover = event.hover;

            // check if it can connect
            if (!this.canConnect(context)) {
                // can't connect
                return;
            }

            // highlight shape
            canvas.addMarker(context.hover, 'connect-ok');

            // set source and target
            context.source = event.context.start;
            context.target = event.hover;
        });

        const getWayPoints = (relationship) => {
            var waypoints = [];
            if (this.type === 'orthogonal') {
                waypoints = connectRectangles(relationship.source, relationship.target, getMid(relationship.source), getMid(relationship.target));
            } else if (this.type === 'direct') {
                const line = getDirectLine(relationship.source, relationship.target);
                waypoints.push(line.source);
                waypoints.push(line.target);
            } else {
                throw new Error('invalid type for relationship provider ' + this.type );
            }
            return waypoints; 
        };

        eventBus.on(`${eventName}.end`, (event) => {
            // check if it can connect
            if (!this.canConnect(event.context)) {
                return;
            }
            
            var relationship = elementFactory.createConnection({
                waypoints: getWayPoints(event.context),
                id: randomID(),
                elementID: randomID(),
                source: event.context.source,
                target: event.context.target,
                umlType: eventType
            });
            //event.context.target.incoming.push(relationship);
            //event.context.source.outgoing.push(relationship);
            canvas.addConnection(relationship, canvas.getRootElement());
            event.context.relationship = relationship;
            canvas.removeMarker(event.context.hover, 'connect-ok');

            /*if (!event.context.source.outgoing) {
                event.context.source.outgoing = [];
            }
            event.context.source.outgoing.push(relationship);
            if (!event.context.target.incoming) {
                event.context.target.incoming = [];
            }
            event.context.target.incoming.push(relationship);*/
        });
    }

    canConnect(context) {
        return context.hover.umlType;
    }

    start(event, start, connectionStart, autoActivate) {
        if (!isObject(connectionStart)) {
            autoActivate = connectionStart;
            connectionStart = getMid(start);
        }
      
        this.dragging.init(event, this.eventName, {
            autoActivate: autoActivate,
            data: {
                shape: start,
                context: {
                    start: start,
                    connectionStart: connectionStart
                }
            }
        });
    }

    async createEdge(event, umlWebClient, diagramContext) {
        // edge
        const edgeInstance = await umlWebClient.post('instanceSpecification', {id: event.context.relationship.id});
        edgeInstance.classifiers.add('u2fIGW2nEDfMfVxqDvSmPd5e_wNR');

        // source
        const sourceSlot = await umlWebClient.post('slot');
        sourceSlot.definingFeature.set('Xxh7mjF9IMK0rhyrbSXOGA1_7vVo');
        const sourceValue = await umlWebClient.post('instanceValue');
        sourceValue.instance.set(await umlWebClient.get(event.context.relationship.source.id));
        sourceSlot.values.add(sourceValue);
        edgeInstance.slots.add(sourceSlot);

        // target
        const targetSlot = await umlWebClient.post('slot')
        targetSlot.definingFeature.set('R2flL_8p_&Zc7HP07QfAyUI7EtCg');
        const targetValue = await umlWebClient.post('instanceValue');
        targetValue.instance.set(await umlWebClient.get(event.context.relationship.target.id));
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
        idVal.value = event.context.relationship.elementID;
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
        await makeUMLWaypoints(event.context.relationship, umlWebClient, waypointsSlot, diagramContext.diagram);
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
}
