import { createDiagramEdge } from "../../api/diagramInterchange";
import { createElementUpdate } from '../../../../umlUtil';
import { randomID } from 'uml-client/lib/element';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default class DependencyHandler extends RuleProvider {
    
    constructor(eventBus, umlWebClient, diagramEmitter, diagramContext, modeling) {
        super(eventBus);

        eventBus.on('connect.end', (event) => {
            if (event.context.start.connectType === 'dependency' || event.connectType === 'dependency') {
                if (event.context.canExecute) {
                    // create dependency
                    const createDependency = async () => {
                        const dependency = await umlWebClient.post('dependency');
                        const client = await umlWebClient.get(event.context.start.modelElement.id);
                        dependency.client.set(client);
                        dependency.supplier.set(event.hover.modelElement.id);
                        umlWebClient.put(dependency);
                        umlWebClient.put(client);

                        diagramEmitter.fire('elementUpdate', createElementUpdate(client));
                        
                        event.context.connection = modeling.connect(event.context.start, 
                            event.hover, 
                            {
                                id: randomID(),
                                modelElement: dependency 
                            }, {});

                        // create shape
                        await createDiagramEdge(event.context.connection, umlWebClient, diagramContext);
                    }
                    createDependency();
                    return false; // stop propogation
                }
            }
        });
        eventBus.on('dependency.start', () => {
            eventBus.once('connect.init', (event) => {
                event.context.start.connectType = 'dependency';
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

DependencyHandler.$inject = ['eventBus', 'umlWebClient', 'diagramEmitter', 'diagramContext', 'modeling'];

function canConnect(context) {
    const ret = canConnectHelper(context);
    context.canExecute = ret;
    return ret;
}

function canConnectHelper(context) {
    if (context.source && !context.source.connectType) {
        return true;
    }
    if (context.source && context.source.connectType === 'dependency') {
        if (!context.source.modelElement) {
            return false;
        }
        if (!context.source.modelElement.isSubClassOf('namedElement')) { 
            return false;
        }
        if (context.target) {
            if (!context.target.modelElement) {
                return false;
            }
            if (!context.target.modelElement.isSubClassOf('namedElement')) {
                return false;
            }
        }
        return true;
    }
    return false;
} 
