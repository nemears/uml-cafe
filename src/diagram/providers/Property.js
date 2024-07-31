import { randomID } from "uml-client/lib/types/element";
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler';
import { getTextDimensions, getTypedElementText, LABEL_HEIGHT, PROPERTY_GAP } from './ClassDiagramPaletteProvider';
import { CLASSIFIER_SHAPE_GAP_HEIGHT } from "./UmlCompartmentableShapeProvider";
import { translateDJElementToUMLDiagramElement, translateDJLabelToUMLLabel, translateDJSCompartmentableShapeToUmlCompartmentableShape } from "../translations";

export const PROPERTY_COMPARTMENT_HEIGHT = 15;

export async function createProperty(property, clazzShape, umlWebClient, umlRenderer, elementFactory, canvas) {
    const compartment = clazzShape.compartments[0];
    if (!compartment) {
        throw Error('Cannot find compartment to put property in bad state!');
    }
    let yPos = compartment.y + CLASSIFIER_SHAPE_GAP_HEIGHT;
    for (const _child of compartment.children) {
        yPos += PROPERTY_GAP;
    }
    if (property.type.has()) {
        await property.type.get();
    }
    const text = getTypedElementText(property);
    const dimensions = getTextDimensions(text, umlRenderer);
    const propertyLabel = elementFactory.createLabel({
        id: randomID(),
        y: yPos,
        x: compartment.x + 5,
        width: Math.round(dimensions.width) + 15,
        height: LABEL_HEIGHT,
        modelElement: property,
        elementType: 'UMLTypedElementLabel',
        labelTarget: compartment,
        parent: compartment,
        text: text,
    });
    if (compartment.y + compartment.height < yPos + PROPERTY_GAP) {
        compartment.height = compartment.y + 2 * compartment.height - yPos + 2 * CLASSIFIER_SHAPE_GAP_HEIGHT;
        clazzShape.height = compartment.height + CLASS_SHAPE_HEADER_HEIGHT;
    }
    if (propertyLabel.width + 15 > compartment.width) {
        compartment.width = propertyLabel.width + 15;
        clazzShape.width = propertyLabel.width + 15;
    }

    canvas.addShape(propertyLabel, compartment);

    return propertyLabel;
}

class CreatePropertyHandler {
    constructor(umlWebClient, umlRenderer, elementFactory, canvas, diagramContext, eventBus, diagramEmitter, diManager) {
        this.umlWebClient = umlWebClient;
        this.umlRenderer = umlRenderer;
        this.elementFactory = elementFactory;
        this.canvas = canvas;
        this.diagramContext = diagramContext;
        this.eventBus = eventBus;
        this.diagramEmitter = diagramEmitter;
        this.diManager = diManager;
    }

    execute(context) {
        if (context.proxy) {
            delete context.proxy;
            return;
        }

        const diManager = this.diManager,
            diagramContext = this.diagramContext;

        const clazzShape = context.clazzShape;
        context.oldBounds = {
            x: clazzShape.x,
            y: clazzShape.y,
            width: clazzShape.width,
            height: clazzShape.height
        };

        this.diagramEmitter.fire('command', {name: 'propertyLabel.create', context: context});

        const compartment = clazzShape.compartments[0];
        if (!compartment) {
            throw Error('could not find compartment in classifier');
        }
        const elsChanged = [clazzShape, ...clazzShape.children, ...compartment.children];
        

        const doLater = async () => {
            for (let property of context.properties) {
                property = this.umlWebClient.getLocal(property.id); // upate if it was deleted
                await createProperty(property, clazzShape, this.umlWebClient, this.umlRenderer, this.elementFactory, this.canvas);
            } 

            for (const property of context.properties) {
                const propertyLabel = compartment.labels[compartment.labels.findIndex(el => el.modelElement.id === property.id)];
                const umlPropertyLabel = diManager.post('UML DI.UMLTypedElementLabel', { id: propertyLabel.id });
                await translateDJLabelToUMLLabel(propertyLabel, umlPropertyLabel, diManager, diagramContext.umlDiagram);
                await diManager.put(umlPropertyLabel);
            }

            const umlClazzShape = await diManager.get(clazzShape.id);
            await translateDJSCompartmentableShapeToUmlCompartmentableShape(clazzShape, umlClazzShape, diManager, diagramContext.umlDiagram);
            const umlCompartment = await diManager.get(compartment.id);
            await translateDJElementToUMLDiagramElement(compartment, umlCompartment, diManager, diagramContext.umlDiagram);
            await diManager.put(umlCompartment);
            await diManager.put(umlClazzShape);

            this.eventBus.fire('compartmentableShape.resize', {
                shape: clazzShape,
                newBounds: clazzShape,
                oldBounds: context.oldBounds,
            });
        };
        doLater();

        
        return elsChanged;
    }

    revert(context) {
        if (context.proxy) {
            delete context.proxy;
            return;
        }
        this.diagramEmitter.fire('command', {undo: {}});
        const compartment = context.clazzShape.compartments[0];
        if (!compartment) {
            throw Error('could not find compartment in classifier');
        }
        const elsToRemove = [];
        for (const child of compartment.children) {
            if (context.properties.includes(child.modelElement)) {
                elsToRemove.push(child);
            }
        }
        for (const el of elsToRemove) {
            const labelIndex = compartment.labels.findIndex(label => label.id === el.id);
            if (labelIndex >= 0) {
                compartment.labels.splice(labelIndex, 1);
            }
            this.canvas.removeShape(el);
            const doLater = async () => {
                await this.diManager.delete(await this.diManager.get(el.id));
            };
            doLater();
        }
        this.eventBus.fire('compartmentableShape.resize', {
            shape: context.clazzShape,
            newBounds: context.oldBounds,
            oldBounds: {
                x: context.clazzShape.x,
                y: context.clazzShape.y,
                width: context.clazzShape.width,
                height: context.clazzShape.height,
            }
        });
        return [context.clazzShape, ...context.clazzShape.children, ...compartment.children];
    }
}

CreatePropertyHandler.$inject = [
    'umlWebClient', 
    'umlRenderer', 
    'elementFactory', 
    'canvas', 
    'diagramContext', 
    'eventBus', 
    'diagramEmitter',
    'diManager'
];

export default class Property extends RuleProvider {
    constructor(eventBus, commandStack, graphicsFactory, canvas, umlWebClient, diManager, diagramContext) {
        super(eventBus)
        commandStack.registerHandler('propertyLabel.create', CreatePropertyHandler);
        eventBus.on('server.update', (event) => {
            if (event.serverElement.elementType() === 'UMLTypedElementLabel') {
                const modelElement = umlWebClient.getLocal(diManager.getLocal(event.serverElement.modelElement.ids().front()).modelElementID);
                if (modelElement.is('Property')) {
                    const serverLabel = event.serverElement,
                    localLabel = event.localElement;
                    const updateLabel = async () => {
                        // this is a bit dubious
                        await translateDJLabelToUMLLabel(localLabel, serverLabel, diManager, diagramContext.umlDiagram);
                        await diManager.put(serverLabel);
                    };
                    const doLater = async () => {
                        const textSplit = localLabel.text.split(' : '); 
                        if (modelElement.name != textSplit[0]) {
                            // update name
                            localLabel.text = modelElement.name + ' : ' + textSplit[1];
                            await updateLabel();        
                            graphicsFactory.update('shape', localLabel, canvas.getGraphics(localLabel));
                        }
                        if (modelElement.type.has() && (await modelElement.type.get()).name != textSplit[1]) {
                            localLabel.text = modelElement.name + ' : ' + (await modelElement.type.get()).name;
                            await updateLabel();
                            graphicsFactory.update('shape', localLabel, canvas.getGraphics(localLabel));
                        }
                    }
                    doLater();
                }
            }
        });
        eventBus.on('uml.remove', (context) => {
            if (context.element.modelElement && context.element.modelElement.elementType() === 'Property') {
                if (context.parent.elementType === 'UMLCompartment') {
                    // TODO readjust compartment children
                    let yPos = context.parent.y + CLASSIFIER_SHAPE_GAP_HEIGHT;
                    for (const child of context.parent.children) {
                        if (child.id === context.element) {
                            throw Error("Bad state child must not be in parent's children!");
                        }
                        child.y = yPos;
                        yPos += PROPERTY_GAP;
                        graphicsFactory.update('shape', child, canvas.getGraphics(child));
                    }
                }
            }
        });
        eventBus.on('uml.remove.undo', (context) => {
            const element = context.element,
            parentContext = context.parentContext;
            if (element.parent.elementType === 'UMLCompartment') {
                // update compartment contents
                let yPos = element.parent.y + CLASSIFIER_SHAPE_GAP_HEIGHT;
                for (const child of parentContext.children) {
                    // adjust shape by shifting
                    child.y = yPos;
                    graphicsFactory.update('shape', child, canvas.getGraphics(child));
                    yPos += PROPERTY_GAP;
                }
            }
        });
    }

    init() {
        this.addRule('elements.move', 1500, (context) => {
            // TODO alter this when drag property to show association
            const shapes = context.shapes;
            for (const shape of shapes) {
                if (shape.modelElement && shape.modelElement.elementType() === 'Property') {
                    if (shape.labelTarget && shape.labelTarget.elementType === 'UMLCompartment') {
                        return false;
                    }
                }
            }
        });
        this.addRule('shape.resize', (context) => {
            if (context.shape.modelElement && context.shape.modelElement.elementType() === 'Property') {
                return false;
            }
        });
    } 
}

Property.$inject = [
    'eventBus', 
    'commandStack', 
    'graphicsFactory', 
    'canvas', 
    'umlWebClient',
    'diManager',
    'diagramContext',
];
