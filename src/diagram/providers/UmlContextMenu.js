import { h } from "vue";
import { createCommentClick } from "../../umlUtil";
import { isPropertyValidForMultiplicityLabel } from "./relationships/Association";

export default class UmlContextMenu {
    constructor(eventBus, diagramEmitter, umlWebClient, modelElementMap, directEditing, create, elementFactory, commandStack, canvas, relationshipEdgeCreator) {    
        this._eventBus = eventBus;
        this._diagramEmitter = diagramEmitter;
        this._umlWebClient = umlWebClient;
        this._modelElementMap = modelElementMap;
        this._directEditing = directEditing;
        this._create = create;
        this._elementFactory = elementFactory;
        this._commandStack = commandStack;
        this._relationshipEdgeCreator = relationshipEdgeCreator;

        const me = this;
        
        eventBus.on('element.contextmenu', (event) => {
            const x = event.originalEvent.clientX,
            y = event.originalEvent.clientY;
            if (!event.originalEvent.ctrlKey) {
                if (event.element.elementType === 'UMLCompartment') {
                    me.show(x, y, event.element.parent);
                } else if (event.element.elementType === 'UMLNameLabel' && event.element.parent != canvas.findRoot(event.element)) {
                    me.show(x,y, event.element.parent);
                } else if (event.element.modelElement) {
                    me.show(x, y, event.element);
                }
                event.originalEvent.preventDefault();
            }
        });
    }
    async show(x, y, element) {
        const umlWebClient = this._umlWebClient, 
        diagramEmitter = this._diagramEmitter, 
        modelElementMap = this._modelElementMap, 
        directEditing = this._directEditing, 
        create = this._create, 
        elementFactory = this._elementFactory,
        commandStack = this._commandStack,
        relationshipEdgeCreator = this._relationshipEdgeCreator;
        const menu = {
            x: x,
            y: y,
            items: []
        };
        menu.items.push({
            label: 'Specification',
            onClick: () => {
                diagramEmitter.fire('specification', element.modelElement);
            }
        });
        if (element.modelElement.is('NamedElement')) {
            menu.items.push({
                label: 'Rename',
                onClick: () => {
                    const findNameLabel = (elThatOwnsNameLabel) => {
                        let nameLabel;
                        for (const child of elThatOwnsNameLabel.children) {
                            if (child.elementType === 'UMLNameLabel') {
                                nameLabel = child;
                                break;
                            }
                        }
                        if (!nameLabel) {
                            throw Error('could not find name label in children of classifierShape!');
                        }
                        return nameLabel;
                    };
                    if (element.elementType === 'UMLClassifierShape') {
                        // find nameLabel
                        let nameLabel = findNameLabel(element);
                        directEditing.activate(nameLabel);
                    } else if (element.elementType === 'UMLKeywordLabel') {
                        const nameLabel = findNameLabel(element.labelTarget);
                        directEditing.activate(nameLabel);
                    } else {
                        directEditing.activate(element);
                    }
                }
            });
        } else if (element.modelElement.is('Comment')) {
            menu.items.push({
                label: 'Edit Body',
                onClick: () => {
                    directEditing.activate(element);
                }
            });
        }
        menu.items.push({
            label: 'Remove Element',
            shortcut: 'Del',
            disabled: umlWebClient.readonly,
            onClick: () => {
                commandStack.execute('removeDiagramElement', {
                    elements: [
                        {
                            element: element,
                            parent: element.parent
                        }
                    ]
                });
            }
        });
        menu.items.push({
            label: 'Delete Element',
            shortcut: 'Ctrl + Del',
            disabled: umlWebClient.readonly,
            onClick: () => {
                commandStack.execute('removeDiagramElement', {
                    elements: [
                        {
                            element: element,
                            parent: element.parent,
                            deleteModelElement: true,
                        }
                    ]
                });
            }
        });
        // styles
        if (element.elementType === 'UMLClassifierShape') {
            menu.items.push({
                label: 'Edit Shape Properties',
                disabled: umlWebClient.readonly,
                onClick: () => {
                    // TODO
                    throw Error('TODO');
                }
            });
        }
        menu.items.push({
            label: 'Create Comment',
            disabled: umlWebClient.readonly,
            onClick: (event) => {
                createCommentClick(event, element, create, elementFactory);
            }
        });
        if (element.modelElement.is('Classifier') && !element.modelElement.is('Association')) {
            // show relationships
            const showRelationshipsOption = {
                label: 'Show Relationships',
                children: []
            };
            const showPropertiesOption = {
                label: 'Show Properties',
                children: []
            };
            const associations = [];
            if (element.modelElement.attributes.size() !== 0) {
                showPropertiesOption.children.push({
                    label: 'Show All',
                    disabled: umlWebClient.readonly,
                    onClick: async () => {
                        const context = {
                            clazzShape: element,
                            properties: []
                        };
                        for await (const property of element.modelElement.attributes) {
                            if (!modelElementMap.get(property.id)) {
                                context.properties.push(property);
                            }
                        }
                        commandStack.execute('propertyLabel.create', context);
                    }
                });
                for await (const property of element.modelElement.attributes) {
                    if (property.association.has()) {
                        associations.push(await property.association.get());
                    }
                    const propertyOption = {
                        label: property.name,
                        icon: h('img', {
                            src: require('../../assets/icons/general/property.svg')
                        }),
                        disabled: umlWebClient.readonly,
                    };
                    if (!modelElementMap.get(property.id)) {
                        propertyOption.onClick = () => {
                            const context = {
                                clazzShape: element,
                                properties: [property],
                            };
                            commandStack.execute('propertyLabel.create', context);
                        }
                    } else {
                        propertyOption.disabled = true;
                    }
                    showPropertiesOption.children.push(propertyOption);
                }
            } else {
                showPropertiesOption.disabled = true;
            }
            if (!(element.modelElement.generalizations.size() === 0 && element.modelElement.clientDependencies === 0 && associations.length === 0)) {
                showRelationshipsOption.children.push({
                    label: 'Show All',
                    disabled: umlWebClient.readonly,
                    onClick: async () => {
                        const edgesToCreate = [];
                        for await (const generalization of element.modelElement.generalizations) {
                            if (!modelElementMap.get(generalization.id)) {
                                edgesToCreate.push(generalization);
                            }
                        }
                        for await (const dependency of element.modelElement.clientDependencies) {
                            if (!modelElementMap.get(dependency.id)) {
                                edgesToCreate.push(dependency);
                            }
                        }
                        for (const association of associations) {
                            if (!modelElementMap.get(association.id)) {
                                edgesToCreate.push(association);
                            }
                        }
                        relationshipEdgeCreator.create({
                            elements: edgesToCreate,
                            source: element
                        });
}
                });
                for await (const generalization of element.modelElement.generalizations) {
                    showRelationshipsOption.children.push({
                        label: (await generalization.general.get()).name,
                        icon: h('img', {
                            src: require('../../assets/icons/general/generalization.svg')
                        }),
                        disabled: umlWebClient.readonly || modelElementMap.get(generalization.id) !== undefined,
                        onClick: () => {
                            relationshipEdgeCreator.create({
                                elements: [generalization]
                            });
                        }
                    });
                }
                for (const association of associations) {
                    showRelationshipsOption.children.push({
                        label: await association.name, // TODO better label
                        icon: h('img', {
                            src: require('../../assets/icons/general/association.svg')
                        }),
                        disabled: umlWebClient.readonly || modelElementMap.get(association.id) !== undefined,
                        onClick: () => {
                            relationshipEdgeCreator.create({
                                elements: [association]
                            });
                        }
                    });
                }
                for await (const dependency of element.modelElement.clientDependencies) {
                    showRelationshipsOption.children.push({
                        label: (await dependency.suppliers.front()).name,
                        icon: h('img', {
                            src: require('../../assets/icons/general/dependency.svg')
                        }),
                        disabled: umlWebClient.readonly || modelElementMap.get(dependency.id) !== undefined,
                        onClick: () => {
                            relationshipEdgeCreator.create({
                                elements: [dependency]
                            });
                        }
                    });
                }
            } else {
                showRelationshipsOption.disabled = true;
            }
            menu.items.push(showRelationshipsOption);
            menu.items.push(showPropertiesOption);
        }
        if (element.modelElement.is('Association')) {
            const showMemberEndsOption = {
                label: 'Show Member Ends',
                children: []
            };

            // show all
            const showAllOption = {
                label: 'Show All',
                icon: h('img', {
                    src: require('../../assets/icons/general/property.svg')
                }),
                disabled: umlWebClient.readonly,
            };
            showAllOption.onClick = async () => {
                // TODO / In Progress
                const ends = [];
                for await (const end of element.modelElement.memberEnds) {
                    ends.push(end);
                }
                commandStack.execute('memberEnds.show', {
                    edge: element,
                    ends: ends,
                });
                
            };
            showMemberEndsOption.children.push(showAllOption);

            for await (const memberEnd of element.modelElement.memberEnds) {
                const memberEndOption = {
                    label: memberEnd.name,
                    icon: h('img', {
                        src: require('../../assets/icons/general/property.svg')
                    }),
                    disabled: umlWebClient.readonly,
                };
                let isValid = false;
                let associationEndLabel = undefined;
                let multiplicityLabel = undefined;
                for (const child of element.children) {
                    if (child.modelElement.id !== memberEnd.id) {
                        continue;
                    }
                    if (child.elementType === 'associationEndLabel') {
                        associationEndLabel = child;
                    } else if (child.elementType === 'multiplicityLabel') {
                        multiplicityLabel = child;
                    }
                }
                if (
                    (!associationEndLabel && memberEnd.name.length !== 0) ||
                    (!multiplicityLabel && (await isPropertyValidForMultiplicityLabel(memberEnd)))
                ) {
                    isValid = true;
                }
                if (isValid) {
                    memberEndOption.onClick = () => {
                        // TODO
                        commandStack.execute('memberEnds.show', {
                            edge: element,
                            ends: [memberEnd],
                        })
                    }
                } else {
                    memberEndOption.disabled = true;
                }
                showMemberEndsOption.children.push(memberEndOption);
            }

            menu.items.push(showMemberEndsOption);
        }
        menu.theme = 'flat';
        diagramEmitter.fire('contextmenu', menu);
    }
}

UmlContextMenu.$inject = [
    'eventBus', 
    'diagramEmitter', 
    'umlWebClient', 
    'modelElementMap', 
    'directEditing', 
    'create', 
    'elementFactory', 
    'commandStack', 
    'canvas', 
    'relationshipEdgeCreator'
];
