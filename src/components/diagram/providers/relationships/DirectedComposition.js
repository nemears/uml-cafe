import Relationship from "./Relationship";

export default class DirectedComposition extends Relationship {
    constructor(eventBus, dragging, canvas, elementFactory) {
        super('directedComposition', eventBus, dragging, canvas, elementFactory);

        eventBus.on('directedComposition.end', (event) => {
            // check if it can connect
            if (!this.canConnect(event.context)) {
                return;
            }
            
            vscode.postMessage({
                createAssociation: {
                    id: event.context.relationship.elementID,
                    shape: event.context.relationship.shapeID,
                    waypoints: event.context.relationship.waypoints,
                    ownedEnds : [
                        event.context.target.shapeID 
                    ],
                    memberEnds: [
                        event.context.source.shapeID
                    ]
                }
            });
        });
    }

    canConnect(context) {
        return context.hover.umlType && context.hover.umlType === 'class';
    };
}