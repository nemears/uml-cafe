import { createEdge } from "./relationshipUtil";
import { createElementUpdate } from '../../../../umlUtil';
import { randomID } from 'uml-client/lib/element';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default class GeneralizationHandler extends RuleProvider {
    
    constructor(eventBus, umlWebClient, diagramEmitter, diagramContext, modeling) {
        super(eventBus);
        RuleProvider.call(this, eventBus);

        eventBus.on('connect.end', (event) => {
            if (event.context.start.connectType === 'generalization' || event.connectType === 'generalization') {
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
        eventBus.on('generalization.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'generalization';
            });
        });
    }

    init() {
        this.addRule('connection.start', () => {
            return true;
        });
    }
}

GeneralizationHandler.$inject = ['eventBus', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'modeling'];
