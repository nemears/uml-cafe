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
    }

    checkAndMoveShape(element) {
        const canvas = this._canvas,
        diagramContext = this._diagramContext,
        graphicsFactory = this._graphicsFactory,
        umlWebClient = this._umlWebClient;
        if (!this.root) {
            this.root = canvas.findRoot(element);
        }
        if (element.id === diagramContext.umlDiagram.id) {
            this.diagramFrame = element;
            return;
        }
        if (element.parent === this.root) {
            if (element.x < this.diagramFrame.x - 25) {
                this.diagramFrame.x = element.x - 25;
                this.diagramFrame.heading.x = this.diagramFrame.x;
            }
            if (element.y < this.diagramFrame.y - 25) {
                this.diagramFrame.y = element.y - 35;
                this.diagramFrame.heading.y = this.diagramFrame.y;
            }
            if (element.x + element.width > this.diagramFrame.x + this.diagramFrame.width + 25) {
                this.diagramFrame.width = element.x - this.diagramFrame.x + element.width + 25;
            }
            if (element.y + element.height > this.diagramFrame.y + this.diagramFrame.height + 25) {
                this.diagramFrame.height = element.y - this.diagramFrame.y + element.height + 25;
            }

            const doLater = async () => {
                await updateLabel(this.diagramFrame.heading, umlWebClient);
                graphicsFactory.update('shape', this.diagramFrame, canvas.getGraphics(this.diagramFrame));
                graphicsFactory.update('shape', this.diagramFrame.heading, canvas.getGraphics(this.diagramFrame.heading));
            };
            doLater();
        }
    }
}

UmlDiagramProvider.$inject = ['eventBus', 'canvas', 'diagramContext', 'graphicsFactory', 'umlWebClient'];