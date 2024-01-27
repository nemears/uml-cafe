import { createDiagramEdge, deleteUmlDiagramElement } from "../../api/diagramInterchange";
import { createElementUpdate } from '../../../../umlUtil';
import { randomID } from 'uml-client/lib/element';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { connectRectangles } from "diagram-js/lib/layout/ManhattanLayout";
import { getMid } from "diagram-js/lib/layout/LayoutUtil";

class CreateGeneralizationHandler {
    constructor(umlWebClient, diagramContext, elementFactory, canvas, diagramEmitter) {
        this.umlWebClient = umlWebClient;
        this.diagramContext = diagramContext;
        this.elementFactory = elementFactory;
        this.canvas = canvas;
        this.diagramEmitter = diagramEmitter;
    }
    async doLater(event) {
        const specific = await this.umlWebClient.get(event.context.start.modelElement.id);
        const generalization = event.context.connection.modelElement;
        specific.generalizations.add(generalization);
        generalization.general.set(event.hover.modelElement.id);
        this.umlWebClient.put(generalization);
        this.umlWebClient.put(specific);
        this.diagramEmitter.fire('elementUpdate', createElementUpdate(specific));
        await createDiagramEdge(event.context.connection, this.umlWebClient, this.diagramContext);
    }
    execute(event) {
        const generalization = this.umlWebClient.post('generalization');
        const source = event.context.start;
        const target = event.hover;
        event.context.connection = this.elementFactory.createConnection({
            source: source,
            target: target,
            waypoints: connectRectangles(source, target, getMid(source), getMid(target)),
            id: randomID(),
            modelElement: generalization,
            children: [],
        });
        this.canvas.addConnection(event.context.connection, this.canvas.findRoot(event.context.hover));
        this.doLater(event);
        return event.context.connection;
    }
    async deleteLater(event) {
        const owner = await event.context.connection.modelElement.specific.get();
        await this.umlWebClient.deleteElement(event.context.connection.modelElement);
        this.diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
        for (const label of event.context.connection.labels) {
            await deleteUmlDiagramElement(label.id, this.umlWebClient);
        }
        await deleteUmlDiagramElement(event.context.connection.id, this.umlWebClient);
    }
    revert(event) {
        this.deleteLater(event);
        event.context.connection.source.outgoing.splice(event.context.connection.source.outgoing.indexOf(event.context.connection), 1);
        event.context.connection.target.incoming.splice(event.context.connection.target.incoming.indexOf(event.context.connection), 1);
        this.canvas.removeConnection(event.context.connection);
        return event.context.connection;
    }
}

CreateGeneralizationHandler.$inject = ['umlWebClient', 'diagramContext', 'elementFactory', 'canvas', 'diagramEmitter'];

export default class GeneralizationHandler extends RuleProvider {
    
    constructor(eventBus, commandStack) {
        super(eventBus);
        commandStack.registerHandler('generalization', CreateGeneralizationHandler);
        eventBus.on('connect.end', (event) => {
            if (event.context.start.connectType === 'generalization' || event.connectType === 'generalization') {
                commandStack.execute('generalization', event);
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

GeneralizationHandler.$inject = ['eventBus', 'commandStack'];

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
