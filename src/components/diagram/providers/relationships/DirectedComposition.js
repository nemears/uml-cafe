import Relationship from './Relationship';
import { createEdge } from "./Relationship";
import { createElementUpdate } from '../../../../createElementUpdate';

export default class DirectedComposition extends Relationship {
    constructor(eventBus, dragging, canvas, elementFactory, umlWebClient, diagramEmitter, diagramContext) {
        super('directedComposition', 'association', eventBus, dragging, canvas, elementFactory);

        eventBus.on('directedComposition.end', async (event) => {
            // check if it can connect
            if (!this.canConnect(event.context)) {
                return;
            }
            
            // create the association and properties
            const association = await umlWebClient.post('association', {id: event.context.relationship.modelElement.id});
            const memberEnd = await umlWebClient.post('property');
            const ownedEnd = await umlWebClient.post('property');
            memberEnd.type.set(event.context.relationship.target.modelElement.id);
            memberEnd.aggregation = 'composite';
            ownedEnd.type.set(event.context.relationship.source.modelElement.id);
            association.memberEnds.add(memberEnd);
            association.ownedEnds.add(ownedEnd);
            const clazz = await umlWebClient.get(event.context.relationship.source.modelElement.id);
            memberEnd.clazz.set(clazz);
            diagramContext.context.packagedElements.add(association);

            umlWebClient.put(association);
            umlWebClient.put(memberEnd);
            umlWebClient.put(ownedEnd);
            umlWebClient.put(clazz);
            umlWebClient.put(diagramContext.context);
            event.context.relationship.modelElement = association;

            diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, clazz, association));
            
            // create shapes
            await createEdge(event.context.relationship, umlWebClient, diagramContext);
        });
    }

    canConnect(context) {
        return context.hover.modelElement && context.hover.modelElement.elementType() === 'class';
    }
}

DirectedComposition.$inject = ['eventBus', 'dragging', 'canvas', 'elementFactory', 'umlWebClient', 'diagramEmitter', 'diagramContext'];