import { deleteUmlDiagramElement } from '../api/diagramInterchange';
import { removeShapeAndEdgeFromServer } from './ElementUpdate';
import { deleteModelElement, showContextMenu } from './UmlContextMenu';
import { createCommentClick } from '../../../umlUtil';
import { PROPERTY_COMPARTMENT_HEIGHT } from './Property';

/**
 * A example context pad provider.
 */
export default class ClassDiagramContextPadProvider {
  constructor(connect, contextPad, create, modeling, umlWebClient, diagramEmitter, modelElementMap, elementFactory, elementRegistry, canvas, diagramContext, directEditing) {
    this._connect = connect;
    this._create = create;
    this._modeling = modeling;
    this._umlWebClient = umlWebClient;
    this._diagramEmitter = diagramEmitter;
    this._modelElementMap = modelElementMap;
    this._elementFactory = elementFactory;
    this._elementRegistry = elementRegistry;
    this._canvas = canvas;
    this._diagramContext = diagramContext;
    this._directEditing = directEditing;
  
    contextPad.registerProvider(this);
  }

    getContextPadEntries(element) {
        const connect = this._connect,
        modeling = this._modeling,
        umlWebClient = this._umlWebClient,
        diagramEmitter = this._diagramEmitter,
        modelElementMap = this._modelElementMap,
        elementFactory = this._elementFactory,
        elementRegistry = this._elementRegistry,
        canvas = this._canvas,
        diagramContext = this._diagramContext,
        directEditing = this._directEditing,
        create = this._create;

        if (umlWebClient.client.readonly) {
            return {};
        }


        async function remove() {
            if (element.waypoints) {
                await deleteUmlDiagramElement(element.id, umlWebClient);
                modeling.removeConnection(element);
            } else {
                await removeShapeAndEdgeFromServer(element, umlWebClient); 
                if (element.modelElement.elementType() === 'property' && element.parent.modelElement.isSubClassOf('classifier')){
                    const clazzShape = element.parent;
                    if (!clazzShape.waypoints) {
                        let shiftUp = false;
                        for (const child of clazzShape.children) {
                            if (shiftUp) {
                                modeling.resizeShape(
                                    child,
                                    {
                                        x: child.x,
                                        y: child.y - PROPERTY_COMPARTMENT_HEIGHT - 5,
                                        width: child.width,
                                        height: child.height,
                                    }
                                );
                            }
                            if (child.id === element.id) {
                                shiftUp = true;
                            }
                        }
                    }
                }
                modeling.removeShape(element);
            }
        }

        function startGeneralization(event, element, autoActivate) {
            element.connectType = 'generalization';
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
            deleteModelElement(element, diagramEmitter, umlWebClient, modeling);
        }

        function contextMenu(event) {
            showContextMenu(
                event.clientX, 
                event.clientY, 
                element, 
                umlWebClient, 
                diagramEmitter, 
                modeling, 
                modelElementMap,
                elementFactory, 
                elementRegistry, 
                canvas, 
                diagramContext,
                directEditing,
                create
            );
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
        

        return ret;
    }
}

ClassDiagramContextPadProvider.$inject = ['connect', 'contextPad', 'create', 'modeling', 'umlWebClient', 'diagramEmitter', 'modelElementMap', 'elementFactory', 'elementRegistry', 'canvas', 'diagramContext', 'directEditing'];
