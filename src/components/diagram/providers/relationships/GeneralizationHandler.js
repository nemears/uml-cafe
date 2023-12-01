import Relationship from './Relationship';
import { createEdge } from "./Relationship";
import { createElementUpdate } from '../../../../createElementUpdate';

export default class GeneralizationHandler extends Relationship {
    constructor(eventBus, dragging, canvas, elementFactory, umlWebClient, diagramEmitter, diagramContext) {
        super('generalization', 'generalization', eventBus, dragging, canvas, elementFactory);

        eventBus.on('generalization.end', async (event) => {
            // check if it can connect
            if (!this.canConnect(event.context)) {
                return;
            }

            // create generalization
            const generalization = await umlWebClient.post('generalization', {id: event.context.relationship.modelElement.id});
            const specific = await umlWebClient.get(event.context.relationship.source.modelElement.id);
            specific.generalizations.add(generalization);
            generalization.general.set(event.context.relationship.target.modelElement.id);
            umlWebClient.put(generalization);
            umlWebClient.put(specific);

            diagramEmitter.fire('elementUpdate', createElementUpdate(specific));

            event.context.relationship.modelElement = generalization;

            // create shape
            await createEdge(event.context.relationship, umlWebClient, diagramContext);
        });
    }

    canConnect(context) {
        return context.hover.modelElement && context.hover.modelElement.elementType() === 'class';
    }
}

GeneralizationHandler.$inject = ['eventBus', 'dragging', 'canvas', 'elementFactory', 'umlWebClient', 'diagramEmitter', 'diagramContext'];
