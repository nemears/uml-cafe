import Relationship from "./Relationship";

export default class DirectedComposition extends Relationship {
    constructor(eventBus, dragging, canvas, elementFactory, umlWebClient, diagramEmitter, diagramContext) {
        super('directedComposition', 'association', eventBus, dragging, canvas, elementFactory);

        eventBus.on('directedComposition.end', async (event) => {
            // check if it can connect
            if (!this.canConnect(event.context)) {
                return;
            }
            
            // create the association and properties
            const association = await umlWebClient.post('association', {id: event.context.relationship.elementID});
            const memberEnd = await umlWebClient.post('property');
            const ownedEnd = await umlWebClient.post('property');
            memberEnd.type.set(event.context.relationship.target.elementID);
            memberEnd.aggregation = 'composite';
            ownedEnd.type.set(event.context.relationship.source.elementID);
            association.memberEnds.add(memberEnd);
            association.ownedEnds.add(ownedEnd);
            const clazz = await umlWebClient.get(event.context.relationship.source.elementID);
            memberEnd.clazz.set(clazz);
            diagramContext.context.packagedElements.add(association);

            umlWebClient.put(association);
            umlWebClient.put(memberEnd);
            umlWebClient.put(ownedEnd);
            umlWebClient.put(clazz);
            umlWebClient.put(diagramContext.context);

            // update rest of app
            diagramEmitter.fire('directedComposition.end', {
                data: [
                    {
                        type: 'add',
                        id: diagramContext.context.id,
                        set: 'packageableElements',
                        el: association.id
                    }, 
                    {
                        type: 'add',
                        id: clazz.id,
                        set: 'ownedAttributes',
                        el: memberEnd.id
                    },
                    {
                        type: 'add',
                        id: association.id,
                        set: 'memberEnds',
                        el: memberEnd.id
                    },
                    {
                        type: 'add',
                        id: association.id,
                        set: 'ownedEnds',
                        el: ownedEnd.id
                    }
                ]
            });

            // create shapes
            await this.createEdge(event, umlWebClient, diagramContext);
        });
    }

    canConnect(context) {
        return context.hover.umlType && context.hover.umlType === 'class';
    };
}

DirectedComposition.$inject = ['eventBus', 'dragging', 'canvas', 'elementFactory', 'umlWebClient', 'diagramEmitter', 'diagramContext'];
