import { createDiagramEdge } from "../../api/diagramInterchange";
import { createElementUpdate } from '../../../../umlUtil';
import { randomID } from 'uml-client/lib/element';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default class GeneralizationHandler extends RuleProvider {
    
    constructor(eventBus, umlWebClient, diagramEmitter, diagramContext, modeling) {
        super(eventBus);

        eventBus.on('connect.end', (event) => {
            if (event.context.start.connectType === 'generalization' || event.connectType === 'generalization') {
                if (event.context.canExecute) {
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
                        await createDiagramEdge(event.context.connection, umlWebClient, diagramContext);
                    }
                    createGeneralization();
                    return false; // stop propogation
                }
            }
        });
        eventBus.on('generalization.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'generalization';
            });
        });
    }

    

    init() {
        this.addRule('connection.start', (context) => {
           return canConnect(context);
        });

        this.addRule('connection.create', (context) => {
            return canConnect(context);
        });
        this.addRule('connection.reconnect', (context) => {
            return canConnect(context);
        });
    }
}

GeneralizationHandler.$inject = ['eventBus', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'modeling'];

function canConnect(context) {
    const ret = canConnectHelper(context);
    context.canExecute = ret;
    return ret;
}

function canConnectHelper(context) {
    if (context.source && !context.source.connectType) {
        return true;
    }
    if (context.source && context.source.connectType === 'generalization') {
        if (!context.source.modelElement) {
            return false;
        }
        if (!context.source.modelElement.isSubClassOf('classifier')) {
            return false;
        }
        if (context.target) {
            if (!context.target.modelElement) {
                return false;
            }
            if (!context.target.modelElement.isSubClassOf('classifier')) {
                return false;
            }
        }
        return true;
    }
    return false;
} 
