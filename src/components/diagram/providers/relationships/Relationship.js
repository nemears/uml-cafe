import { randomID } from "../../umlUtil";
import { isObject } from 'min-dash';

import { getMid } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout'

export function getDirectLine(source, target) {
    const sourceMidX = source.x + (source.width / 2);
    const sourceMidY = source.y + (source.height / 2);
    const targetMidX = target.x + (target.width / 2);
    const targetMidY = target.y + (target.height / 2);
    const dx = targetMidX - sourceMidX;
    const dy = targetMidY - sourceMidY;
    const lineTanTheta = dy/dx;
    const targetTanTheta = target.height / target.width;
    const sourceTanTheta = source.height / source.width;
    let waypoints = [];
    let ret = {
        target: {},
        source: {}
    };

    // target
    const targetDetermineRightOrLeft = () => {
        if (dx < 0) {
            // right
            ret.target.x = target.x + target.width;
            ret.target.y = target.y + (target.height / 2) + ((target.width * dy) / (2 * dx));
        } else {
            // left
            ret.target.x = target.x;
            ret.target.y = target.y + (target.height / 2) - ((target.width * dy) / (2 * dx));
        }
    };
    if (dy < 0) {
        if (Math.abs(lineTanTheta) > Math.abs(targetTanTheta)) {
            // below
            ret.target.y = target.y + target.height;
            ret.target.x = target.x + (target.width / 2) + ((target.height * dx) / (2 * dy));
        } else {
            targetDetermineRightOrLeft();
        }
    } else {
        if (Math.abs(lineTanTheta) > Math.abs(targetTanTheta)) {
            ret.target.y = target.y;
            ret.target.x = target.x + (target.width / 2) - ((target.height * dx) / (2 * dy));
        } else {
            targetDetermineRightOrLeft();
        }
    }

    // source
    const sourceDetermineRightOrLeft = () => {
        if (dx > 0) {
            // right
            ret.source.x = source.x + source.width;
            ret.source.y = source.y + (source.height / 2) + ((source.width * dy) / (2 * dx));
        } else {
            // left
            ret.source.x = source.x;
            ret.source.y = source.y + (source.height / 2) - ((source.width * dy) / (2 * dx));
        }
    };
    if (dy > 0) {
        if (Math.abs(lineTanTheta) > Math.abs(sourceTanTheta)) {
            // below
            ret.source.y = source.y + source.height;
            ret.source.x = source.x + (source.width / 2) + ((source.height * dx) / (2 * dy));
        } else {
            sourceDetermineRightOrLeft();
        }
    } else {
        if (Math.abs(lineTanTheta) > Math.abs(sourceTanTheta)) {
            ret.source.y = source.y;
            ret.source.x = source.x + (source.width / 2) - ((source.height * dx) / (2 * dy));
        } else {
            sourceDetermineRightOrLeft();
        }
    }
    waypoints.push(ret.source);
    waypoints.push(ret.target);
    return waypoints;
}

export function getOrthogonalLine(source, target) {
    const waypoints = [];
    const sourceCenterX = source.x + (target.width / 2);
    const sourceCenterY = source.y + (source.height / 2);
    const targetCenterX = target.x + (target.width / 2);
    const targetCenterY = target.y + (target.height / 2);
    
    if ((sourceCenterX - targetCenterX) > (sourceCenterY - targetCenterY)) {
        // bigger change in x than y, put it on the side of the blocks

        if (sourceCenterX > targetCenterX) {
            // source is to right of target
            waypoints.push({x: source.x, y: sourceCenterY});
            const inbetweenX = target.x + target.width + (source.x - target.x - target.width) / 2;
            waypoints.push({x: inbetweenX, y: sourceCenterY});
            waypoints.push({x: inbetweenX, y: targetCenterY});
            waypoints.push({x: target + target.width, y: targetCenterY});
        } else if (sourceCenterX < targetCenterX) {
            // source is to left of target
            waypoints.push({x: source.x + source.width, y: sourceCenterY});
            const inbetweenX = source.x + source.width + (target.x - source.x)/ 2;
            waypoints.push({x: inbetweenX, y: sourceCenterY});
            waypoints.push({x: inbetweenX, y: targetCenterY});
            waypoints.push({x: target.x, y: targetCenterY});
        } else {
            // this should not be able to get here dead code
            throw new Error('hit deadcode somehow, please report!');
        }
    } else {
        // bigger or equal change in y than x
        if (sourceCenterY > targetCenterY) {
            // source is below target
            waypoints.push({x: sourceCenterX, y: source.y});
            const inbetweenY = target.y + target.height + (source.y - target.y -target.height) / 2;
            waypoints.push({x: sourceCenterX, y: inbetweenY});
            waypoints.push({x: targetCenterX, y: inbetweenY});
            waypoints.push({x: targetCenterX, y: target.y + target.height});
        } else if (sourceCenterY < targetCenterY) {
            // source is above target
            waypoints.push({x: sourceCenterX, y: source.y + source.height});
            const inbetweenY = source.y + source.height + (target.y - source.y - source.height) / 2;
            waypoints.push({x: sourceCenterX, y: inbetweenY});
            waypoints.push({x: targetCenterX, y: inbetweenY});
            waypoints.push({x: targetCenterX, y: target.y});
        } else {
            throw new Error("TODO edge case");
        }
    }
    return waypoints;
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
