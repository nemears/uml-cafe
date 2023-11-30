import { deleteUmlDiagramElement } from '../api/diagramInterchange';
import { removeShapeAndEdgeFromServer } from './ElementUpdate'; 

/**
 * A example context pad provider.
 */
export default class ClassDiagramContextPadProvider {
  constructor(connect, contextPad, modeling, generalizationHandler, directedComposition, umlWebClient, diagramEmitter) {
    this._connect = connect;
    this._modeling = modeling;
    this._generalizationHandler = generalizationHandler;
    this._directedComposition = directedComposition;
    this._umlWebClient = umlWebClient;
    this._diagramEmitter = diagramEmitter;
  
    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    var modeling = this._modeling,
    generalizationHandler = this._generalizationHandler,
    directedComposition = this._directedComposition,
    umlWebClient = this._umlWebClient,
    diagramEmitter = this._diagramEmitter; 
    
    if (umlWebClient.client.readonly) {
      return {};
    }
    

    async function removeShape() {
        await removeShapeAndEdgeFromServer(element, umlWebClient); 
        modeling.removeShape(element);
    }

    async function removeEdge() {
      await deleteUmlDiagramElement(element.id, umlWebClient);
      modeling.removeConnection(element, umlWebClient);
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

    if (element.modelElement.elementType() === 'class') {
      return {
        'delete': {
          group: 'edit',
          className: 'context-pad-icon-remove',
          title: 'Remove Shape',
          action: {
            click: removeShape,
            dragstart: removeShape
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
        'delete': {
          group: 'edit',
          className: 'context-pad-icon-remove',
          title: 'Remove Edge',
          action: {
            click: removeEdge,
            dragstart: removeEdge
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
    } else if (element.elementType() === 'association') {
      return {
        'delete': {
          group: 'edit',
          className: 'context-pad-icon-remove',
          title: 'Remove Edge',
          action: {
            click: removeEdge,
            dragstart: removeEdge
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

ClassDiagramContextPadProvider.$inject = ['connect', 'contextPad', 'modeling', 'generalizationHandler', 'directedComposition', 'umlWebClient', 'diagramEmitter'];
