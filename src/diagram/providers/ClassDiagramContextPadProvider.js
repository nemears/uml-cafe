import { createAssociationEndLabel, createClassifierShape, createComparment, createCompartmentableShape, createDiagramEdge, createDiagramLabel, createDiagramShape, createKeywordLabel, createMultiplicityLabel, createNameLabel, createTypedElementLabel, deleteUmlDiagramElement } from '../api/diagramInterchange';
import { createCommentClick } from '../../umlUtil';
import { pick } from 'min-dash';
import { deleteModelElement } from './UmlContextMenu';

/**
 * A example context pad provider.
 */
export default class ClassDiagramContextPadProvider {
  constructor(connect, contextPad, create, umlWebClient, diagramEmitter, elementFactory, umlContextMenu, commandStack) {
    this._connect = connect;
    this._create = create;
    this._umlWebClient = umlWebClient;
    this._diagramEmitter = diagramEmitter;
    this._elementFactory = elementFactory;
    this._umlContextMenu = umlContextMenu;
    this._commandStack = commandStack;
    
    commandStack.registerHandler('removeDiagramElement', RemoveDiagramElementHandler);
    contextPad.registerProvider(this);
  }

    getContextPadEntries(element) {
        const connect = this._connect,
        umlWebClient = this._umlWebClient,
        diagramEmitter = this._diagramEmitter,
        elementFactory = this._elementFactory,
        create = this._create,
        umlContextMenu = this._umlContextMenu,
        commandStack = this._commandStack;

        if (umlWebClient.client.readonly) {
            return {};
        }


        async function remove() {
            removeDiagramElement(element, commandStack);
        }

        function startGeneralization(event, element, autoActivate) {
            element.connectType = 'generalization';
            connect.start(event, element, autoActivate);
        }

        function startDependency(event, element, autoActivate) {
            element.connectType = 'dependency';
            connect.start(event, element, autoActivate);
        }

        function startUsage(event, element, autoActivate) {
            element.connectType = 'usage';
            connect.start(event, element, autoActivate);
        }

        function startAbstraction(event, element, autoActivate) {
            element.connectType = 'abstraction';
            connect.start(event, element, autoActivate);
        }

        function startRealization(event, element, autoActivate) {
            element.connectType = 'realization';
            connect.start(event, element, autoActivate);
        }

        function startDirectedComposition(event, element, autoActivate) {
            element.connectType = 'directedComposition';
            connect.start(event, element, autoActivate);
        }

        function specification() {
            diagramEmitter.fire('specification', element.modelElement);
        }

        function deleteElementFromModel() {
            deleteModelElement(element, commandStack);
        }

        function contextMenu(event) {
            umlContextMenu.show(event.clientX, event.clientY, element);
        }

        function startCreateCommentClick (event) {
            createCommentClick(event, element, create, elementFactory);
        }

        if (!element.modelElement) {
            return {};
        }

        const ret = {
            'remove': {
                group: 'edit',
                className: 'context-pad-icon-remove',
                title: 'Remove Shape',
                action: {
                    click: remove,
                    dragstart: remove
                }
            },
            'delete': {
                group: 'edit',
                className: 'context-pad-icon-delete',
                title: 'Delete Model Element',
                action: {
                    click: deleteElementFromModel,
                    dragstart: deleteElementFromModel,
                }
            },
            'specification': {
                group: 'edit', // TODO change
                className: 'context-pad-icon-spec',
                title: 'Open Specification',
                action: {
                    click: specification,
                    dragstart: specification,
                }
            },
            'contextmenu': {
                group: 'edit',
                className: 'context-pad-icon-options',
                title: 'Context Menu (Options)',
                action: {
                    click: contextMenu,
                    dragstart: contextMenu,
                }
            },
            'createComment' : {
                group: 'edit',
                className: 'context-pad-icon-comment',
                title: 'Create Comment',
                action: {
                    click: startCreateCommentClick,
                    dragstart: startCreateCommentClick
                }
            }
        };

        if (element.modelElement.elementType() === 'class') {
            ret.createGeneralization = {
                group: 'edit',
                className: 'context-pad-icon-connect',
                title: 'Create Generalization',
                action: {
                    click: startGeneralization,
                    dragstart: startGeneralization
                }
            };
            ret.createDirectedComposition = {
                group: 'edit',
                className: 'context-pad-icon-directed-composition',
                title: 'Create Directed Composition',
                action: {
                    click: startDirectedComposition,
                    dragstart: startDirectedComposition
                }
            }; 
            ret.createComposition = {
                group: 'edit',
                className: 'context-pad-icon-composition',
                title: 'Create Composition',
                action: {
                    click: () => {
                        element.connectType = 'composition';
                        connect.start(event, element); 
                    }
                }
            };
            ret.createDirectedAssociation = {
                group: 'edit',
                className: 'context-pad-icon-directed-association',
                title: 'Create Directed Association',
                action: {
                    click: () => {
                        element.connectType = 'directedAssociation';
                        connect.start(event, element);
                    }
                }
            };
            ret.createAssociation = {
                group: 'edit',
                className: 'context-pad-icon-association',
                title: 'Create Association',
                action: {
                    click: () => {
                        element.connectType = 'association';
                        connect.start(event, element);
                    }
                }
            };
            ret.createBiDirectionalAssociation = {
                group: 'edit',
                className: 'context-pad-icon-bi-directional-association',
                title: 'Create Bi-Directional Association',
                action: {
                    click: () => {
                        element.connectType = 'biDirectionalAssociation';
                        connect.start(event, element);
                    }
                }
            };
        }
        if (element.modelElement.isSubClassOf('namedElement')) {
            ret.createDependency = {
                group: 'edit',
                className: 'context-pad-icon-dependency',
                title: 'Create Dependency',
                action: {
                    click: startDependency,
                    dragstart: startDependency
                }
            };
            ret.createUsage = {
                group: 'edit',
                className: 'context-pad-icon-usage',
                title: 'Create Usage',
                action: {
                    click: startUsage,
                    dragstart: startUsage
                }
            };
            ret.createAbstraction = {
                group: 'edit',
                className: 'context-pad-icon-abstraction',
                title: 'Create Abstraction',
                action: {
                    click: startAbstraction,
                    dragstart: startAbstraction
                }
            };
            ret.createRealization = {
                group: 'edit',
                className: 'context-pad-icon-realization',
                title: 'Create Realization',
                action: {
                    click: startRealization,
                    dragstart: startRealization
                }
            };
        }
        

        return ret;
    }
}

ClassDiagramContextPadProvider.$inject = ['connect', 'contextPad', 'create', 'umlWebClient', 'diagramEmitter', 'elementFactory', 'umlContextMenu', 'commandStack'];

class RemoveDiagramElementHandler {
    constructor(canvas, umlWebClient, diagramEmitter, elementRegistry, diagramContext, elementFactory, eventBus) {
        this._canvas = canvas;
        this._umlWebClient = umlWebClient;
        this._diagramEmitter = diagramEmitter;
        this._elementRegistry = elementRegistry;
        this._diagramContext = diagramContext;
        this._elementFactory = elementFactory;
        this._eventBus = eventBus;

        eventBus.on('removeElement', (context) => {
            this.removeElement(context.element, context);
        });
        eventBus.on('removeElement.undo', (context) => {
            this.addElement(context.element, context.parent, context);
            this.updateToServer(context.element, context);
        });
    }
    async removeElement(diagramElement, context) {
        const canvas = this._canvas,
        umlWebClient = this._umlWebClient,
        eventBus = this._eventBus;    
        context.elementContext[diagramElement.id] = {
            children: [...diagramElement.children],
        };
        if (diagramElement.modelElement) {
            context.elementContext[diagramElement.id].modelElementID = diagramElement.modelElement.id;
        }
        if (diagramElement.waypoints) {
            for (const child of [...diagramElement.children]) {
                await this.removeElement(child, context);
            }
            await deleteUmlDiagramElement(diagramElement.id, umlWebClient);
            canvas.removeConnection(diagramElement);
            eventBus.fire('uml.remove', {
                element: diagramElement,
            });
        } else {
            for (const child of [...diagramElement.children]) {
                await this.removeElement(child, context);
            }
            context.elementContext[diagramElement.id].incoming = [...diagramElement.incoming];
            for (const edge of [...diagramElement.incoming]) {
                await this.removeElement(edge, context);
            }
            context.elementContext[diagramElement.id].outgoing = [...diagramElement.outgoing];
            for (const edge of [...diagramElement.outgoing]) {
                await this.removeElement(edge, context);
            }
            //if (diagramElement.compartments) {
            //    for (const compartment of [...diagramElement.compartments]) {
            //        await this.removeElement(compartment, context);
            //    }
            //}
            await deleteUmlDiagramElement(diagramElement.id, umlWebClient);
            const parent = diagramElement.parent;
            canvas.removeShape(diagramElement);
            eventBus.fire('uml.remove', {
                element: diagramElement,
                parent: parent,
            });
        }
    }
    execute(context) {
        const diagramEmitter = this._diagramEmitter,
        elementRegistry = this._elementRegistry,
        elementFactory = this._elementFactory,
        umlWebClient = this._umlWebClient,
        eventBus = this._eventBus;
        if (context.proxy) {
            delete context.proxy;
            return context.element;
        }
        const elementsProxy = [];
        for (const elementContext of context.elements) {
            const elementProxy = elementContext.element;
            elementContext.element = elementRegistry.get(elementContext.element.id); // TODO ??? elementFactory?
            if (!elementContext.element) {
                elementContext.element = elementProxy;
                const createElementShape = async () => {
                    elementProxy.modelElement = await umlWebClient.get(elementProxy.modelElement.id);
                    if (elementProxy.waypoints) {
                        elementProxy.source = elementRegistry.get(elementProxy.source);
                        elementProxy.target = elementRegistry.get(elementProxy.target);
                        elementContext.element = elementFactory.createConnection(elementProxy);
                    } else {
                        elementContext.element = elementFactory.createShape(pick(elementProxy, ['x','y','height','width', 'modelElement', 'inselectable', 'elementType']));
                    }
                }
                createElementShape();
            }
            elementContext.parent = elementRegistry.get(elementContext.parent.id);
            elementContext.parent = elementContext.element.parent;
            const simpleElement = {
                id: elementContext.element.id
            }
            if (elementContext.element.waypoints) {
                simpleElement.waypoints = elementContext.element.waypoints;
                simpleElement.target = elementContext.element.target.id;
                simpleElement.source = elementContext.element.source.id;
                simpleElement.children = [];
            } else {
                simpleElement.x = elementContext.element.x;
                simpleElement.y = elementContext.element.y;
                simpleElement.width = elementContext.element.width;
                simpleElement.height = elementContext.element.height;
            }
            simpleElement.modelElement = { id: elementContext.element.modelElement.id };
            elementsProxy.push( {
                element: simpleElement,
                parent: {
                    id: elementContext.parent.id
                }
            });
            elementContext.elementContext = {};
            elementContext.elementContext[elementContext.parent.id] = {
                children: elementContext.parent.children, // TODO incoming outgoing
            };
            eventBus.fire('removeElement', elementContext);
        }

        diagramEmitter.fire('command', {name: 'removeDiagramElement', context: {
            elements: elementsProxy
        }});

        return context.elements.map((elContext) => elContext.element);
    }

    addElement(element, parent, context) {
        const canvas = this._canvas;
        const elementContext = context.elementContext[element.id];
        if (element.waypoints) {
            canvas.addConnection(element, parent);
            for (const child of elementContext.children) {
                this.addElement(child, element, context);
            }
        } else {
            canvas.addShape(element, parent);
            for (const child of elementContext.children) {
                this.addElement(child, element, context);
            }
            for (const edge of elementContext.incoming) {
                this.addElement(edge, element, context);
            }
            for (const edge of elementContext.outgoing) {
                this.addElement(edge, element, context);
            }
        }
    }

    async updateToServer(element, context) {
        const umlWebClient = this._umlWebClient,
        diagramContext = this._diagramContext,
        eventBus = this._eventBus;
        const elementContext = context.elementContext[element.id];
        if (elementContext.modelElementID) {
            element.modelElement = await umlWebClient.get(elementContext.modelElementID);
            await element.modelElement.owner.get();
        }
        switch (element.elementType) {
            case 'shape':
                await createDiagramShape(element, umlWebClient, diagramContext);
                break;
            case 'compartmentableShape':
                await createCompartmentableShape(element, umlWebClient, diagramContext);
                break;
            case 'classifierShape':
                await createClassifierShape(element, umlWebClient, diagramContext);
                break;
            case 'compartment':
                await createComparment(element, umlWebClient, diagramContext);
                break;
            case 'edge':
                await createDiagramEdge(element, umlWebClient, diagramContext);
                break;
            case 'label':
                await createDiagramLabel(element, umlWebClient, diagramContext);
                break;
            case 'nameLabel':
                await createNameLabel(element, umlWebClient, diagramContext);
                break;
            case 'keywordLabel':
                await createKeywordLabel(element, umlWebClient, diagramContext);
                break;
            case 'typedElementLabel':
                await createTypedElementLabel(element, umlWebClient, diagramContext);
                break;
            case 'associationEndLabel':
                await createAssociationEndLabel(element, umlWebClient, diagramContext);
                break;
            case 'multiplicityLabel':
                await createMultiplicityLabel(element, umlWebClient, diagramContext);
                break;
            default:
                throw Error('unhandled uml di element type: ' + element.elementType);
        }
        eventBus.fire('uml.remove.undo', {
            element: element,
            parentContext: context.elementContext[element.parent.id],
        });
        for (const child of element.children) {
            await this.updateToServer(child, context);
        }
        if (!element.waypoints) {
            for (const edge of element.incoming) {
                await this.updateToServer(edge, context);
            }
            for (const edge of element.outgoing) {
                await this.updateToServer(edge, context);
            }
        }
    }

    revert(context) {
        const diagramEmitter = this._diagramEmitter,
        eventBus = this._eventBus;

        diagramEmitter.fire('command', {undo: {
            // TODO
        }});

        for (const elementContext of context.elements) {
            eventBus.fire('removeElement.undo', elementContext);
        }
        return context.elements.map((elContext) => elContext.element);
    }
}

RemoveDiagramElementHandler.$inject = ['canvas', 'umlWebClient', 'diagramEmitter', 'elementRegistry', 'diagramContext', 'elementFactory', 'eventBus'];

export function removeDiagramElement(diagramElement, commandStack) {
    commandStack.execute('removeDiagramElement', {
        elements: [
            {
                element: diagramElement,
                parent: diagramElement.parent
            }
        ]
    });
}
