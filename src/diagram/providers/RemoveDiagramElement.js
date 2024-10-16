import { createElementUpdate, deleteElementElementUpdate } from "../../umlUtil";
import { translateDJEdgeToUMLEdge, translateDJElementToUMLDiagramElement, translateDJLabelToUMLLabel, translateDJSCompartmentableShapeToUmlCompartmentableShape, translateDJShapeToUMLShape } from "../translations";

export default class RemoveDiagramElement {
    constructor(commandStack) {
        commandStack.registerHandler('removeDiagramElement', RemoveDiagramElementHandler);
    }
}

RemoveDiagramElement.$inject = ['commandStack'];

class RemoveDiagramElementHandler {
    constructor(canvas, umlWebClient, diagramEmitter, elementRegistry, diagramContext, elementFactory, eventBus, diManager, editorActions) {
        this._canvas = canvas;
        this._umlWebClient = umlWebClient;
        this._diagramEmitter = diagramEmitter;
        this._elementRegistry = elementRegistry;
        this._diagramContext = diagramContext;
        this._elementFactory = elementFactory;
        this._eventBus = eventBus;
        this._diManager = diManager;
        
        eventBus.on('editorActions.init', () => {
            editorActions.unregister('removeSelection');
        });
    }
    async removeElement(diagramElement, context) {
        const canvas = this._canvas,
        umlWebClient = this._umlWebClient,
        eventBus = this._eventBus,
        diagramEmitter = this._diagramEmitter,
        diManager = this._diManager;

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
            await diManager.delete(await diManager.get(diagramElement.id));
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
            const parent = diagramElement.parent;
            const umlDiagramElement = await diManager.get(diagramElement.id);
            if (diagramElement.labelTarget) {
                if (diagramElement.placement === 'source') {
                    diagramElement.labelTarget.numSourceLabels -= 1;   
                }
                if (diagramElement.placement === 'target') {
                    diagramElement.labelTarget.numTargetLabels -= 1;
                }
                if (diagramElement.placement === 'center') {
                    diagramElement.labelTarget.numCenterLabels -= 1;
                }
                let index = diagramElement.labelTarget.labels.indexOf(diagramElement);
                if (index > -1) {
                    diagramElement.labelTarget.labels.splice(diagramElement, 1);
                }
            }
            canvas.removeShape(diagramElement);
            eventBus.fire('uml.remove', {
                element: diagramElement,
                parent: parent,
            });
            await diManager.delete(umlDiagramElement);
        }


    }
    execute(context) {
        const diagramEmitter = this._diagramEmitter,
        elementRegistry = this._elementRegistry,
        diManager = this._diManager,
        diagramContext = this._diagramContext;
        if (context.proxy) {
            delete context.proxy;
            return context.element;
        }

        diagramEmitter.fire('command', {name: 'removeDiagramElement', context: context});

        for (const elementContext of context.elements) {
            if (!elementContext.parent) {
                elementContext.parent = elementContext.element.parent;
            }
            if (elementContext.deleteModelElement) {
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
 
            // eventBus.fire('removeElement', elementContext);
        }
        const doLater = async () => {
            for (const elementContext of context.elements) {
                const owner = elementContext.element.parent;
                await this.removeElement(elementContext.element, elementContext);
                if (!owner) {
                    await diManager.put(diagramContext.umlDiagram);
                } else {
                    const umlOwner = await diManager.get(owner.id);
                    await diManager.put(umlOwner);
                }
                
                // delete modelElement if applicable
                if (elementContext.deleteModelElement) {
                    const owner = await elementContext.element.modelElement.owner.get();
                    await this._umlWebClient.delete(elementContext.element.modelElement);
                    diagramEmitter.fire('elementUpdate', deleteElementElementUpdate(elementContext.element.modelElement));
                    if (owner) {
                        this._umlWebClient.put(owner);
                        diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
                    }
                }

            }
        }
        doLater();

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
        if (element.parent) {
            element.owningElement = element.parent;
        }
    }

    async updateToServer(element, context) {
        const umlWebClient = this._umlWebClient,
        diagramContext = this._diagramContext,
        eventBus = this._eventBus,
        diManager = this._diManager;
        const elementContext = context.elementContext[element.id];
        if (elementContext.modelElementID) {
            element.modelElement = await umlWebClient.get(elementContext.modelElementID);
            await element.modelElement.owner.get();
        }
        switch (element.elementType) {
            case 'UMLShape': {
                const umlShape = await diManager.post('UML DI.UMLShape', { id : element.id });
                await translateDJShapeToUMLShape(element, umlShape, diManager, diagramContext.umlDiagram);
                await diManager.put(umlShape);
                break;
            }
            case 'UMLCompartmentableShape': {
                const umlCompartmentableShape = diManager.post('UML DI.UMLCompartmentableShape', { id : element.id });
                await translateDJSCompartmentableShapeToUmlCompartmentableShape(element, umlCompartmentableShape, diManager, diagramContext.umlDiagram);
                await diManager.put(umlCompartmentableShape);
                break;
            }
            case 'UMLClassifierShape': {
                const umlClassifierShape = diManager.post('UML DI.UMLClassifierShape',  { id : element.id });
                await translateDJSCompartmentableShapeToUmlCompartmentableShape(element, umlClassifierShape, diManager, diagramContext.umlDiagram);
                await diManager.put(umlClassifierShape);
                break;
            }
            case 'UMLCompartment': {
                // const umlCompartment = diManager.post('UML DI.UMLCompartment', { id : element.id });
                // await translateDJElementToUMLDiagramElement(element, umlCompartment, diManager, diagramContext.umlDiagram);
                // await diManager.put(umlCompartment);
                break;
            }
            case 'UMLEdge': {
                const umlEdge = diManager.post('UML DI.UMLEdge', { id : element.id });
                await translateDJEdgeToUMLEdge(element, umlEdge, diManager, diagramContext.umlDiagram);
                await diManager.put(umlEdge);
                break;
            }
            case 'UMLLabel': {
                const umlLabel = diManager.post('UML DI.UMLLabel', { id : element.id });
                await translateDJEdgeToUMLEdge(element, umlLabel, diManager, diagramContext.umlDiagram);
                await diManager.put(umlLabel);
                break;
            }
            case 'UMLNameLabel': {
                const umlNameLabel = diManager.post('UML DI.UMLNameLabel', { id : element.id });
                await translateDJLabelToUMLLabel(element, umlNameLabel, diManager, diagramContext.umlDiagram);
                await diManager.put(umlNameLabel);
                break;
            }
            case 'UMLKeywordLabel': {
                const umlKeywordLabel = diManager.post('UML DI.UMLKeywordLabel', { id : element.id });
                await translateDJLabelToUMLLabel(element, umlKeywordLabel, diManager, diagramContext.umlDiagram);
                await diManager.put(umlKeywordLabel);
                break;
            }
            case 'UMLTypedElementLabel': {
                const umlTypedElementLabel = diManager.post('UML DI.UMLTypedElementLabel', { id : element.id });
                await translateDJLabelToUMLLabel(element, umlTypedElementLabel, diManager, diagramContext.umlDiagram);
                await diManager.put(umlTypedElementLabel);
                break;
            }
            case 'UMLAssociationEndLabel': {
                const umlAssociationElementLabel = diManager.post('UML DI.UMLAssociationEndLabel', { id : element.id });
                await translateDJLabelToUMLLabel(element, umlAssociationElementLabel, diManager, diagramContext.umlDiagram);
                await diManager.put(umlAssociationElementLabel);
                break;
            }
            case 'UMLMultiplicityLabel': {
                const umlMultiplicityLabel = diManager.post('UML DI.UMLMultiplicityLabel', { id : element.id });
                await translateDJLabelToUMLLabel(element, umlMultiplicityLabel, diManager, diagramContext.umlDiagram);
                await diManager.put(umlMultiplicityLabel);
                break;
            }
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

        // have to do this because translateCompartmentableElement function isn't perfect (think about ways to fix)
        if (element.compartments) {
            for (const compartment of element.compartments) {
                await diManager.put(await diManager.get(compartment.id));
            }
        }
        if (!element.waypoints) {
            for (const edge of element.incoming) {
                await this.updateToServer(edge, context);
            }
            for (const edge of element.outgoing) {
                await this.updateToServer(edge, context);
            }
        }
        await diManager.put(diManager.getLocal(element.parent.id));
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
        const doLater = async () => {
            const elementsToUpdate = [];
            for (const elementContext of context.elements) {
                if (elementContext.deleteModelElement) {
                    for (const rawData of Object.values(elementContext.rawData)) {
                        const parseData = await umlWebClient.parse(rawData);
                        const remadeElement = parseData.newElement;
                        elementsToUpdate.push(remadeElement);
                        if (remadeElement.id === elementContext.element.modelElement.id) {
                            elementContext.element.modelElement = remadeElement;
                        }
                    }
                    const queue = [elementContext.element.modelElement];
                    while (queue.length > 0) {
                        const front = queue.shift();
                        umlWebClient.put(front);
                        for await (const ownedEl of front.ownedElements) {
                            queue.push(ownedEl);
                        }
                    }
                    umlWebClient.put(await elementContext.element.modelElement.owner.get());
                }
                this.addElement(elementContext.element, elementContext.parent, elementContext);
                eventBus.fire('removeElement.undo', elementContext);
            }
            diagramEmitter.fire('elementUpdate', createElementUpdate(...elementsToUpdate));
            for (const elementContext of context.elements) {
                await this.updateToServer(elementContext.element, elementContext);
            }
        }
        doLater();
        return context.elements.map((elContext) => elContext.element);
    }
}

RemoveDiagramElementHandler.$inject = [
    'canvas', 
    'umlWebClient', 
    'diagramEmitter', 
    'elementRegistry', 
    'diagramContext', 
    'elementFactory', 
    'eventBus',
    'diManager',
    'editorActions'
];
