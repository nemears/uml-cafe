import { createEdge } from "./Relationship";
import { createElementUpdate } from '../../../../createElementUpdate';
import { randomID } from 'uml-client/lib/element';

export default class GeneralizationHandler {
    constructor(eventBus, umlWebClient, diagramEmitter, diagramContext, modeling) {
        eventBus.on('connect.end', (event) => {
            if (event.context.start.connectType === 'generalization') {
                // create generalization
                const createGeneralization = async () => {
                    const generalization = await umlWebClient.post('generalization');
                    const specific = await umlWebClient.get(event.context.start.modelElement.id);
                    specific.generalizations.add(generalization);
                    generalization.general.set(event.hover.modelElement.id);
                    umlWebClient.put(generalization);
                    umlWebClient.put(specific);

                    diagramEmitter.fire('elementUpdate', createElementUpdate(specific));
                    
                    event.context.connection = modeling.connect(event.context.start, 
                        event.hover, 
                        {
                            id: randomID(),
                            modelElement: generalization 
                        }, {});

                    // create shape
                    await createEdge(event.context.connection, umlWebClient, diagramContext);
                }
                createGeneralization();
                return false; // stop propogation
            }
        });
    }
}

GeneralizationHandler.$inject = ['eventBus', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'modeling'];
