import { randomID } from "../../umlUtil";
import { isObject } from 'min-dash';

import {
    getMid
  } from 'diagram-js/lib/layout/LayoutUtil';
import { getLine } from "../UMLRenderer";

export default class Relationship {
    constructor(eventName, eventBus, dragging, canvas, elementFactory) {
        this.eventName = eventName;
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
                umlType: eventName
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
}