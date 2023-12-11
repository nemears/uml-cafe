import { createElementUpdate } from '../../../../createElementUpdate';
import { createEdge } from './relationshipUtil';
import { randomID } from 'uml-client/lib/element';

export default class DirectedComposition {
    constructor(eventBus, umlWebClient, diagramEmitter, diagramContext, modeling) {

        eventBus.on('connect.end', (event) => {
            // check if it can connect
            if (event.context.start.connectType === 'directedComposition') {
                const createAssociation = async () => {
                    // create the association and properties
                    const association = await umlWebClient.post('association');
                    const memberEnd = await umlWebClient.post('property');
                    const ownedEnd = await umlWebClient.post('property');
                    memberEnd.type.set(event.hover.modelElement.id);
                    memberEnd.aggregation = 'composite';
                    ownedEnd.type.set(event.context.start.modelElement.id);
                    association.memberEnds.add(memberEnd);
                    association.ownedEnds.add(ownedEnd);
                    const clazz = await umlWebClient.get(event.context.start.modelElement.id);
                    memberEnd.clazz.set(clazz);
                    diagramContext.context.packagedElements.add(association);

                    umlWebClient.put(association);
                    umlWebClient.put(memberEnd);
                    umlWebClient.put(ownedEnd);
                    umlWebClient.put(clazz);
                    umlWebClient.put(diagramContext.context);

                    event.context.connection = modeling.connect(
                        event.context.start, 
                        event.hover, 
                        {
                            id: randomID(),
                            modelElement: association
                        }, 
                        {}
                    );

                    diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context, clazz, association));
                    
                    // create shapes
                    await createEdge(event.context.connection, umlWebClient, diagramContext);
                }
                createAssociation();
                return false; // stop propogation
            }
        });

        eventBus.on('directedComposition.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'directedComposition';
            });
        });
    }
}

DirectedComposition.$inject = ['eventBus', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'modeling'];
