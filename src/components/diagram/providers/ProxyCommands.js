class ProxyCommandHandler {
    constructor(diagramEmitter) {
        this._diagramEmitter = diagramEmitter;
    }

    execute(command) {
        const diagramEmitter = this._diagramEmitter;
        if (command.context.proxy) {
            delete command.context.proxy;
            return;
        }
        command.redo = true;
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

export default class ProxyCommands {
    constructor (diagramEmitter, commandStack, diagramContext) {
        commandStack.registerHandler('proxy', ProxyCommandHandler);
        diagramEmitter.on('externalCommand', (command) => {
            if (command.element !== diagramContext.diagram.id) {
                commandStack.execute('proxy', command); //pass entire command to proxy
            }
        });
    }
}

ProxyCommands.$inject = ['diagramEmitter', 'commandStack', 'diagramContext'];