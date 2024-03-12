import { createElementUpdate, deleteElementElementUpdate } from "../../umlUtil";
import { createAssociationEndLabel, createClassifierShape, createComparment,
         createCompartmentableShape, createDiagramEdge, createDiagramLabel, createDiagramShape,
         createKeywordLabel, createMultiplicityLabel, createNameLabel, createTypedElementLabel,
         deleteUmlDiagramElement } from "../api/diagramInterchange";

export default class RemoveDiagramElement {
    constructor(commandStack) {
        commandStack.registerHandler('removeDiagramElement', RemoveDiagramElementHandler);
    }
}

RemoveDiagramElement.$inject = ['commandStack'];

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
        eventBus = this._eventBus,
        diagramEmitter = this._diagramEmitter;

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
            await deleteUmlDiagramElement(diagramElement.id, umlWebClient);
            const parent = diagramElement.parent;
            canvas.removeShape(diagramElement);
            eventBus.fire('uml.remove', {
                element: diagramElement,
                parent: parent,
            });
        }

        // delete modelElement if applicable
        if (context.deleteModelElement) {
            for (const elementToRemove of context.elementsToRemove) {
                await deleteUmlDiagramElement(elementToRemove.id, umlWebClient)
            }
            const owner = await context.element.modelElement.owner.get();
            await umlWebClient.deleteElement(context.element.modelElement);
            diagramEmitter.fire('elementUpdate', deleteElementElementUpdate(context.element.modelElement));
            if (owner) {
                umlWebClient.put(owner);
                diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
            }
        }
    }
    execute(context) {
        const diagramEmitter = this._diagramEmitter,
        elementRegistry = this._elementRegistry,
        eventBus = this._eventBus;
        if (context.proxy) {
            delete context.proxy;
            return context.element;
        }

        diagramEmitter.fire('command', {name: 'removeDiagramElement', context: context});

        for (const elementContext of context.elements) {
            
            if (elementContext.deleteModelElement) {
                elementContext.parent = elementContext.element.parent;
                
                const element = elementContext.element;
                const elementsToRemove = [];
                const rawData = {};
                const owner = element.modelElement.owner.unsafe(); // should be good
                rawData[owner.id] = owner.emit();
                const queue = [element];
                while (queue.length > 0) {
                    const front = queue.shift();
                    if (front.modelElement) {
                        rawData[front.modelElement.id] = front.modelElement.emit();
                    }
                    elementsToRemove.unshift(front);
                    for (const child of front.children) {
                        queue.push(child);
                    }
                }
                elementContext.rawData = rawData;
                
                elementContext.elementsToRemove = elementsToRemove;
                elementContext.elementContext = {};
                elementContext.elementContext[elementContext.parent.id] = {
                    children: elementContext.parent.children, // TODO incoming outgoing
                };
            }

            elementContext.parent = elementRegistry.get(elementContext.parent.id);
            elementContext.parent = elementContext.element.parent;
            elementContext.elementContext = {};
            elementContext.elementContext[elementContext.parent.id] = {
                children: elementContext.parent.children, // TODO incoming outgoing
            };
            eventBus.fire('removeElement', elementContext);
        }

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
        if(context.proxy) {
            delete context.proxy;
            return;
        }

        const diagramEmitter = this._diagramEmitter,
        eventBus = this._eventBus,
        umlWebClient = this._umlWebClient;

        diagramEmitter.fire('command', {undo: {
            // TODO
        }});

        const elementsToUpdate = [];
        for (const elementContext of context.elements) {
            if (elementContext.deleteModelElement) {
                for (const rawData of Object.values(elementContext.rawData)) {
                    const parseData = umlWebClient.parse(rawData);
                    const remadeElement = parseData.newElement;
                    elementsToUpdate.push(remadeElement);
                }
                const queue = [elementContext.element.modelElement];
                while (queue.length > 0) {
                    const front = queue.shift();
                    umlWebClient.put(front);
                    for (const ownedEl of front.ownedElements.unsafe()) {
                        queue.push(ownedEl);
                    }
                }
                umlWebClient.put(elementContext.element.modelElement.owner.unsafe());
            }
            eventBus.fire('removeElement.undo', elementContext);
        }
        diagramEmitter.fire('elementUpdate', createElementUpdate(...elementsToUpdate));
        return context.elements.map((elContext) => elContext.element);
    }
}

RemoveDiagramElementHandler.$inject = ['canvas', 'umlWebClient', 'diagramEmitter', 'elementRegistry', 'diagramContext', 'elementFactory', 'eventBus'];