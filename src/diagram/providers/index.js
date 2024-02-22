import AbstractionHandler from './relationships/AbstractionHandler';
import Association from './relationships/Association';
import ClassDiagramContextPadProvider from './ClassDiagramContextPadProvider';
import ClassDiagramPaletteProvider from './ClassDiagramPaletteProvider';
import ClassDiagramRuleProvider from './ClassDiagramRuleProvider';
import ClassHandler from './ClassHandler';
import CommentHandler from './CommentHandler';
import ConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking.js'
import DataTypeHandler from './DataTypeHandler';
import DragFromTree from './DragFromTree';
import DependencyHandler from './relationships/DependencyHandler';
import DirectEditing from 'diagram-js-direct-editing/lib/DirectEditing';
import DoubleClickSpecification from './DoubleClickSpecification';
import EdgeConnect from './EdgeConnect';
import EditOnCreate from './EditOnCreate';
import ElementCreator from './ElementCreator';
import ElementUpdate from './ElementUpdate';
import EnumerationHandler from './EnumerationHandler';
import GeneralizationHandler from './relationships/GeneralizationHandler';
import InterfaceHandler from './InterfaceHandler';
import ModelElementMap from './ModelElementMap';
import PrimitiveTypeHandler from './PrimitiveTypeHandler';
import Property from './Property';
import ProxyCommands from './ProxyCommands'
import RelationshipEdgeCreator from './RelationshipEdgeCreator';
import RealizationHandler from './relationships/RealizationHandler';
import SignalHandler from './SignalHandler';
import UmlCompartmentProvider from './UmlCompartmentProvider';
import UmlCompartmentableShapeProvider from './UmlCompartmentableShapeProvider';
import UmlContextMenu from './UmlContextMenu';
import UmlDirectEditingProvider from './UmlDirectEditingProvider';
import UmlEdgeProvider from './UmlEdgeProvider';
import UmlLayouter from './UmlLayouter';
import UMLRenderer from './UMLRenderer';
import UmlShapeProvider from './UmlShapeProvider';
import UmlLabelProvider from './UmlLabelProvider';
import UsageHandler from './relationships/UsageHandler';
import UserSelection from './UserSelection';

export default {
    __init__: [
        'abstractionHandler',
        'association',
        'classDiagramContextPadProvider',
        'classDiagramPaletteProvider',
        'classDiagramRuleProvider',
        'classHandler',
        'commentHandler',
        'connectionDocking',
        'dataTypeHandler',
        'dependencyHandler',
        'directEditing',
        'doubleClickSpecification',
        'dragFromTree',
        'edgeConnect',
        'editOnCreate',
        'elementCreator',
        'elementUpdate',
        'enumerationHandler',
        'generalizationHandler',
        'interfaceHandler',
        'layouter',
        'modelElementMap',
        'primitiveTypeHandler',
        'property',
        'proxyCommands',
        'relationshipEdgeCreator',
        'realizationHandler',
        'signalHandler',
        'umlRenderer',
        'umlCompartmentableShapeProvider',
        'umlCompartmentProvider',
        'umlContextMenu',
        'umlShapeProvider',
        'umlEdgeProvider',
        'umlLabelProvider',
        'umlDirectEditingProvider',
        'userSelection',
        'usageHandler',
    ],
    abstractionHandler: ['type', AbstractionHandler],
    association: ['type', Association],
    classDiagramContextPadProvider: [ 'type', ClassDiagramContextPadProvider ],
    classDiagramPaletteProvider: [ 'type', ClassDiagramPaletteProvider ],
    classDiagramRuleProvider: [ 'type', ClassDiagramRuleProvider ],
    classHandler: ['type', ClassHandler],
    commentHandler: ['type', CommentHandler],
    connectionDocking: ['type', ConnectionDocking],
    dataTypeHandler: ['type', DataTypeHandler],
    dependencyHandler: ['type', DependencyHandler],
    directEditing: ['type', DirectEditing],
    doubleClickSpecification: ['type', DoubleClickSpecification],
    dragFromTree: ['type', DragFromTree],
    editOnCreate: ['type', EditOnCreate],
    edgeConnect: ['type', EdgeConnect],
    elementCreator: ['type', ElementCreator],
    elementUpdate: ['type', ElementUpdate],
    enumerationHandler: ['type', EnumerationHandler],
    generalizationHandler: ['type', GeneralizationHandler],
    interfaceHandler: ['type', InterfaceHandler],
    layouter: ['type', UmlLayouter],
    modelElementMap: ['type', ModelElementMap],
    umlContextMenu: ['type', UmlContextMenu],
    primitiveTypeHandler: ['type', PrimitiveTypeHandler],
    property: ['type', Property],
    proxyCommands: ['type', ProxyCommands],
    relationshipEdgeCreator: ['type', RelationshipEdgeCreator],
    realizationHandler: ['type', RealizationHandler],
    signalHandler: ['type', SignalHandler],
    umlCompartmentableShapeProvider: ['type', UmlCompartmentableShapeProvider],
    umlCompartmentProvider: ['type', UmlCompartmentProvider],
    umlDirectEditingProvider: ['type', UmlDirectEditingProvider],
    umlEdgeProvider: ['type', UmlEdgeProvider],
    umlLabelProvider: ['type', UmlLabelProvider],
    umlRenderer: ['type', UMLRenderer],
    umlShapeProvider: ['type', UmlShapeProvider],
    userSelection: ['type', UserSelection],
    usageHandler: ['type', UsageHandler],
};
