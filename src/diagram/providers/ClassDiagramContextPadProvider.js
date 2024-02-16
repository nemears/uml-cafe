import { createDiagramEdge, createDiagramShape, deleteUmlDiagramElement } from '../api/diagramInterchange';
import { deleteModelElement } from './UmlContextMenu';
import { createCommentClick } from '../../umlUtil';
import { pick } from 'min-dash';

/**
 * A example context pad provider.
 */
export default class ClassDiagramContextPadProvider {
  constructor(connect, contextPad, create, umlWebClient, diagramEmitter, elementFactory, umlContextMenu, commandStack) {
    this._connect = connect;
    this._create = create;
    this._umlWebClient = umlWebClient;
    this._diagramEmitter = diagramEmitter;
    this._elementFactory = elementFactory;
    this._umlContextMenu = umlContextMenu;
    this._commandStack = commandStack;
    
    commandStack.registerHandler('removeDiagramElement', RemoveDiagramElementHandler);
    contextPad.registerProvider(this);
  }

    getContextPadEntries(element) {
        const connect = this._connect,
        umlWebClient = this._umlWebClient,
        diagramEmitter = this._diagramEmitter,
        elementFactory = this._elementFactory,
        create = this._create,
        umlContextMenu = this._umlContextMenu,
        commandStack = this._commandStack;

        if (umlWebClient.client.readonly) {
            return {};
        }


        async function remove() {
            removeDiagramElement(element, commandStack);
        }

        function startGeneralization(event, element, autoActivate) {
            element.connectType = 'generalization';
            connect.start(event, element, autoActivate);
        }

        function startDependency(event, element, autoActivate) {
            element.connectType = 'dependency';
            connect.start(event, element, autoActivate);
        }

        function startUsage(event, element, autoActivate) {
            element.connectType = 'usage';
            connect.start(event, element, autoActivate);
        }

        function startAbstraction(event, element, autoActivate) {
            element.connectType = 'abstraction';
            connect.start(event, element, autoActivate);
        }

        function startRealization(event, element, autoActivate) {
            element.connectType = 'realization';
            connect.start(event, element, autoActivate);
        }

        function startDirectedComposition(event, element, autoActivate) {
            element.connectType = 'directedComposition';
            connect.start(event, element, autoActivate);
        }

        function specification() {
            diagramEmitter.fire('specification', element.modelElement);
        }

        function deleteElementFromModel() {
            deleteModelElement(element, commandStack);
        }

        function contextMenu(event) {
            umlContextMenu.show(event.clientX, event.clientY, element);
        }

        function startCreateCommentClick (event) {
            createCommentClick(event, element, create, elementFactory);
        }

        if (!element.modelElement) {
            return {};
        }

        const ret = {
            'remove': {
                group: 'edit',
                className: 'context-pad-icon-remove',
                title: 'Remove Shape',
                action: {
                    click: remove,
                    dragstart: remove
                }
            },
            'delete': {
                group: 'edit',
                className: 'context-pad-icon-delete',
                title: 'Delete Model Element',
                action: {
                    click: deleteElementFromModel,
                    dragstart: deleteElementFromModel,
                }
            },
            'specification': {
                group: 'edit', // TODO change
                className: 'context-pad-icon-spec',
                title: 'Open Specification',
                action: {
                    click: specification,
                    dragstart: specification,
                }
            },
            'contextmenu': {
                group: 'edit',
                className: 'context-pad-icon-options',
                title: 'Context Menu (Options)',
                action: {
                    click: contextMenu,
                    dragstart: contextMenu,
                }
            },
            'createComment' : {
                group: 'edit',
                className: 'context-pad-icon-comment',
                title: 'Create Comment',
                action: {
                    click: startCreateCommentClick,
                    dragstart: startCreateCommentClick
                }
            }
        };

        if (element.modelElement.elementType() === 'class') {
            ret.createGeneralization = {
                group: 'edit',
                className: 'context-pad-icon-connect',
                title: 'Create Generalization',
                action: {
                    click: startGeneralization,
                    dragstart: startGeneralization
                }
            };
            ret.createDirectedComposition = {
                group: 'edit',
                className: 'context-pad-icon-directed-composition',
                title: 'Create Directed Composition',
                action: {
                    click: startDirectedComposition,
                    dragstart: startDirectedComposition
                }
            }; 
            ret.createComposition = {
                group: 'edit',
                className: 'context-pad-icon-composition',
                title: 'Create Composition',
                action: {
                    click: () => {
                        element.connectType = 'composition';
                        connect.start(event, element); 
                    }
                }
            };
            ret.createDirectedAssociation = {
                group: 'edit',
                className: 'context-pad-icon-directed-association',
                title: 'Create Directed Association',
                action: {
                    click: () => {
                        element.connectType = 'directedAssociation';
                        connect.start(event, element);
                    }
                }
            };
            ret.createAssociation = {
                group: 'edit',
                className: 'context-pad-icon-association',
                title: 'Create Association',
                action: {
                    click: () => {
                        element.connectType = 'association';
                        connect.start(event, element);
                    }
                }
            };
            ret.createBiDirectionalAssociation = {
                group: 'edit',
                className: 'context-pad-icon-bi-directional-association',
                title: 'Create Bi-Directional Association',
                action: {
                    click: () => {
                        element.connectType = 'biDirectionalAssociation';
                        connect.start(event, element);
                    }
                }
            };
        }
        if (element.modelElement.isSubClassOf('namedElement')) {
            ret.createDependency = {
                group: 'edit',
                className: 'context-pad-icon-dependency',
                title: 'Create Dependency',
                action: {
                    click: startDependency,
                    dragstart: startDependency
                }
            };
            ret.createUsage = {
                group: 'edit',
                className: 'context-pad-icon-usage',
                title: 'Create Usage',
                action: {
                    click: startUsage,
                    dragstart: startUsage
                }
            };
            ret.createAbstraction = {
                group: 'edit',
                className: 'context-pad-icon-abstraction',
                title: 'Create Abstraction',
                action: {
                    click: startAbstraction,
                    dragstart: startAbstraction
                }
            };
            ret.createRealization = {
                group: 'edit',
                className: 'context-pad-icon-realization',
                title: 'Create Realization',
                action: {
                    click: startRealization,
                    dragstart: startRealization
                }
            };
        }
        

        return ret;
    }
}

ClassDiagramContextPadProvider.$inject = ['connect', 'contextPad', 'create', 'umlWebClient', 'diagramEmitter', 'elementFactory', 'umlContextMenu', 'commandStack'];

class RemoveDiagramElementHandler {
    constructor(canvas, umlWebClient, diagramEmitter, elementRegistry, diagramContext, elementFactory) {
        this._canvas = canvas;
        this._umlWebClient = umlWebClient;
        this._diagramEmitter = diagramEmitter;
        this._elementRegistry = elementRegistry;
        this._diagramContext = diagramContext;
        this._elementFactory = elementFactory;
    }
    async removeElement(diagramElement) {
        const canvas = this._canvas,
        umlWebClient = this._umlWebClient;
        if (diagramElement.waypoints) {
            for (const child of [...diagramElement.children]) {
                await this.removeElement(child);
            }
            await deleteUmlDiagramElement(diagramElement.id, umlWebClient);
            canvas.removeConnection(diagramElement);
        } else {
            for (const child of [...diagramElement.children]) {
                await this.removeElement(child);
            }
            for (const edge of [...diagramElement.incoming]) {
                await this.removeElement(edge);
            }
            for (const edge of [...diagramElement.outgoing]) {
                await this.removeElement(edge);
            }
            await deleteUmlDiagramElement(diagramElement.id, umlWebClient);
            canvas.removeShape(diagramElement);
        }
    }
    execute(context) {
        const diagramEmitter = this._diagramEmitter,
        elementRegistry = this._elementRegistry,
        elementFactory = this._elementFactory,
        umlWebClient = this._umlWebClient;
        const elementProxy = context.element;
        context.element = elementRegistry.get(context.element.id); // TODO ??? elementFactory?
        if (!context.element) {
            context.element = elementProxy;
            const createElementShape = async () => {
                elementProxy.modelElement = await umlWebClient.get(elementProxy.modelElement.id);
                if (elementProxy.waypoints) {
                    elementProxy.source = elementRegistry.get(elementProxy.source);
                    elementProxy.target = elementRegistry.get(elementProxy.target);
                    context.element = elementFactory.createConnection(elementProxy);
                } else {
                    context.element = elementFactory.createShape(pick(elementProxy, ['x','y','height','width', 'modelElement', 'inselectable', 'elementType']));
                }
            }
            createElementShape();
        }
        context.parent = elementRegistry.get(context.parent.id);
        if (context.proxy) {
            delete context.proxy;
            return context.element;
        }
        context.parent = context.element.parent;
        const simpleElement = {
            id: context.element.id
        }
        if (context.element.waypoints) {
            simpleElement.waypoints = context.element.waypoints;
            simpleElement.target = context.element.target.id;
            simpleElement.source = context.element.source.id;
            simpleElement.children = [];
        } else {
            simpleElement.x = context.element.x;
            simpleElement.y = context.element.y;
            simpleElement.width = context.element.width;
            simpleElement.height = context.element.height;
        }
        simpleElement.modelElement = { id: context.element.modelElement.id };
        diagramEmitter.fire('command', {name: 'removeDiagramElement', context: {
            element: simpleElement,
            parent: {
                id: context.parent.id
            }
        }});
        this.removeElement(context.element);
        return context.element;
    }
    revert(context) {
        const diagramEmitter = this._diagramEmitter,
        canvas = this._canvas,
        umlWebClient = this._umlWebClient,
        diagramContext = this._diagramContext;
        diagramEmitter.fire('command', {undo: {
            // TODO
        }});

        // TODO
        if (context.element.waypoints) {
            canvas.addConnection(context.element, context.parent);
            createDiagramEdge(context.element, umlWebClient, diagramContext);
        } else {
            canvas.addShape(context.element, context.parent);
            createDiagramShape(context.element, umlWebClient, diagramContext);
        }

        return context.element;
    }
}

RemoveDiagramElementHandler.$inject = ['canvas', 'umlWebClient', 'diagramEmitter', 'elementRegistry', 'diagramContext', 'elementFactory'];

export function removeDiagramElement(diagramElement, commandStack) {
    commandStack.execute('removeDiagramElement', {
        element: diagramElement,
        parent: diagramElement.parent
    });
}
