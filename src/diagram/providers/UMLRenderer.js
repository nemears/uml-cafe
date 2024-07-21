import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import {
    append as svgAppend,
    attr as svgAttr,
    create as svgCreate
} from 'tiny-svg';
import { createLine } from 'diagram-js/lib/util/RenderUtil';
import { assign } from 'min-dash';
import TextUtil from 'diagram-js/lib/util/Text';
import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler';
import { OWNED_END_RADIUS } from './relationships/Association';

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
        this.ANCHOR_STYLE = { fill: 'none', strokeWidth: 2, stroke: 'var(--vt-c-black)', strokeDasharray: "7,7" };
        this.LABEL_STYLE = { fill: 'none' };
        this.CLASS_STYLE = { fill: '#ff9955ff', stroke: 'var(--vt-c-black-soft)', strokeWidth: 2 };
        this.COMMENT_STYLE = { fill: '#f0deb9', stroke: 'var(--vt-c-black-soft)', strokeWidth: 2 }; 
        this.PROPERTY_STYLE = { fill: '#ff9955ff', stroke: '#8f552f', strokewidth: 2 };
        this.OWNED_ATTRIBUTE_STYLE = { fill: 'var(--vt-c-black)' };
        this.COMPARTMENT_STYLE = { fill: 'none', strokewidth: 2, stroke: 'var(--vt-c-black)' };
        this.EDIT_STYLE = { fill: 'var(--uml-cafe-selected)' }; // TODO change based on user
        this.DIAGRAM_STYLE = {fill: 'none', strokeWidth: 2, stroke: 'var(--vt-c-black)'};
        this.DIAGRAM_HEADING_STYLE = { fill: 'none', strokeWidth: 2, stroke: 'var(--vt-c-black)'};
        this.textStyle = {
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,
            fontWeight: 'normal',
        };
        this.textUtil = new TextUtil({
            style: this.textStyle,
            align: 'center'
        });
        this.connectionLayout = 'orthogonal';
    }

    canRender(element) {
        return true; // TODO determine valid props for rendering
    }

    drawConnection(gfx, element, attrs) {
        
        if (element.modelElement.elementType() === 'Generalization') {
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
        } else if (element.modelElement.elementType() === 'Association') {
            if (element.modelElement.memberEnds.size() > 2) {
                throw new Error("not rendering association relating more than two elements currently, contact dev if you need this!");
            }
            if (element.waypoints.length < 2) {
                throw new Error("not enough waypoints to create edge!")
            }
            const group = svgCreate('g');
            const line = createLine(element.waypoints, assign({}, this.CONNECTION_STYLE, attrs || {}));
            svgAppend(group, line);
            for (const memberEnd of element.modelElement.memberEnds.unsafe()) {
                if (memberEnd.owner.id() !== element.modelElement.id || element.modelElement.navigableOwnedEnds.contains(memberEnd)) {
                    // this is either a navigable owned end, or it is owned by a classifier
                    if (memberEnd.type.id() === element.source.modelElement.id) {
                        // arrow to source
                        const leadingLine = element.waypoints.slice(0,2).reverse();
                        const arrowPoints = createArrow(leadingLine);
                        if (memberEnd.owner.id() !== element.modelElement.id) { // TODO do this by looking for shape instead
                            moveArrow(leadingLine, arrowPoints);
                            // draw circle
                            // end shape
                            svgAppend(group, this.drawEnd(leadingLine.reverse(), attrs));
                        }
                        createAssociationArrow(group, arrowPoints);
                    } else if (memberEnd.type.id() === element.target.modelElement.id) {
                        // arrow to target
                        const leadingLine = element.waypoints.slice(-2);
                        const arrowPoints = createArrow(leadingLine);
                        if (memberEnd.owner.id() !== element.modelElement.id) {
                            moveArrow(leadingLine, arrowPoints); 
                            svgAppend(group, this.drawEnd(leadingLine.reverse(), attrs));
                        }
                        createAssociationArrow(group, arrowPoints);
                    }

                }
                if (memberEnd.featuringClassifier.has() && memberEnd.owner.id() === memberEnd.featuringClassifier.id() && memberEnd.aggregation === 'composite') {
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

                    
                    svgAppend(group, diamond);  
                }
            }
            svgAppend(gfx, group);
            return group;
        } else if (element.modelElement.elementType() === 'Comment') {
            const group = svgCreate('g');
            const line = createLine(element.waypoints, assign({}, this.ANCHOR_STYLE, attrs || {}));            
            svgAppend(group, line);
            svgAppend(gfx, group);
            return group;
        } else if (element.modelElement.elementType() === 'Dependency' || element.modelElement.elementType() === 'Abstraction' || element.modelElement.elementType() === 'Usage' || element.modelElement.elementType() === 'Realization') {
            const group = svgCreate('g');
            const line = createLine(element.waypoints, assign({}, this.ANCHOR_STYLE, attrs || {}));
            const arrow = createArrow(element.waypoints.slice(-2));
            const tip = createLine([
                {
                    x: arrow[1].x,
                    y: arrow[1].y
                },
                {
                    x: arrow[0].x,
                    y: arrow[0].y
                },
                {
                    x: arrow[2].x,
                    y: arrow[2].y
                }
            ], assign({}, this.CONNECTION_STYLE, attrs || {}));
            const tipLine = createLine([
                {
                    x: arrow[0].x,
                    y: arrow[0].y
                },
                {
                    x: (arrow[1].x + arrow[2].x)/2,
                    y: (arrow[1].y + arrow[2].y)/2
                }
            ], assign({}, this.CONNECTION_STYLE, attrs || {}));
            svgAppend(group, tip);
            svgAppend(group, tipLine);
            svgAppend(group, line);
            svgAppend(gfx, group);
            return group;
        }
    }

    drawShape(gfx, element, attrs) {
        const cropText = (textString, bounds, options) => {
            let text = undefined;
            do {
                text = this.textUtil.layoutText(textString, options);
                textString = textString.slice(0, -4) + '...';
            } while (textString.length > 4 && (text.dimensions.width > bounds.width || text.dimensions.height > bounds.height));
            return text.element;
        }

        // create shape
        const group = svgCreate('g');
        const createRectangle = () => {
            const rect = svgCreate('rect');
            svgAttr(rect, {
                x: 0,
                y: 0,
                width: element.width || 0,
                height: element.height || 0
            }); 
            svgAppend(group, rect);
            return rect
        };
    
        // shapes that do not depend on the element's type
        if (element.elementType === 'UMLCompartment') {
            // TODO
            const rect = createRectangle();
            svgAttr(rect, assign({}, this.COMPARTMENT_STYLE), attrs || {});
        } else if (element.elementType === 'UMLNameLabel') {
            const rect = createRectangle();
            svgAttr(rect, assign({}, this.LABEL_STYLE), attrs || {});
            if (!element.text) {
                console.warn('no text provided to label assuming empty, please add text = "" to your label to supress this warning');
            } else {
                const text = cropText(element.text, element, {
                    align: 'center-middle',
                    style: {
                        fontWeight: 'Bold',
                    },
                    box: {
                        width: element.width - 5,
                        height: element.height,
                        x: 0,
                        y: 0,
                    }
                });
                svgAppend(group, text);
            }
        } else if (element.elementType === 'UMLKeywordLabel' || element.elementType === 'UMLAssociationEndLabel' || element.elementType === 'UMLMultiplicityLabel') {
            const rect = createRectangle();
            svgAttr(rect, assign({}, this.LABEL_STYLE), attrs || {});
            if (!element.text) {
                console.warn('no text provided to label assuming empty, please add text = "" to your label to supress this warning');
            } else {
                const text = cropText(element.text, element, {
                    align: 'center-middle',
                    box: {
                        width: element.width - 5,
                        height: element.height,
                        x: 0,
                        y: 0,
                    }
                });
                svgAppend(group, text);
            } 
        } else if (element.elementType === 'UMLClassifierShape') {
            const rect = createRectangle();
            svgAttr(rect, assign({}, this.CLASS_STYLE), attrs || {});
        } else if (element.elementType === 'UMLTypedElementLabel') {
            const rect = createRectangle();
            svgAttr(rect, this.LABEL_STYLE);
            if (!element.text) {
                console.warn('no text provided to label assuming empty, please add text = "" to your label to supress this warning');
            } else {
                const text = cropText(element.text, element, {
                    align: 'left-middle',
                    padding: {
                        left: 5,
                    },
                    box: {
                        width: element.width - 5,
                        height: element.height,
                        x: 0,
                        y: 0,
                    }
                });
                svgAppend(group, text);
            }
        } else if (element.elementType === 'ClassDiagram') {
            const rect = createRectangle();
            svgAttr(rect, this.DIAGRAM_STYLE);
        } else if (element.elementType === 'label' && element.headedDiagram) {
            const rect = createRectangle();
            svgAttr(rect, this.DIAGRAM_HEADING_STYLE);
            const kindText = this.textUtil.layoutText(element.diagramKind, {
                align: 'left-middle',
                padding: {
                    left: 5,
                },
                style: {
                    fontWeight: 'Bold',
                },
                box: {
                    width: element.width - 5,
                    height: element.height,
                    x: 0,
                    y: 0,
                }
            });
            svgAppend(group, kindText.element);

            const nameText = cropText(element.diagramName, element, {
                align: 'left-middle',
                padding: {
                    left: 10 + Math.round(kindText.dimensions.width),
                },
                box: {
                    width: element.width - 5,
                    height: element.height,
                    x: 0,
                    y: 0,
                }
            });
            svgAppend(group, nameText);
        }

        svgAppend(gfx, group);
        return group;
    }

    drawEnd(leadingLine, attrs) {
        const circle = svgCreate('circle');
        const options = {
            cx: leadingLine[0].x,
            cy: leadingLine[0].y,
            r: 5
        };
        moveEnd(leadingLine.reverse(), options);
        svgAttr(circle, options); 
        svgAttr(circle, assign({}, this.OWNED_ATTRIBUTE_STYLE), attrs || {});
        return circle;
    }
}

UMLRenderer.$inject = ['eventBus'];

export function getMultiplicityText(element) {
    let textString = '';
    const multiplicity = {};
    if (element.lowerValue.has()) {
        multiplicity.lower = element.lowerValue.val.el.value;
    }
    if (multiplicity.upper !== undefined) {
        if (multiplicity.lower !== undefined) {
            textString += ' ' + multiplicity.lower + '..' + multiplicity.upper;
        } else {
            textString += ' ' + multiplicity.upper;
        }
    }
    if (element.upperValue.has()) {
        multiplicity.upper = element.upperValue.val.el.value;
    }
    return textString; 
}

export function createPropertyLabel(element) {
    
    // TODO visibility
    // TODO derived
    // TODO modifier
    let textString = element.modelElement.name;
    if (element.modelElement.type.has()) {
        textString += ' : ' + element.modelElement.type.val.el.name;
    }
    textString += getMultiplicityText(element);
    
    return textString;
}

function moveArrow(leadingLine, arrowPoints) {
    if (leadingLine[0].x < leadingLine[1].x) {
        // to left
        for (const point of arrowPoints) {
            point.x = point.x - (2 * OWNED_END_RADIUS);
        }
    } else if (leadingLine[0].x > leadingLine[1].x) {
        // to right
        for (const point of arrowPoints) {
            point.x = point.x + (2 * OWNED_END_RADIUS);
        }
    } else if (leadingLine[0].y < leadingLine[1].y) {
        // to the top
        for (const point of arrowPoints) {
            point.y = point.y - (2 * OWNED_END_RADIUS);
        }
    } else if (leadingLine[0].y > leadingLine[1].y) {
        // to the bottom
        for (const point of arrowPoints) {
            point.y = point.y + (2 * OWNED_END_RADIUS);
        }
    }
}

function createAssociationArrow(group, arrowPoints) {
    const arrowTipPath = svgCreate('polyline');
    svgAttr(arrowTipPath, {
        style: 'fill:var(--vt-c-black);stroke:var(--vt-c-black);',
        points: `${arrowPoints[0].x},${arrowPoints[0].y} ${arrowPoints[1].x},${arrowPoints[1].y} ${arrowPoints[2].x},${arrowPoints[2].y}`
    });
    svgAppend(group, arrowTipPath);
}

function moveEnd(leadingLine, options) {
    if (leadingLine.size < 2) {
        throw new Error("not enough waypoints to determine direction of edge!");
    }
    if (leadingLine[0].x < leadingLine[1].x) {
        // to left
        options.cx -= 5;
    } else if (leadingLine[0].x > leadingLine[1].x) {
        // to right
        options.cx += 5;
    } else if (leadingLine[0].y < leadingLine[1].y) {
        // to the top
        options.cy -= 5;
    } else if (leadingLine[0].y > leadingLine[1].y) {
        // to the bottom
        options.cy += 5;
    }
}
