class ProxyCommandHandler {
    constructor(diagramEmitter, diagramContext) {
        this._diagramEmitter = diagramEmitter;
        this._diagramContext = diagramContext;
    }

    execute(command) {
        const diagramEmitter = this._diagramEmitter,
        diagramContext = this._diagramContext;
        if (command.context.proxy) {
            delete command.context.proxy;
            return;
        }
        command.redo = diagramContext.diagram.id;
        diagramEmitter.fire('command', command);
    }
    revert(command) {
        if (command.context.proxy) {
            delete command.context.proxy;
            return;
        }
        const diagramEmitter = this._diagramEmitter;
        diagramEmitter.fire('command', {undo: {
            // TODO
        }});
    }
}

ProxyCommandHandler.$inject = ['diagramEmitter', 'diagramContext'];

export default class ProxyCommands {
    constructor (diagramEmitter, commandStack, diagramContext) {
        commandStack.registerHandler('proxy', ProxyCommandHandler);
        diagramEmitter.on('externalCommand', (command) => {
            if (command.element !== diagramContext.umlDiagram.id) {
                commandStack.execute('proxy', command); //pass entire command to proxy
            }
        });
    }
}

ProxyCommands.$inject = ['diagramEmitter', 'commandStack', 'diagramContext'];
