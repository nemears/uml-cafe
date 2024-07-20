import RuleProvider from "diagram-js/lib/features/rules/RuleProvider";
import { isDiagram } from "../api/diagramInterchange/is";
import { updateLabel  } from '../api/diagramInterchange/label';

export default class UmlDiagramProvider extends RuleProvider {
    constructor(eventBus, canvas, diagramContext, graphicsFactory, umlWebClient) {
        super(eventBus);
        this._eventBus = eventBus;
        this.root = undefined;
        this.diagramFrame = undefined;
        this._canvas = canvas;
        this._diagramContext = diagramContext;
        this._graphicsFactory = graphicsFactory;
        this._umlWebClient = umlWebClient;
        eventBus.on('shape.added', (context) => {
            this.checkAndMoveShape(context.element);
        });
        eventBus.on('uml.shape.move', (context) => {
            this.checkAndMoveShape(context.shape);
        });
        eventBus.on('resize.start', 1500, (context) => {
            const shape = context.shape;
            if (isDiagram(shape.elementType)) {
                context.context.minBounds = this.getDiagramMinBounds(context.context.direction);
                context.context.childrenBoxPadding = 25;
            }
        });
        eventBus.on('resize.end', (context) => {
            this.checkAndMoveShape(context.shape);
        });
        eventBus.on('server.update', 900, (context) => {
            this.checkAndMoveShape(context.localElement);
        });
        eventBus.on('edge.move', (context) => {
            this.checkAndMoveEdgeWaypoints(context.edge);
        });
        eventBus.on('connection.added', (context) => {
            this.checkAndMoveEdgeWaypoints(context.element);
        });
    }
    init() {
        this.addRule('elements.move', 1500, (context) => {
            // TODO alter this when drag property to show association
            // const shapes = context.shapes;
            // for (const shape of shapes) {
            //     if (isDiagram(shape.elementType)) {
            //         return false;
            //     }
            // }
        });
        this.addRule('elements.move', 1000, (context) => {
            // const diagramContext = this._diagramContext;
            // if (context.target && context.target.id === diagramContext.umlDiagram.id) {
            //     return false;
            // }
            // if (context.target && context.target.headedDiagram) {
            //     return false;
            // }
        })
    }

    async doLater(changedFrame, changedHeading) {
        const umlWebClient = this._umlWebClient,
        eventBus = this._eventBus,
        graphicsFactory = this._graphicsFactory,
        canvas = this._canvas;
        if (changedHeading) {
            await updateLabel(this.diagramFrame.heading, umlWebClient);
        }
        const elements = [];
        if (changedFrame) {
            // graphicsFactory.update('shape', this.diagramFrame, canvas.getGraphics(this.diagramFrame));
            elements.push(this.diagramFrame);
        }
        if (changedHeading) {
            // graphicsFactory.update('shape', this.diagramFrame.heading, canvas.getGraphics(this.diagramFrame.heading));
            elements.push(this.diagramFrame.heading);
        }
        if (elements.length > 0) {
            eventBus.fire('elements.changed', {elements: elements});
        }
    }

    checkAndMoveShape(element) {
        const canvas = this._canvas,
        diagramContext = this._diagramContext;
        if (!this.root) {
            this.root = canvas.findRoot(element);
        }
        if (element.id === diagramContext.umlDiagram.id) {
            this.diagramFrame = element;
            // TODO / in progress move label
            const heading = element.heading;
            if (heading) {
                heading.x = element.x;
                heading.y = element.y;
                this.doLater(false, true);
            }
            return;
        }
        if (element.parent === this.root && this.diagramFrame) {
            let changedFrame = false;
            let changedHeading = false;
            if (element.x < this.diagramFrame.x + 25) {
                const dx = this.diagramFrame.x - element.x + 25;
                this.diagramFrame.x = element.x - 25;
                this.diagramFrame.width += dx;
                this.diagramFrame.heading.x = this.diagramFrame.x;
                changedFrame = true;
                changedHeading = true;
            }
            if (element.y < this.diagramFrame.y + 25) {
                const dy = this.diagramFrame.y - element.y + 35;
                this.diagramFrame.y = element.y - 35;
                this.diagramFrame.height += dy;
                this.diagramFrame.heading.y = this.diagramFrame.y;
                changedFrame = true;
                changedHeading = true;
            }
            if (element.x + element.width > this.diagramFrame.x + this.diagramFrame.width - 25) {
                this.diagramFrame.width = element.x - this.diagramFrame.x + element.width + 25;
                changedFrame = true;
            }
            if (element.y + element.height > this.diagramFrame.y + this.diagramFrame.height - 25) {
                this.diagramFrame.height = element.y - this.diagramFrame.y + element.height + 25;
                changedFrame = true;
            }
            this.doLater(changedFrame, changedHeading);
        }
    }
    checkAndMoveEdgeWaypoints(edge) {
        let changedFrame = false;
        let changedHeading = false;
        if (!this.diagramFrame) {
            return;
        }
        for (const point of edge.waypoints) {
            if (point.x < this.diagramFrame.x + 25) {
                const dx = this.diagramFrame.x - point.x + 25;
                this.diagramFrame.x = point.x - 25;
                this.diagramFrame.width += dx;
                this.diagramFrame.heading.x = this.diagramFrame.x;
                changedFrame = true;
                changedHeading = true;
            }
            if (point.y < this.diagramFrame.y + 25) {
                const dy = this.diagramFrame.y - point.y + 35;
                this.diagramFrame.y = point.y - 35;
                this.diagramFrame.height += dy;
                this.diagramFrame.heading.y = this.diagramFrame.y;
                changedFrame = true;
                changedHeading = true;
            }
            if (point.x > this.diagramFrame.x + this.diagramFrame.width + 25) {
                this.diagramFrame.width = point.x + 25;
                changedFrame = true;
            }
            if (point.x > this.diagramFrame.y + this.diagramFrame.height + 25) {
                this.diagramFrame.height = point.y + 25;
                changedFrame = true;
            }
        }
        this.doLater(changedFrame, changedHeading);
    }
    getDiagramMinBounds(direction) {
        const diagramContext = this._diagramContext;
        const bigNumber = 10000000;
        if (!this.root) {
            throw Error('not tracking root, bad state!');
        }
        const ret = {
            x: bigNumber,
            y: bigNumber,
            width: this.diagramFrame.heading.width,
            height: this.diagramFrame.heading.height,
        }
        for (const child of this.root.children) {
            if (child.id === diagramContext.umlDiagram.id) {
                continue;
            }
            if (child.x < ret.x) {
                if (ret.width !== 0) {
                    const dx = this.diagramFrame.x - child.x + 25;
                    ret.width += dx;
                }
                ret.x = child.x - 25;
            }
            if (child.y < ret.y) {
                if (ret.height !== 0) {
                    const dy = this.diagramFrame.y - child.y + 35;
                    ret.height += dy;
                }
                ret.y = child.y - 35;
            }
            if (child.x + child.width > ret.x + ret.width) {
                ret.width = child.x + child.width + 25 - ret.x;
            }
            if (child.y + child.height > ret.y + ret.height) {
                ret.height = child.y + child.height + 25 - ret.y;
            }
        }
        if (ret.x === bigNumber || ret.y === bigNumber) {
            switch(direction) {
                case 'nw':
                    ret.x = this.diagramFrame.x + this.diagramFrame.width - this.diagramFrame.heading.width;
                    ret.y = this.diagramFrame.y + this.diagramFrame.height - this.diagramFrame.heading.height;
                    break;
                case 'w':
                case 'sw':
                    ret.x = ret.x = this.diagramFrame.x + this.diagramFrame.width - this.diagramFrame.heading.width;
                    ret.y = this.diagramFrame.y;
                    break;
                case 's':
                case 'se':
                case 'e':
                    ret.x = this.diagramFrame.x;
                    ret.y = this.diagramFrame.y;
                    break;
                case 'ne':
                case 'n':
                    ret.x = this.diagramFrame.x;
                    ret.y = this.diagramFrame.y + this.diagramFrame.height - this.diagramFrame.heading.height;
                    break;
                default:
                    throw Error('Bad direction!');
            }
        }
        return ret;
    }
}

UmlDiagramProvider.$inject = ['eventBus', 'canvas', 'diagramContext', 'graphicsFactory', 'umlWebClient'];
