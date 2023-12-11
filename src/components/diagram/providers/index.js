import ClassDiagramContextPadProvider from './ClassDiagramContextPadProvider';
import ClassDiagramPaletteProvider from './ClassDiagramPaletteProvider';
import ClassDiagramRuleProvider from './ClassDiagramRuleProvider';
import ConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking.js'
import DragFromTree from './DragFromTree';
import InteractWithModel from './InteractWithModel';
import UMLRenderer from './UMLRenderer';
import GeneralizationHandler from './relationships/GeneralizationHandler';
import DirectedComposition from './relationships/DirectedComposition';
import UmlLayouter from './UmlLayouter';
import DoubleClickSpecification from './DoubleClickSpecification';
import ElementUpdate from './ElementUpdate';
import ModelElementMap from './ModelElementMap';
import UmlContextMenu from './UmlContextMenu';
import NameEditProvider from './NameEditProvider';
import DirectEditing from 'diagram-js-direct-editing/lib/DirectEditing';
import EditOnCreate from './EditOnCreate';

export default {
  __init__: [
    'generalizationHandler',
    'directedComposition',
    'classDiagramContextPadProvider',
    'classDiagramPaletteProvider',
    'dragFromTree',
    'classDiagramRuleProvider',
    'interactWithModel',
    'umlRenderer',
    'layouter',
    'connectionDocking',
    'doubleClickSpecification',
    'elementUpdate',
    'modelElementMap',
    'umlContextMenu',
    'nameEditProvider',
    'directEditing',
    'editOnCreate',
  ],
  generalizationHandler: ['type', GeneralizationHandler],
  directedComposition: ['type', DirectedComposition],
  classDiagramContextPadProvider: [ 'type', ClassDiagramContextPadProvider ],
  classDiagramPaletteProvider: [ 'type', ClassDiagramPaletteProvider ],
  classDiagramRuleProvider: [ 'type', ClassDiagramRuleProvider ],
  dragFromTree: ['type', DragFromTree],
  interactWithModel: ['type', InteractWithModel],
  umlRenderer: ['type', UMLRenderer],
  layouter: ['type', UmlLayouter],
  connectionDocking: ['type', ConnectionDocking],
  doubleClickSpecification: ['type', DoubleClickSpecification],
  elementUpdate: ['type', ElementUpdate],
  modelElementMap: ['type', ModelElementMap],
  umlContextMenu: ['type', UmlContextMenu],
  nameEditProvider: ['type', NameEditProvider],
  directEditing: ['type', DirectEditing],
  editOnCreate: ['type', EditOnCreate],
};
