import { deleteUmlDiagramElement } from '../api/diagramInterchange';
import { removeShapeAndEdgeFromServer } from './ElementUpdate';
import { deleteModelElement, showContextMenu } from './UmlContextMenu';

/**
 * A example context pad provider.
 */
export default class ClassDiagramContextPadProvider {
  constructor(connect, contextPad, modeling, generalizationHandler, directedComposition, umlWebClient, diagramEmitter, modelElementMap, elementRegistry, canvas, diagramContext) {
    this._connect = connect;
    this._modeling = modeling;
    this._generalizationHandler = generalizationHandler;
    this._directedComposition = directedComposition;
    this._umlWebClient = umlWebClient;
    this._diagramEmitter = diagramEmitter;
    this._modelElementMap = modelElementMap;
    this._elementRegistry = elementRegistry;
    this._canvas = canvas;
    this._diagramContext = diagramContext;
  
    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    const modeling = this._modeling,
    generalizationHandler = this._generalizationHandler,
    directedComposition = this._directedComposition,
    umlWebClient = this._umlWebClient,
    diagramEmitter = this._diagramEmitter,
    modelElementMap = this._modelElementMap,
    elementRegistry = this._elementRegistry,
    canvas = this._canvas,
    diagramContext = this._diagramContext;
    
    if (umlWebClient.client.readonly) {
      return {};
    }
    

    async function removeShape() {
        await removeShapeAndEdgeFromServer(element, umlWebClient); 
        modeling.removeShape(element);
    }

    async function removeEdge() {
      await deleteUmlDiagramElement(element.id, umlWebClient);
      modeling.removeConnection(element);
    }

    function startGeneralization(event, element, autoActivate) {
      generalizationHandler.start(event, element, autoActivate);
    }

    function startDirectedComposition(event, element, autoActivate) {
      directedComposition.start(event, element, autoActivate);
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
        elementRegistry, 
        canvas, 
        diagramContext);
    }

    if (element.modelElement.elementType() === 'class') {
      return {
        'remove': {
          group: 'edit',
          className: 'context-pad-icon-remove',
          title: 'Remove Shape',
          action: {
            click: removeShape,
            dragstart: removeShape
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
        'createGeneralization': {
          group: 'edit',
          className: 'context-pad-icon-connect',
          title: 'Create Generalization',
          action: {
            click: startGeneralization,
            dragstart: startGeneralization
          }
        },
        'createDirectedComposition': {
          group: 'edit',
          className: 'context-pad-icon-directed-composition',
          title: 'Create Directed Composition',
          action: {
            click: startDirectedComposition,
            dragstart: startDirectedComposition
          }
        }
      };
    } else if (element.modelElement.elementType() === 'generalization') {
      return {
        'remove': {
          group: 'edit',
          className: 'context-pad-icon-remove',
          title: 'Remove Edge',
          action: {
            click: removeEdge,
            dragstart: removeEdge
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
      }
    } else if (element.modelElement.elementType() === 'association') {
      return {
        'remove': {
          group: 'edit',
          className: 'context-pad-icon-remove',
          title: 'Remove Edge',
          action: {
            click: removeEdge,
            dragstart: removeEdge
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
      }
    }
    return {};
  }
}

ClassDiagramContextPadProvider.$inject = ['connect', 'contextPad', 'modeling', 'generalizationHandler', 'directedComposition', 'umlWebClient', 'diagramEmitter', 'modelElementMap', 'elementRegistry', 'canvas', 'diagramContext'];