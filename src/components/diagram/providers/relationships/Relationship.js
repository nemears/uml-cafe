import { randomID } from "../../umlUtil";
import { isObject } from 'min-dash';

import {
    getMid
  } from 'diagram-js/lib/layout/LayoutUtil';
import { getLine } from "../UMLRenderer";

export default class Relationship {
    constructor(eventName, eventType, eventBus, dragging, canvas, elementFactory) {
        this.eventName = eventName;
        this.eventType = eventType;
        this.dragging = dragging;

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

        eventBus.on(`${eventName}.end`, (event) => {
            // check if it can connect
            if (!this.canConnect(event.context)) {
                return;
            }

            const line = getLine(event.context.source, event.context.target);
            var relationship = elementFactory.createConnection({
                waypoints: [
                    line.source,
                    line.target
                ],
                shapeID: randomID(),
                elementID: randomID(),
                source: event.context.source,
                target: event.context.target,
                umlType: eventType
            });
            canvas.addConnection(relationship, canvas.getRootElement());
            event.context.relationship = relationship;
            canvas.removeMarker(event.context.hover, 'connect-ok');
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

        // TODO waypoints maybe?

        umlWebClient.put(diagramContext.diagram);
        umlWebClient.put(pathInstance);
        umlWebClient.put(sourceSlot);
        umlWebClient.put(sourceValue);
        umlWebClient.put(targetSlot);
        umlWebClient.put(targetValue);
        umlWebClient.put(elementIDValue);
        umlWebClient.put(elementIDSlot);

        return pathInstance;
    }
}