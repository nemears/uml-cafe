import { randomID } from "uml-js/lib/element";

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
      'create-shape': {
        group: 'create',
        className: 'palette-icon-create-shape',
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
              umlType: 'class'
            });

            // var classLabel = elementFactory.createLabel({
            //   width: 25,
            //   height: 10,
            //   labelTarget: shape
            // });

            create.start(event, shape);
          }
        }
      },
      'create-frame': {
        group: 'create',
        className: 'palette-icon-create-frame',
        title: 'Create Frame',
        action: {
          click: function() {
            var shape = elementFactory.createShape({
              width: 300,
              height: 200,
              isFrame: true
            });

            create.start(event, shape);
          }
        }
      }
    };
  }
}

ClassDiagramPaletteProvider.$inject = ['create', 'elementFactory', 'lassoTool', 'palette', 'umlWebClient'];