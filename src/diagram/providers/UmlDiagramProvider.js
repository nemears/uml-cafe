import RuleProvider from "diagram-js/lib/features/rules/RuleProvider";
import { isDiagram } from "../api/diagramInterchange";

export default class UmlDiagramProvider extends RuleProvider {
    constructor(eventBus) {
        super(eventBus);
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
}

UmlDiagramProvider.$inject = ['eventBus', 'canvas', 'selection'];