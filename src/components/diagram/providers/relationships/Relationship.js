import { randomID } from "../../umlUtil";
import { isObject } from 'min-dash';

import { getMid } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout'

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
                shapeID: randomID(),
                elementID: randomID(),
                source: event.context.source,
                target: event.context.target,
                umlType: eventType
            });
            canvas.addConnection(relationship, canvas.getRootElement());
            event.context.relationship = relationship;
            canvas.removeMarker(event.context.hover, 'connect-ok');
            if (!event.context.source.outgoing) {
                event.context.source.outgoing = [];
            }
            event.context.source.outgoing.push(relationship);
            if (!event.context.target.incoming) {
                event.context.target.incoming = [];
            }
            event.context.target.incoming.push(relationship);
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

    async createPath(event, umlWebClient, diagramContext) {
        const pathInstance = await umlWebClient.post('instanceSpecification');
        pathInstance.classifiers.add('NKE5JxXD2Cp82Gw0CzsnlgtanuSp');
        const sourceSlot = await umlWebClient.post('slot');
        sourceSlot.definingFeature.set('nW89s4ZaRhGlrwbri3wIQ6AG5PcY');
        const sourceValue = await umlWebClient.post('instanceValue');
        sourceValue.instance.set(event.context.relationship.source.shapeID);
        sourceSlot.values.add(sourceValue);
        pathInstance.slots.add(sourceSlot);
        const targetSlot = await umlWebClient.post('slot')
        targetSlot.definingFeature.set('KrQkyKfJLEoLHucoJlsUn&06GdTi');
        const targetValue = await umlWebClient.post('instanceValue');
        targetValue.instance.set(event.context.relationship.target.shapeID);
        targetSlot.values.add(targetValue);
        pathInstance.slots.add(targetSlot);
        const elementIDSlot = await umlWebClient.post('slot');
        elementIDSlot.definingFeature.set('5aQ4hcDk32eSc3R&84uIyACddmu0');
        const elementIDValue = await umlWebClient.post('literalString');
        elementIDValue.value = event.context.relationship.elementID;
        elementIDSlot.values.add(elementIDValue);
        pathInstance.slots.add(elementIDSlot);
        diagramContext.diagram.packagedElements.add(pathInstance);

        // waypoints
        const waypointsSlot = await umlWebClient.post('slot');
        waypointsSlot.definingFeature.set('JZd_DbxP5H2otheX0ucXKgeGxB3b');
        pathInstance.slots.add(waypointsSlot);
        for (const point of event.context.relationship.waypoints) {
            const pointInstance = await umlWebClient.post('instanceSpecification');
            pointInstance.classifiers.add('Wd18iwR4ijeaG7WrKZJX966ySqPg');
            const xSlot = await umlWebClient.post('slot');
            xSlot.definingFeature.set('TL9YRNP&uSq5O&ZX0BNUqSl3uHTO');
            pointInstance.slots.add(xSlot);
            const xValue = await umlWebClient.post('literalReal');
            xValue.value = point.x;
            xSlot.values.add(xValue);
            const ySlot = await umlWebClient.post('slot');
            ySlot.definingFeature.set('WQEwSh2OYmb1Yj2Hu5Fdk_S6qFP5');
            pointInstance.slots.add(ySlot);
            const yValue = await umlWebClient.post('literalReal');
            yValue.value = point.y;
            ySlot.values.add(yValue);
            const pointValue = await umlWebClient.post('instanceValue');
            pointValue.instance.set(pointInstance);
            waypointsSlot.values.add(pointValue);
            diagramContext.diagram.packagedElements.add(pointInstance);
        }

        umlWebClient.put(diagramContext.diagram);
        umlWebClient.put(pathInstance);
        umlWebClient.put(sourceSlot);
        umlWebClient.put(sourceValue);
        umlWebClient.put(targetSlot);
        umlWebClient.put(targetValue);
        umlWebClient.put(elementIDValue);
        umlWebClient.put(elementIDSlot);
        umlWebClient.put(waypointsSlot);
        for await (const val of waypointsSlot.values) {
            umlWebClient.put(val);
            const pointInstance = await val.instance.get();
            umlWebClient.put(pointInstance);
            for await (const slot of pointInstance.slots) {
                umlWebClient.put(slot);
                umlWebClient.put(await slot.values.front());
            }
        }

        return pathInstance;
    }
}
