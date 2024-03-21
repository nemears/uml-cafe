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
            // const element = context.element;
            // if (element.parent.id === diagramContext.umlDiagram.id) {
            //     if (!this.root) {
            //         this.root = canvas.findRoot(element);
            //     }
            //     element.parent.children.splice(element.parent.children.indexOf(element), 1);
            //     element.parent = this.root;
            //     this.root.children.push(element);

            // }
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

            const doLater = async () => {
                if (changedHeading) {
                    await updateLabel(this.diagramFrame.heading, umlWebClient);
                }
                if (changedFrame) {
                    graphicsFactory.update('shape', this.diagramFrame, canvas.getGraphics(this.diagramFrame));
                }
                if (changedHeading) {
                    graphicsFactory.update('shape', this.diagramFrame.heading, canvas.getGraphics(this.diagramFrame.heading));
                }
            };
            doLater();
        }
    }
}

UmlDiagramProvider.$inject = ['eventBus', 'canvas', 'diagramContext', 'graphicsFactory', 'umlWebClient'];