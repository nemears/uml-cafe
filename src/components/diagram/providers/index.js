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
import UmlContextMenu from './UmlContextMenu';
import DirectEditing from 'diagram-js-direct-editing/lib/DirectEditing';
import EditOnCreate from './EditOnCreate';
import Property from './Property';
import ClassHandler from './ClassHandler';
import CommentHandler from './CommentHandler';
import UmlCompartmentableShapeProvider from './UmlCompartmentableShapeProvider';
import UmlCompartmentProvider from './UmlCompartmentProvider';
import UmlShapeProvider from './UmlShapeProvider';
import UmlEdgeProvider from './UmlEdgeProvider';
import UmlLabelProvider from './UmlLabelProvider';
import UmlDirectEditingProvider from './UmlDirectEditingProvider';
import UserSelection from './UserSelection';
import DependencyHandler from './relationships/DependencyHandler';

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
        'umlContextMenu',
        'directEditing',
        'editOnCreate',
        'property',
        'classHandler',
        'commentHandler',
        'umlCompartmentableShapeProvider',
        'umlCompartmentProvider',
        'umlShapeProvider',
        'umlEdgeProvider',
        'umlLabelProvider',
        'umlDirectEditingProvider',
        'userSelection',
        'dependencyHandler',
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
    umlContextMenu: ['type', UmlContextMenu],
    directEditing: ['type', DirectEditing],
    editOnCreate: ['type', EditOnCreate],
    property: ['type', Property],
    classHandler: ['type', ClassHandler],
    commentHandler: ['type', CommentHandler],
    umlCompartmentableShapeProvider: ['type', UmlCompartmentableShapeProvider],
    umlCompartmentProvider: ['type', UmlCompartmentProvider],
    umlShapeProvider: ['type', UmlShapeProvider],
    umlEdgeProvider: ['type', UmlEdgeProvider],
    umlLabelProvider: ['type', UmlLabelProvider],
    umlDirectEditingProvider: ['type', UmlDirectEditingProvider],
    userSelection: ['type', UserSelection],
    dependencyHandler: ['type', DependencyHandler],
};
