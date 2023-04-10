/**
 * A example context pad provider.
 */
export default class ClassDiagramContextPadProvider {
  constructor(connect, contextPad, modeling, generalizationHandler, directedComposition) {
    this._connect = connect;
    this._modeling = modeling;
    this._generalizationHandler = generalizationHandler;
    this._directedComposition = directedComposition;
  
    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    var connect = this._connect,
    modeling = this._modeling,
    generalizationHandler = this._generalizationHandler,
    directedComposition = this._directedComposition;

    function removeElement() {
      modeling.removeElements([ element ].concat(element.incoming).concat(element.outgoing));
    }

    function startConnect(event, element, autoActivate) {
      connect.start(event, element, autoActivate);
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
            click: removeElement,
            dragstart: removeElement
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
      return {};
    } 
  }
}