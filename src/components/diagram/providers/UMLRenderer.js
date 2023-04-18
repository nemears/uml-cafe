import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import {
    append as svgAppend,
    attr as svgAttr,
    create as svgCreate
} from 'tiny-svg';
import { createLine } from 'diagram-js/lib/util/RenderUtil';
import { assign } from 'min-dash';
import TextUtil from 'diagram-js/lib/util/Text';

export function getLine(source, target) {
    const sourceMidX = source.x + (source.width / 2);
    const sourceMidY = source.y + (source.height / 2);
    const targetMidX = target.x + (target.width / 2);
    const targetMidY = target.y + (target.height / 2);
    const dx = targetMidX - sourceMidX;
    const dy = targetMidY - sourceMidY;
    const lineTanTheta = dy/dx;
    const targetTanTheta = target.height / target.width;
    const sourceTanTheta = source.height / source.width;
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

    return ret;
}

export function createArrow(line) {
    var xx, xx1, xx2 = undefined;
    var yx, yx1, yx2 = undefined;

    xx = line.target.x;
    yx = line.target.y;

    const dx = line.source.x - line.target.x;
    const dy = line.source.y - line.target.y;
    const tanThetaC = dy/dx;

    // tip of arrow
    if (dx > 0) {
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
    }

    canRender(element) {
        return element.classLabel || element.umlType && (element.umlType === 'generalization' || element.umlType === 'directedComposition');
    }

    drawConnection(gfx, element, attrs) {
        if (element.umlType === 'generalization') {

            const lineBetweenShapes = getLine(element.source, element.target);

            const arrow = createArrow(lineBetweenShapes);

            var line = createLine([
                lineBetweenShapes.source,
                {
                    x: (arrow[1].x + arrow[2].x) / 2,
                    y: (arrow[1].y + arrow[2].y) / 2
                }
            ], assign({}, this.CONNECTION_STYLE, attrs || {}));
            
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
        } else if (element.umlType === 'directedComposition') {
            // todo, segmented line
            const lineBetweenShapes = getLine(element.source, element.target);
            const arrow = createArrow(lineBetweenShapes);
            var line = createLine([
                lineBetweenShapes.source,
                {
                    x: (arrow[1].x + arrow[2].x) / 2,
                    y: (arrow[1].y + arrow[2].y) / 2
                }
            ], assign({}, this.CONNECTION_STYLE, attrs || {}));
            var arrowTipPath = svgCreate('polyline');
            svgAttr(arrowTipPath, {
                style: 'fill:var(--vt-c-black);stroke:var(--vt-c-black);',
                points: `${arrow[0].x},${arrow[0].y} ${arrow[1].x},${arrow[1].y} ${arrow[2].x},${arrow[2].y}`
            });

            // create diamond at end
            const dx = lineBetweenShapes.source.x - lineBetweenShapes.target.x;
            const dy = lineBetweenShapes.source.y - lineBetweenShapes.target.y;
            const tan = dy/dx;
            const theta = Math.atan(tan);

            var diamond = svgCreate('polyline');
            const diamondLen = 15;
            const xMod = dx < 0 ? 0 : Math.PI;
            const points = [
                {
                    x: lineBetweenShapes.source.x,
                    y: lineBetweenShapes.source.y
                },
                {
                    x: lineBetweenShapes.source.x + (diamondLen * Math.cos(xMod + theta + (Math.PI / 4))),
                    y: lineBetweenShapes.source.y + (diamondLen * Math.sin(xMod + theta + (Math.PI / 4)))
                },
                {
                    x: lineBetweenShapes.source.x + (Math.sqrt((diamondLen * diamondLen) + (diamondLen * diamondLen)) * Math.cos(xMod + theta)),
                    y: lineBetweenShapes.source.y + (Math.sqrt((diamondLen * diamondLen) + (diamondLen * diamondLen)) * Math.sin(xMod + theta))
                },
                {
                    x: lineBetweenShapes.source.x + (diamondLen * Math.cos(xMod + theta - (Math.PI / 4))),
                    y: lineBetweenShapes.source.y + (diamondLen * Math.sin(xMod + theta - (Math.PI / 4)))
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