import { randomID } from "uml-client/lib/element";
import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler' 
import { CLASSIFIER_SHAPE_GAP_HEIGHT } from './UmlCompartmentableShapeProvider';

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
                group: 'shape',
                className: 'palette-icon-create-class',
                title: 'Create Class',
                action: {
                    click: function(event) {
                        const classID = randomID();
                        const proxyModelElement = {
                            id: classID,
                            name: '',
                            elementType() {
                                return 'class';
                            }
                        }

                        const elsToCreate = createClassDiagramClassifierShape(elementFactory, proxyModelElement, true);

                        // start create
                        create.start(event, elsToCreate);
                    }
                }
            },
            'create-generalization': {
                group: 'generalization',
                className: 'palette-icon-create-generalization',
                title: 'Create Generalization',
                action: {
                    click: (event) => {
                        eventBus.fire('generalization.start');
                        globalConnect.start(event); 
                    }
                }
            },
            'create-dependency': {
                group: 'dependency',
                className: 'palette-icon-create-dependency',
                title: 'Create Dependency',
                action: {
                    click: (event) => {
                        eventBus.fire('dependency.start');
                        globalConnect.start(event);
                    }
                }
            },
      'create-usage': {
        group: 'dependency',
        className: 'palette-icon-create-usage',
        title: 'Create Usage',
        action: {
            click: (event) => {
                eventBus.fire('usage.start');
                globalConnect.start(event);
            }
        }
      },
      'create-abstraction': {
        group: 'dependency',
        className: 'palette-icon-create-abstraction',
        title: 'Create Abstraction',
        action: {
            click: (event) => {
                eventBus.fire('abstraction.start');
                globalConnect.start(event);
            }
        }
      },
      'create-realization': {
        group: 'dependency',
        className: 'palette-icon-create-realization',
        title: 'Create Realization',
        action: {
            click: (event) => {
                eventBus.fire('realization.start');
                globalConnect.start(event);
            }
        }
      },
            'create-directed-composition': {
                group: 'association',
                className: 'palette-icon-create-directed-composition',
                title: 'Create Directed Composition',
                action: {
                    click: (event) => {
                        eventBus.fire('directedComposition.start');
                        globalConnect.start(event);
                    }
                }
            },
            'create-composition': {
                group: 'association',
                className: 'palette-icon-create-composition',
                title: 'Create Composition',
                action: {
                    click: (event) => {
                        eventBus.fire('composition.start');
                        globalConnect.start(event);
                    }
                }
            },
            'create-association': {
                group: 'association',
                className: 'palette-icon-create-association',
                title: 'Create Association',
                action: {
                    click: (event) => {
                        eventBus.fire('association.start');
                        globalConnect.start(event);
                    }
                }
            },
            'create-directed-association': {
                group: 'association',
                className: 'palette-icon-create-directed-association',
                title: 'Create Directed Association',
                action: {
                    click: (event) => {
                        eventBus.fire('directedAssociation.start');
                        globalConnect.start(event);
                    }
                }
            },
            'create-bi-directional-association': {
                group: 'association',
                className: 'palette-icon-create-bi-directional-association',
                title: 'Create Bi-directional Association',
                action: {
                    click: (event) => {
                        eventBus.fire('biDirectionalAssociation.start');
                        globalConnect.start(event);
                    }
                }
            }
        }
    }
}

ClassDiagramPaletteProvider.$inject = ['create', 'elementFactory', 'lassoTool', 'palette', 'umlWebClient', 'globalConnect', 'eventBus'];

export function createClassDiagramClassifierShape(elementFactory, modelElement, createModelElement) {
    const shapeID = randomID();
    const compartmentID = randomID();
    const nameLabelID = randomID();

    // create compartment
    const compartment = elementFactory.createShape({
        width: 100,
        height: 80 - CLASS_SHAPE_HEADER_HEIGHT,
        id: compartmentID,
        elementType: 'compartment',
    });
    
    // create classifierShape
    const shape = elementFactory.createShape({
        width: 100,
        height: 80,
        id: shapeID,
        modelElement : modelElement,
        compartments : [compartment],
        createModelElement: createModelElement,
        elementType: 'classifierShape',
    });
    
    // create name label
    const nameLabel = elementFactory.createLabel({
        width: 100, // TODO change to defaults??
        height: 24,
        x: 0,
        y: CLASSIFIER_SHAPE_GAP_HEIGHT,
        labelTarget: shape,
        text: modelElement.name,
        parent: shape,
        id: nameLabelID,
        modelElement: modelElement,
        elementType: 'nameLabel',
        inselectable: true,
    });

    return [shape, nameLabel];
}
