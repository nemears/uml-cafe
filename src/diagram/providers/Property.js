import { randomID } from "uml-client/lib/element";
import { createTypedElementLabel, updateLabel, OWNED_ELEMENTS_SLOT_ID, deleteUmlDiagramElement } from "../api/diagramInterchange";
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler';
import { getTextDimensions, getTypedElementText, LABEL_HEIGHT, PROPERTY_GAP } from './ClassDiagramPaletteProvider';
import { CLASSIFIER_SHAPE_GAP_HEIGHT } from "./UmlCompartmentableShapeProvider";
import { adjustShape } from "./UmlShapeProvider";

export const PROPERTY_COMPARTMENT_HEIGHT = 15;

export function createProperty(property, clazzShape, umlWebClient, umlRenderer, elementFactory, canvas, diagramContext) {
    const compartment = clazzShape.compartments[0];
    if (!compartment) {
        throw Error('Cannot find compartment to put property in bad state!');
    }
    let yPos = compartment.y + CLASSIFIER_SHAPE_GAP_HEIGHT;
    for (const _child of compartment.children) {
        yPos += PROPERTY_GAP;
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
        elementType: 'typedElementLabel',
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
    constructor(umlWebClient, umlRenderer, elementFactory, canvas, diagramContext, eventBus, diagramEmitter) {
        this.umlWebClient = umlWebClient;
        this.umlRenderer = umlRenderer;
        this.elementFactory = elementFactory;
        this.canvas = canvas;
        this.diagramContext = diagramContext;
        this.eventBus = eventBus;
        this.diagramEmitter = diagramEmitter;
    }

    execute(context) {
        if (context.proxy) {
            delete context.proxy;
            return;
        }
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
        for (let property of context.properties) {
            property = this.umlWebClient.getLocal(property.id); // upate if it was deleted
            elsChanged.push(createProperty(property, clazzShape, this.umlWebClient, this.umlRenderer, this.elementFactory, this.canvas, this.diagramContext));
        }

        const doLater = async () => {

            // first adjust shape
            await adjustShape(clazzShape, await this.umlWebClient.get(clazzShape.id), this.umlWebClient);
            
            // adjust compartment, basically just adjusting UmlDiagramElement features
            const compartmentInstance = await this.umlWebClient.get(compartment.id);
            let ownedElementsSlot;
            for await (const compartmentSlot of compartmentInstance.slots) {
                if (compartmentSlot.definingFeature.id() === OWNED_ELEMENTS_SLOT_ID) {
                    ownedElementsSlot = compartmentSlot;
                }
            }
            if (!ownedElementsSlot) {
                // create it
                ownedElementsSlot = this.umlWebClient.post('slot');
                ownedElementsSlot.definingFeature.set(OWNED_ELEMENTS_SLOT_ID);
                this.umlWebClient.put(ownedElementsSlot);
            }

            for (const property of context.properties) {
                const propertyLabel = compartment.labels[compartment.labels.findIndex(el => el.modelElement.id === property.id)];

                // finally add typedElementLabel
                await createTypedElementLabel(propertyLabel, this.umlWebClient, this.diagramContext);
            }

            this.umlWebClient.put(compartmentInstance);
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
            deleteUmlDiagramElement(el.id, this.umlWebClient); //async
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

CreatePropertyHandler.$inject = ['umlWebClient', 'umlRenderer', 'elementFactory', 'canvas', 'diagramContext', 'eventBus', 'diagramEmitter'];

export default class Property extends RuleProvider {
    constructor(eventBus, commandStack, graphicsFactory, canvas, umlWebClient) {
        super(eventBus)
        commandStack.registerHandler('propertyLabel.create', CreatePropertyHandler);
        eventBus.on('server.update', (event) => {
            if (event.serverElement.elementType() === 'typedElementLabel' && event.serverElement.modelElement.elementType() === 'property') {
                const serverLabel = event.serverElement,
                localLabel = event.localElement;
                const doLater = async () => {
                    const textSplit = localLabel.text.split(' : '); 
                    if (serverLabel.modelElement.name != textSplit[0]) {
                        // update name
                        localLabel.text = serverLabel.modelElement.name + ' : ' + textSplit[1];
                        updateLabel(localLabel, umlWebClient);
                        graphicsFactory.update('shape', localLabel, canvas.getGraphics(localLabel));
                    }
                    if (serverLabel.modelElement.type.has() && (await serverLabel.modelElement.type.get()).name != textSplit[1]) {
                        localLabel.text = serverLabel.modelElement.name + ' : ' + (await serverLabel.modelElement.type.get()).name;
                        updateLabel(localLabel, umlWebClient);
                        graphicsFactory.update('shape', localLabel, canvas.getGraphics(localLabel));
                    }
                }
                doLater();
            }
        });
        eventBus.on('uml.remove', (context) => {
            if (context.element.modelElement && context.element.modelElement.elementType() === 'property') {
                if (context.parent.elementType === 'compartment') {
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
            if (element.parent.elementType === 'compartment') {
                // update compartment contents
                let yPos = element.parent.y + CLASSIFIER_SHAPE_GAP_HEIGHT;
                let adjust = false;
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
                if (shape.modelElement && shape.modelElement.elementType() === 'property') {
                    if (shape.labelTarget && shape.labelTarget.elementType === 'compartment') {
                        return false;
                    }
                }
            }
        });
        this.addRule('shape.resize', (context) => {
            if (context.shape.modelElement && context.shape.modelElement.elementType() === 'property') {
                return false;
            }
        });
    } 
}

Property.$inject = ['eventBus', 'commandStack', 'graphicsFactory', 'canvas', 'umlWebClient'];
