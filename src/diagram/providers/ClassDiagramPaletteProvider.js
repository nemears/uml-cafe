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
            'create-data-type': {
                group: 'shape',
                className: 'palette-icon-create-data-type',
                title: 'Create Data Type',
                action: {
                    click: function(event) {
                        const dataTypeID = randomID();
                        const proxyModelElement = {
                            id: dataTypeID,
                            elementType() {
                                return 'dataType';
                            }
                        }
                        const elsToCreate = createClassDiagramClassifierShape(elementFactory, proxyModelElement, true);

                        // start create
                        create.start(event, elsToCreate);
                    }
                }
            },
            'create-enumeration': {
                group: 'shape',
                className: 'palette-icon-create-enumeration',
                title: 'Create Enumeration',
                action: {
                    click: function(event) {
                        const enumerationID = randomID();
                        const proxyModelElement = {
                            id: enumerationID,
                            elementType() {
                                return 'enumeration';
                            }
                        }

                        const elsToCreate = createClassDiagramClassifierShape(elementFactory, proxyModelElement, true);

                        // start create
                        create.start(event, elsToCreate);
                    }
                }
            },
            'create-primitive-type': {
                group: 'shape',
                className: 'palette-icon-create-primitive-type',
                title: 'Create Primitive Type',
                action: {
                    click: function(event) {
                        const primitiveTypeID = randomID();
                        const proxyModelElement = {
                            id: primitiveTypeID,
                            elementType() {
                                return 'primitiveType';
                            }
                        }

                        const elsToCreate = createClassDiagramClassifierShape(elementFactory, proxyModelElement, true);

                        // start create
                        create.start(event, elsToCreate);
                    }
                }
            },
            'create-interface': {
                group: 'shape',
                className: 'palette-icon-create-interface',
                title: 'Create Interface',
                action: {
                    click: function(event) {
                        const interfaceID = randomID();
                        const proxyModelElement = {
                            id: interfaceID,
                            elementType() {
                                return 'interface';
                            }
                        }

                        const elsToCreate = createClassDiagramClassifierShape(elementFactory, proxyModelElement, true);

                        // start create
                        create.start(event, elsToCreate);
                    }
                }
            },
            'create-signal': {
                group: 'shape',
                className: 'palette-icon-create-signal',
                title: 'Create Signal',
                action: {
                    click: function(event) {
                        const signalID = randomID();
                        const proxyModelElement = {
                            id: signalID,
                            elementType() {
                                return 'signal';
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
        x: 0,
        y: CLASS_SHAPE_HEADER_HEIGHT,
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

    // properties
    const properties = [];
    if (modelElement.attributes) {
        let yPos = compartment.y + CLASSIFIER_SHAPE_GAP_HEIGHT;
        for (const property of modelElement.attributes.unsafe()) { // unsafe invocation, attributes must be loaded before this
            let label = property.name;
            if (property.type.has()) {
                label += ' : ' + property.type.unsafe().name;
            }
            const propertyLabel = elementFactory.createLabel({
                id: randomID(),
                y: yPos,
                x: compartment.x,
                width: compartment.width,
                height: 24,
                elementType: 'typedElementLabel',
                labelTarget: compartment,
                parent: compartment,
                text: label,
            }); 
            properties.push(propertyLabel);
            yPos += propertyLabel.height + CLASSIFIER_SHAPE_GAP_HEIGHT;
        }
    }

    return [shape, nameLabel, ...properties];
}