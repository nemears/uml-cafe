import Diagram from 'diagram-js';

import ConnectModule from 'diagram-js/lib/features/connect';
import ContextPadModule from 'diagram-js/lib/features/context-pad';
import CreateModule from 'diagram-js/lib/features/create';
import LassoToolModule from 'diagram-js/lib/features/lasso-tool';
import LabelSupport from 'diagram-js/lib/features/label-support';
import ModelingModule from 'diagram-js/lib/features/modeling';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
import MoveModule from 'diagram-js/lib/features/move';
import OutlineModule from 'diagram-js/lib/features/outline';
import PaletteModule from 'diagram-js/lib/features/palette';
import ResizeModule from 'diagram-js/lib/features/resize';
import RulesModule from 'diagram-js/lib/features/rules';
import SelectionModule from 'diagram-js/lib/features/selection';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';

import ProvidersModule from './providers';

/**
 * A module that changes the default diagram look.
 */
const ElementStyleModule = {
  __init__: [
    [ 'defaultRenderer', function(defaultRenderer) {
      // override default styles
      defaultRenderer.CONNECTION_STYLE = { fill: 'none', strokeWidth: 5, stroke: 'var(--vt-c-black-soft)' };
      defaultRenderer.SHAPE_STYLE = { fill: '#ff9955ff', stroke: 'var(--vt-c-black-soft)', strokeWidth: 2 };
      defaultRenderer.FRAME_STYLE = { fill: 'none', stroke: '#000', strokeDasharray: 4, strokeWidth: 2 };
    } ]
  ]
};


/**
 * Our editor constructor
 *
 * @param { { container: Element, additionalModules?: Array<any> } } options
 *
 * @return {Diagram}
 */
export function Editor(options) {

  const {
    container,
    umlWebClient,
    emitter,
    context,
    diagramElement,
    additionalModules = []
  } = options;

  class DiagramUmlClient  {
    client = umlWebClient;
    async post(type, options) {
      return await this.client.post(type, options);
    }
    async get(id) {
      return await this.client.get(id);
    }
    async put(el) {
      return await this.client.put(el);
    }
    async head() {
      return await this.client.head();
    }
  }

  class DiagramEmitter {
    emitter = emitter;
    fire(eventName, event) {
      emitter.emit(eventName, event);
    }
    on(name, logic) {
      emitter.on(name, logic);
    }
  }

  class DiagramContext {
    context = context;
    diagram = diagramElement;
  }

  const umlClientModule = {
    __init__: [
      'umlWebClient',
      'diagramEmitter',
      'diagramContext',
    ],
    umlWebClient: ['type', DiagramUmlClient],
    diagramEmitter: ['type', DiagramEmitter],
    diagramContext: ['type', DiagramContext],
  };

  // default modules provided by the toolbox
  const builtinModules = [
    ConnectModule,
    ContextPadModule,
    CreateModule,
    LassoToolModule,
    LabelSupport,
    ModelingModule,
    MoveCanvasModule,
    MoveModule,
    OutlineModule,
    PaletteModule,
    ResizeModule,
    RulesModule,
    SelectionModule,
    ZoomScrollModule
  ];

  // our own modules, contributing controls, customizations, and more
  const customModules = [
    ProvidersModule,
    ElementStyleModule,
    umlClientModule,
  ];

  return new Diagram({
    canvas: {
      container
    },
    modules: [
      ...builtinModules,
      ...customModules,
      ...additionalModules
    ]
  });
}