import ClassDiagramContextPadProvider from './ClassDiagramContextPadProvider';
import ClassDiagramPaletteProvider from './ClassDiagramPaletteProvider';
import ClassDiagramRuleProvider from './ClassDiagramRuleProvider';
import DragFromTree from './DragFromTree';
import InteractWithModel from './InteractWithModel';
import UMLRenderer from './UMLRenderer';
import ClassLabel from './ClassLabel';
import GeneralizationHandler from './relationships/GeneralizationHandler';
import DirectedComposition from './relationships/DirectedComposition';

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
    'classLabel',
  ],
  generalizationHandler: ['type', GeneralizationHandler],
  directedComposition: ['type', DirectedComposition],
  classDiagramContextPadProvider: [ 'type', ClassDiagramContextPadProvider ],
  classDiagramPaletteProvider: [ 'type', ClassDiagramPaletteProvider ],
  classDiagramRuleProvider: [ 'type', ClassDiagramRuleProvider ],
  dragFromTree: ['type', DragFromTree],
  interactWithModel: ['type', InteractWithModel],
  umlRenderer: ['type', UMLRenderer],
  classLabel: ['type', ClassLabel],
};