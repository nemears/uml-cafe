import Relationship from "./Relationship";

export default class GeneralizationHandler extends Relationship {
    constructor(eventBus, dragging, canvas, elementFactory) {
        super('generalization', eventBus, dragging, canvas, elementFactory);

        eventBus.on('generalization.end', function(event) {
            // check if it can connect
            if (!this.canConnect(event.context)) {
                return;
            }

            vscode.postMessage({
                createGeneralization:
                {
                    id: event.context.relationship.elementID,
                    shape: event.context.relationship.shapeID,
                    waypoints: event.context.relationship.waypoints,
                    source: event.context.source.shapeID,
                    target: event.context.target.shapeID
                }
            });
        }.bind(this));
    }

    canConnect(context) {
        return context.hover.umlType && context.hover.umlType === 'class' && context.hover.elementID !== context.start.elementID;
    };
}