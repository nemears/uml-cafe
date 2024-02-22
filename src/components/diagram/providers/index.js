import ClassDiagramContextPadProvider from './ClassDiagramContextPadProvider';
import ClassDiagramPaletteProvider from './ClassDiagramPaletteProvider';
import ClassDiagramRuleProvider from './ClassDiagramRuleProvider';
import ConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking.js'
import DragFromTree from './DragFromTree';
import EdgeCreator from './EdgeCreator';
import ElementCreator from './ElementCreator';
import UMLRenderer from './UMLRenderer';
import GeneralizationHandler from './relationships/GeneralizationHandler';
import Association from './relationships/Association';
import UmlLayouter from './UmlLayouter';
import DoubleClickSpecification from './DoubleClickSpecification';
import ElementUpdate from './ElementUpdate';
import ModelElementMap from './ModelElementMap';
import ProxyCommands from './ProxyCommands';
import UmlContextMenu from './UmlContextMenu';
import NameEditProvider from './NameEditProvider';
import DirectEditing from 'diagram-js-direct-editing/lib/DirectEditing';
import EditOnCreate from './EditOnCreate';
import Property from './Property';
import ClassHandler from './ClassHandler';
import CommentHandler from './CommentHandler';
import UmlShapeProvider from './UmlShapeProvider';
import UmlEdgeProvider from './UmlEdgeProvider';
import UmlLabelProvider from './UmlLabelProvider';
import UserSelection from './UserSelection';

export default {
  __init__: [
    'generalizationHandler',
    'association',
    'classDiagramContextPadProvider',
    'classDiagramPaletteProvider',
    'dragFromTree',
    'classDiagramRuleProvider',
    'edgeCreator',
    'elementCreator',
    'umlRenderer',
    'layouter',
    'connectionDocking',
    'doubleClickSpecification',
    'elementUpdate',
    'modelElementMap',
    'proxyCommands',
    'umlContextMenu',
    'nameEditProvider',
    'directEditing',
    'editOnCreate',
    'property',
    'classHandler',
    'commentHandler',
    'umlShapeProvider',
    'umlEdgeProvider',
    'umlLabelProvider',
    'userSelection',
  ],
  generalizationHandler: ['type', GeneralizationHandler],
  association: ['type', Association],
  classDiagramContextPadProvider: [ 'type', ClassDiagramContextPadProvider ],
  classDiagramPaletteProvider: [ 'type', ClassDiagramPaletteProvider ],
  classDiagramRuleProvider: [ 'type', ClassDiagramRuleProvider ],
  dragFromTree: ['type', DragFromTree],
  edgeCreator: ['type', EdgeCreator],
  elementCreator: ['type', ElementCreator],
  umlRenderer: ['type', UMLRenderer],
  layouter: ['type', UmlLayouter],
  connectionDocking: ['type', ConnectionDocking],
  doubleClickSpecification: ['type', DoubleClickSpecification],
  elementUpdate: ['type', ElementUpdate],
  modelElementMap: ['type', ModelElementMap],
  proxyCommands: ['type', ProxyCommands],
  umlContextMenu: ['type', UmlContextMenu],
  nameEditProvider: ['type', NameEditProvider],
  directEditing: ['type', DirectEditing],
  editOnCreate: ['type', EditOnCreate],
  property: ['type', Property],
  classHandler: ['type', ClassHandler],
  commentHandler: ['type', CommentHandler],
  umlShapeProvider: ['type', UmlShapeProvider],
  umlEdgeProvider: ['type', UmlEdgeProvider],
  umlLabelProvider: ['type', UmlLabelProvider],
  userSelection: ['type', UserSelection],
};
