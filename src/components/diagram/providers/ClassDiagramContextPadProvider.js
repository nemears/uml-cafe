import { removeShapeAndEdgeFromServer } from './ElementUpdate'; 

/**
 * A example context pad provider.
 */
export default class ClassDiagramContextPadProvider {
  constructor(connect, contextPad, modeling, generalizationHandler, directedComposition, umlWebClient) {
    this._connect = connect;
    this._modeling = modeling;
    this._generalizationHandler = generalizationHandler;
    this._directedComposition = directedComposition;
    this._umlWebClient = umlWebClient;
  
    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    var modeling = this._modeling,
    generalizationHandler = this._generalizationHandler,
    directedComposition = this._directedComposition,
    umlWebClient = this._umlWebClient; 
    
    if (umlWebClient.client.readonly) {
      return {};
    }
    

    async function removeShape() {
        await removeShapeAndEdgeFromServer(element, umlWebClient); 
        modeling.removeShape(element);
    }

    function startGeneralization(event, element, autoActivate) {
      generalizationHandler.start(event, element, autoActivate);
    }

    function startDirectedComposition(event, element, autoActivate) {
      directedComposition.start(event, element, autoActivate);
    }

    if (element.umlType === 'class') {
      return {
        'delete': {
          group: 'edit',
          className: 'context-pad-icon-remove',
          title: 'Remove',
          action: {
            click: removeShape,
            dragstart: removeShape
          }
        },
        'createGeneralization': {
          group: 'edit',
          className: 'context-pad-icon-connect',
          title: 'create generalization',
          action: {
            click: startGeneralization,
            dragstart: startGeneralization
          }
        },
        'createDirectedComposition': {
          group: 'edit',
          className: 'context-pad-icon-directed-composition',
          title: 'create directed composition',
          action: {
            click: startDirectedComposition,
            dragstart: startDirectedComposition
          }
        }
      };
    }
    return {};
  }
}

ClassDiagramContextPadProvider.$inject = ['connect', 'contextPad', 'modeling', 'generalizationHandler', 'directedComposition', 'umlWebClient'];
