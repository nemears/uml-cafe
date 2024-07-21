import { createCommentClick } from '../../umlUtil';

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
            commandStack.execute('removeDiagramElement', {
                elements: [
                    {
                        element: element,
                        parent: element.parent,
                    }
                ]
            });
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
            commandStack.execute('removeDiagramElement', {
                elements: [
                    {
                        element: element,
                        parent: element.parent,
                        deleteModelElement: true,
                    }
                ]
            });
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
        if (element.elementType === 'ClassDiagram') {
            return {};
        }

        const ret = {
            'remove': {
                group: 'edit',
                className: 'context-pad-icon-remove',
                title: 'Remove Shape',
                action: () => {
                    remove(element);
                },
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

        if (element.modelElement.elementType() === 'Class') {
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
        if (element.modelElement.is('NamedElement')) {
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
