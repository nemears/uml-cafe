import RuleProvider from "diagram-js/lib/features/rules/RuleProvider";
import { isDiagram, updateLabel } from "../api/diagramInterchange";

export default class UmlDiagramProvider extends RuleProvider {
    constructor(eventBus, canvas, diagramContext, graphicsFactory, umlWebClient) {
        super(eventBus);
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
            const shapes = context.shapes;
            for (const shape of shapes) {
                if (isDiagram(shape.elementType)) {
                    return false;
                }
            }
        });
        this.addRule('elements.move', 1000, (context) => {
            const diagramContext = this._diagramContext;
            if (context.target && context.target.id === diagramContext.umlDiagram.id) {
                return false;
            }
            if (context.target && context.target.headedDiagram) {
                return false;
            }
        })
    }

    async doLater(changedFrame, changedHeading) {
        const umlWebClient = this._umlWebClient,
        graphicsFactory = this._graphicsFactory,
        canvas = this._canvas;
        if (changedHeading) {
            await updateLabel(this.diagramFrame.heading, umlWebClient);
        }
        if (changedFrame) {
            graphicsFactory.update('shape', this.diagramFrame, canvas.getGraphics(this.diagramFrame));
        }
        if (changedHeading) {
            graphicsFactory.update('shape', this.diagramFrame.heading, canvas.getGraphics(this.diagramFrame.heading));
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
            return;
        }
        if (element.parent === this.root) {
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
}

UmlDiagramProvider.$inject = ['eventBus', 'canvas', 'diagramContext', 'graphicsFactory', 'umlWebClient'];