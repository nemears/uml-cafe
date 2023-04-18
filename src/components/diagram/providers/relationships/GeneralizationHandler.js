import InstanceValue from "uml-js/lib/instanceValue";
import Relationship from "./Relationship";

export default class GeneralizationHandler extends Relationship {
    constructor(eventBus, dragging, canvas, elementFactory, umlWebClient, diagramEmitter, diagramContext) {
        super('generalization', 'generalization', eventBus, dragging, canvas, elementFactory);

        eventBus.on('generalization.end', async (event) => {
            // check if it can connect
            if (!this.canConnect(event.context)) {
                return;
            }

            // create generalization
            const generalization = await umlWebClient.post('generalization', {id: event.context.relationship.elementID});
            const specific = await umlWebClient.get(event.context.relationship.source.elementID);
            specific.generalizations.add(generalization);
            generalization.general.set(event.context.relationship.target.elementID);
            umlWebClient.put(generalization);
            umlWebClient.put(specific);
            diagramEmitter.fire('generalization.end', {
                data: [
                    {
                        type: 'add',
                        id: specific.id,
                        set: 'generalizations',
                        el: generalization.id
                    }
                ]
            });

            // create shape
            await this.createPath(event, umlWebClient, diagramContext);
        });
    }

    canConnect(context) {
        return context.hover.umlType && context.hover.umlType === 'class' && context.hover.elementID !== context.start.elementID;
    };
}