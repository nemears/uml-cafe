import { randomID } from "uml-client/lib/element";

/**
 * A example palette provider.
 */
export default class ClassDiagramPaletteProvider {
  constructor(create, elementFactory, lassoTool, palette, umlWebClient, globalConnect, eventBus) {
    this._create = create;
    this._elementFactory = elementFactory;
    this._lassoTool = lassoTool;
    this._palette = palette;
    this.umlWebClient = umlWebClient;
    this._globalConnect = globalConnect;
    this._eventBus = eventBus;
  
    palette.registerProvider(this);
  }

  getPaletteEntries() {
    if (this.umlWebClient.client.readonly) {
      return {};
    }
    const create = this._create,
    elementFactory = this._elementFactory,
    lassoTool = this._lassoTool,
    globalConnect = this._globalConnect,
    eventBus = this._eventBus;

    return {
      'lasso-tool': {
        group: 'tools',
        className: 'palette-icon-lasso-tool',
        title: 'Activate Lasso Tool',
        action: {
          click: function(event) {
            lassoTool.activateSelection(event);
          }
        }
      },
      'tool-separator': {
        group: 'tools',
        separator: true
      },
      'create-class': {
        group: 'create',
        className: 'palette-icon-create-class',
        title: 'Create Class',
        action: {
          click: function(event) {
            const classID = randomID();
            const shapeID = randomID();
            var shape = elementFactory.createShape({
              width: 100,
              height: 80,
              id: shapeID,
              modelElement : {
                id: classID,
                elementType() {
                  return 'class';
                }
              },
              newUMLElement: true,
            });

            create.start(event, shape);
          }
        }
      },
      'create-generalization': {
          group: 'create',
          className: 'palette-icon-create-generalization',
          title: 'Create Generalization',
          action: {
            click: (event) => {
              eventBus.fire('generalization.start');
              globalConnect.start(event); 
            }
          }
      },
      'create-directed-composition': {
        group: 'create',
        className: 'palette-icon-create-directed-composition',
        title: 'Create Directed Composition',
        action: {
            click: (event) => {
                eventBus.fire('directedComposition.start');
                globalConnect.start(event);
            }
        }
      }
    }
  }
}

ClassDiagramPaletteProvider.$inject = ['create', 'elementFactory', 'lassoTool', 'palette', 'umlWebClient', 'globalConnect', 'eventBus'];
