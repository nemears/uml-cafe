import { connectRectangles } from "diagram-js/lib/layout/ManhattanLayout";
import { getMid } from "diagram-js/lib/layout/LayoutUtil";
import { createDiagramEdge, deleteUmlDiagramElement } from "../api/diagramInterchange";

class EdgeCreatorHandler {
    constructor(umlWebClient, diagramContext, elementFactory, canvas, diagramEmitter, elementRegistry, eventBus, graphicsFactory) {
        this._umlWebClient = umlWebClient;
        this._diagramContext = diagramContext;
        this._elementFactory = elementFactory;
        this._canvas = canvas;
        this._diagramEmitter = diagramEmitter;
        this._elementRegistry = elementRegistry;
        this._eventBus = eventBus;
        this._graphicsFactory = graphicsFactory;
    }
    execute(context) {
        const elementRegistry = this._elementRegistry,
        umlWebClient = this._umlWebClient,
        elementFactory = this._elementFactory,
        eventBus = this._eventBus,
        diagramContext = this._diagramContext,
        canvas = this._canvas,
        diagramEmitter = this._diagramEmitter,
        graphicsFactory = this._graphicsFactory;
        const proxyStart = context.context.start;
        const start = elementRegistry.get(context.context.id);
        if (start) {
            context.context.start = start;
        }
        if (context.proxy) {
            delete context.proxy;
            context.hover = elementRegistry.get(context.hover.id);
            context.context.start.connectType = proxyStart.connectType;
            context.context.connection = elementRegistry.get(context.connectionID);
            const connectionProxy = context.context.connection;
            if (!context.context.connection && start) {
                connectionProxy.source = elementRegistry.get(connectionProxy.source);
                connectionProxy.target = elementRegistry.get(connectionProxy.target);
                connectionProxy.modelElement = umlWebClient.getLocal(connectionProxy.modelElement);
                context.context.connection = elementFactory.createConnection(connectionProxy);
            }
            return context.context.connection;
        }
        context.modelElement = umlWebClient.post(context.context.type, {id: context.modelElementID});
        const source = context.context.start;
        const target = context.hover;
        context.context.connection = elementRegistry.get(context.connectionID);
        if (!context.context.connection) {
            context.context.connection = elementFactory.createConnection({
                source: source,
                target: target,
                waypoints: connectRectangles(source, target, getMid(source), getMid(target)),
                id: context.connectionID,
                modelElement: context.modelElement,
                children: [],
            });
        }
        createDiagramEdge(context.context.connection, umlWebClient, diagramContext); // async
        canvas.addConnection(context.context.connection, canvas.findRoot(context.context.hover));
        if (context.cancelBubble) delete context.cancelBubble;
        eventBus.fire('edgeCreate', context);
        graphicsFactory.update('connection', context.context.connection, canvas.getGraphics(context.context.connection));
        diagramEmitter.fire('command', {name: 'edgeCreate', context: {
            hover: {
                id: context.hover.id
            },
            connectionID : context.connectionID,
            modelElementID: context.modelElementID,
            context: {
                type: context.context.type,
                start : {
                    id: context.context.start.id,
                    connectType: context.context.start.connectType
                },
                connection: {
                    id: context.context.connection.id,
                    source: context.context.connection.source.id,
                    target: context.context.connection.target.id,
                    waypoints: context.context.connection.waypoints,
                    modelElement: {id: context.modelElement.id}
                }
            }
        }});
        return context.context.connection;
    }
    revert(context) {
        if (context.proxy) {
            delete context.proxy;
            return;
        }
        const diagramEmitter = this._diagramEmitter,
        eventBus = this._eventBus,
        canvas = this._canvas, 
        umlWebClient = this._umlWebClient;
        diagramEmitter.fire('command', {undo: {
            // TODO
        }});
        if (context.cancelBubble) delete context.cancelBubble;
        eventBus.fire('edgeCreateUndo', context);
        context.context.connection.source.outgoing.splice(context.context.connection.source.outgoing.indexOf(context.context.connection), 1);
        context.context.connection.target.incoming.splice(context.context.connection.target.incoming.indexOf(context.context.connection), 1);
        canvas.removeConnection(context.context.connection);
        for (const label of context.context.connection.labels) {
            deleteUmlDiagramElement(label.id, umlWebClient);
        }
        deleteUmlDiagramElement(context.context.connection.id, umlWebClient); 
        return context.context.connection;
    }
}

EdgeCreatorHandler.$inject = ['umlWebClient', 'diagramContext', 'elementFactory', 'canvas', 'diagramEmitter', 'elementRegistry', 'eventBus', 'graphicsFactory'];

export default class EdgeCreator {
    constructor(commandStack) {
        commandStack.registerHandler('edgeCreate', EdgeCreatorHandler);
    }
}

EdgeCreator.$inject = ['commandStack'];
