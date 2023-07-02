import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import {
    append as svgAppend,
    attr as svgAttr,
    create as svgCreate
} from 'tiny-svg';
import { createLine } from 'diagram-js/lib/util/RenderUtil';
import { assign } from 'min-dash';
import TextUtil from 'diagram-js/lib/util/Text';

export function createArrow(line) {
    var xx, xx1, xx2 = undefined;
    var yx, yx1, yx2 = undefined;

    xx = line[1].x;
    yx = line[1].y;

    const dx = line[0].x - line[1].x;
    const dy = line[0].y - line[1].y;
    const tanThetaC = dy/dx;

    // tip of arrow
    if (dx >= 0) {
        xx1 = xx + (20 * Math.cos(Math.atan(tanThetaC) + 0.5));
        xx2 = xx + (20 * Math.cos(Math.atan(tanThetaC) - 0.5));
        yx1 = yx + (20 * Math.sin(Math.atan(tanThetaC) + 0.5));
        yx2 = yx + (20 * Math.sin(Math.atan(tanThetaC) - 0.5));
    } else {
        xx1 = xx + (20 * Math.cos(Math.PI + Math.atan(tanThetaC) + 0.5));
        xx2 = xx + (20 * Math.cos(Math.PI + Math.atan(tanThetaC) - 0.5));
        yx1 = yx + (20 * Math.sin(Math.PI + Math.atan(tanThetaC) + 0.5));
        yx2 = yx + (20 * Math.sin(Math.PI + Math.atan(tanThetaC) - 0.5));
    }
    return [
        {
            x: xx,
            y: yx
        },
        {
            x: xx1,
            y: yx1
        },
        {
            x: xx2,
            y: yx2
        }
    ];
}

export default class UMLRenderer extends BaseRenderer {
    constructor(eventBus) {
        super(eventBus);
        this.CONNECTION_STYLE = { fill: 'none', strokeWidth: 2, stroke: 'var(--vt-c-black)' };
        this.LABEL_STYLE = { fill: 'none', stroke: 'var(--vt-c-black)', strokeWidth: 0 };
        this.textUtil = new TextUtil({
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fontWeight: 'normal'
            }
        });
        this.connectionLayout = 'orthogonal';
    }

    canRender(element) {
        return element.classLabel || element.umlType && (element.umlType === 'generalization' || element.umlType === 'association');
    }

    drawConnection(gfx, element, attrs) {
        if (element.umlType === 'generalization') {
            const arrow = createArrow(element.waypoints.slice(-2));

            var line = createLine(element.waypoints.slice(0,-1).concat([   
                {
                    x: (arrow[1].x + arrow[2].x) / 2,
                    y: (arrow[1].y + arrow[2].y) / 2
                }
            ]), assign({}, this.CONNECTION_STYLE, attrs || {}));
            
            var tip = createLine([
                {
                    x: arrow[0].x,
                    y: arrow[0].y
                },
                {
                    x: arrow[1].x,
                    y: arrow[1].y
                },
                {
                    x: arrow[2].x,
                    y: arrow[2].y
                },
                {
                    x: arrow[0].x,
                    y: arrow[0].y
                }
            ], assign({}, this.CONNECTION_STYLE, attrs || {}));
            var group = svgCreate('g');
            svgAppend(group,tip);
            svgAppend(group, line);
            svgAppend(gfx, group);
            return group;
        } else if (element.umlType === 'association') {
            // todo, segmented line
            const arrow = createArrow(element.waypoints.slice(-2));
            var line = createLine(element.waypoints.slice(0,-1).concat([
                {
                    x: (arrow[1].x + arrow[2].x) / 2,
                    y: (arrow[1].y + arrow[2].y) / 2
                }
            ]), assign({}, this.CONNECTION_STYLE, attrs || {}));
            var arrowTipPath = svgCreate('polyline');
            svgAttr(arrowTipPath, {
                style: 'fill:var(--vt-c-black);stroke:var(--vt-c-black);',
                points: `${arrow[0].x},${arrow[0].y} ${arrow[1].x},${arrow[1].y} ${arrow[2].x},${arrow[2].y}`
            });

            // create diamond at end
            const dx = element.waypoints[1].x - element.waypoints[0].x;
            const dy = element.waypoints[1].y - element.waypoints[0].y;
            const tan = dy/dx;
            const theta = Math.atan(tan);

            var diamond = svgCreate('polyline');
            const diamondLen = 15;
            const xMod = dx < 0 ? 0 : Math.PI;
            const points = [
                {
                    x: element.waypoints[0].x,
                    y: element.waypoints[0].y
                },
                {
                    x: element.waypoints[0].x - (diamondLen * Math.cos(xMod + theta + (Math.PI / 4))),
                    y: element.waypoints[0].y - (diamondLen * Math.sin(xMod + theta + (Math.PI / 4)))
                },
                {
                    x: element.waypoints[0].x - (Math.sqrt((diamondLen * diamondLen) + (diamondLen * diamondLen)) * Math.cos(xMod + theta)),
                    y: element.waypoints[0].y - (Math.sqrt((diamondLen * diamondLen) + (diamondLen * diamondLen)) * Math.sin(xMod + theta))
                },
                {
                    x: element.waypoints[0].x - (diamondLen * Math.cos(xMod + theta - (Math.PI / 4))),
                    y: element.waypoints[0].y - (diamondLen * Math.sin(xMod + theta - (Math.PI / 4)))
                }
            ];
            svgAttr(diamond, {
                style: 'fill:var(--vt-c-black);stroke:var(--vt-c-black);',
                points: `${points[0].x},${points[0].y} ${points[1].x},${points[1].y} ${points[2].x},${points[2].y} ${points[3].x},${points[3].y}`
            });

            var group = svgCreate('g');
            svgAppend(group, arrowTipPath);
            svgAppend(group, line);
            svgAppend(group, diamond);
            svgAppend(gfx, group);
            return group;
        }
    }

    drawShape(gfx, element, attrs) {
        if (element.classLabel) {
            var rect = svgCreate('rect');

            svgAttr(rect, {
                x: 0,
                y: 0,
                width: element.width || 0,
                height: element.height || 0
            });
            svgAttr(rect, assign({}, this.LABEL_STYLE, attrs || {}));

            var text = this.textUtil.createText(element.labelTarget.name || '', {});

            var group = svgCreate('g');
            svgAppend(group, rect);
            svgAppend(group, text);
            svgAppend(gfx, group);
            return group;
        } else {
            return super.drawShape(gfx, element, attrs);
        }
    }
}

UMLRenderer.$inject = ['eventBus'];
