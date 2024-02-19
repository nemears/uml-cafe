import { nullID, randomID } from "uml-client/lib/element";
import { createDiagramShape, createTypedElementLabel } from "../api/diagramInterchange";
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler';
import { getTextDimensions, getTypedElementText, LABEL_HEIGHT, PROPERTY_GAP } from './ClassDiagramPaletteProvider';
import { CLASSIFIER_SHAPE_GAP_HEIGHT } from "./UmlCompartmentableShapeProvider";
import { adjustShape } from "./UmlShapeProvider";

export const PROPERTY_COMPARTMENT_HEIGHT = 15;

export async function createProperty(property, clazzShape, umlWebClient, umlRenderer, elementFactory, canvas, diagramContext) {
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
    createTypedElementLabel(propertyLabel, umlWebClient, diagramContext);
    if (compartment.y + compartment.height < yPos + PROPERTY_GAP) {
        compartment.height = compartment.y + 2 * compartment.height - yPos + 2 * CLASSIFIER_SHAPE_GAP_HEIGHT;
        clazzShape.height = compartment.height + CLASS_SHAPE_HEADER_HEIGHT;
    }
    if (propertyLabel.width + 15 > compartment.width) {
        compartment.width = propertyLabel.width + 15;
        clazzShape.width = propertyLabel.width + 15;
    }
    
    const doLater = async () => {
        adjustShape(clazzShape, await umlWebClient.get(clazzShape.id), umlWebClient);
    };
    doLater();

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
        const clazzShape = context.clazzShape;
        context.oldBounds = {
            x: clazzShape.x,
            y: clazzShape.y,
            width: clazzShape.width,
            height: clazzShape.height
        };

        this.diagramEmitter.fire('command', {name: 'resize.compartmentableShape.uml', context: context});

        const compartment = clazzShape.compartments[0];
        if (!compartment) {
            throw Error('could not find compartment in classifier');
        }
        const elsChanged = [clazzShape, ...clazzShape.children, ...compartment.children];
        for (const property of context.properties) {
            elsChanged.push(createProperty(property, clazzShape, this.umlWebClient, this.umlRenderer, this.elementFactory, this.canvas, this.diagramContext));
        }
        this.eventBus.fire('compartmentableShape.resize', {
            shape: clazzShape,
            newBounds: clazzShape,
        });
        return elsChanged;
    }

    revert(context) {
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
            this.canvas.removeShape(el);
        }
        this.eventBus.fire('compartmentableShape.resize', {
            shape: context.clazzShape,
            newBounds: context.oldBounds,
        });
        return [context.clazzShape, ...context.clazzShape.children, ...compartment.children];
    }
}

export default class Property extends RuleProvider {
    constructor(eventBus, commandStack, graphicsFactory, canvas) {
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
                    }
                    if ((await serverLabel.modelElement.type.get()).name != textSplit[1]) {
                        localLabel.text = serverLabel.modelElement.name + ' : ' + (await serverLabel.modelElement.type.get()).name;
                    }
                }
                doLater();
                // update
                graphicsFactory.update('shape', localLabel, canvas.getGraphics(localLabel));
            }
        });
    }

    init() {
        this.addRule('elements.move', 1500, (context) => {
            // TODO alter this when drag property to show association
            const shapes = context.shapes;
            for (const shape of shapes) {
                if (shape.modelElement && shape.modelElement.elementType() === 'property') {
                    if (shape.labelTarget) {
                        return true;
                    }
                    return false;
                }
            }
            return true;
        });
        this.addRule('shape.resize', (context) => {
            if (context.shape.modelElement && context.shape.modelElement.elementType() === 'property') {
                return false;
            }
            return true;
        });
    } 
}

Property.$inject = ['eventBus', 'commandStack', 'graphicsFactory', 'canvas'];
