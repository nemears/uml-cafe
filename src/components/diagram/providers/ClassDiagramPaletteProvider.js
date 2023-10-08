import { randomID } from "uml-client/lib/element";

/**
 * A example palette provider.
 */
export default class ClassDiagramPaletteProvider {
  constructor(create, elementFactory, lassoTool, palette, umlWebClient) {
    this._create = create;
    this._elementFactory = elementFactory;
    this._lassoTool = lassoTool;
    this._palette = palette;
    this.umlWebClient = umlWebClient;
  
    palette.registerProvider(this);
  }

  getPaletteEntries() {
    if (this.umlWebClient.client.readonly) {
      return {};
    }
    var create = this._create,
    elementFactory = this._elementFactory,
    lassoTool = this._lassoTool;

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
              elementID: classID,
              shapeID: shapeID,
              newUMLElement: true,
              umlType: 'class',
            });

            create.start(event, shape);
          }
        }
      }
    };
  }
}

ClassDiagramPaletteProvider.$inject = ['create', 'elementFactory', 'lassoTool', 'palette', 'umlWebClient'];
