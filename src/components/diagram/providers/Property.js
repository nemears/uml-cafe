import { nullID, randomID } from "uml-client/lib/element";
import { createDiagramShape } from "../api/diagramInterchange";
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler';

export const PROPERTY_COMPARTMENT_HEIGHT = 15;

export async function createProperty(property, clazzShape, modelElementMap, modeling, umlWebClient, diagramContext) {
    if (property.association.id() !== nullID()) {
        if (property.type.id() === nullID()) {
            console.warn('bad state, cannot create property, it has an association but no type, that is invalid to be displayed');
            return;
        }

        if (!modelElementMap.get(property.type.id())) {
            // TODO create the type, draw the association
            console.warn('TODO, creating and showing associations and types not implemented yet');
            // TODO maybe just make it a regular property don't show association and class
            // TODO or give user an option to choose
        }
    } else {
        // just draw it as a property shape within the owned class
        const lastShape = clazzShape.children.slice(-1)[0];
        const propertyShapePosition = {
            x: clazzShape.x + 8,
            width: clazzShape.width - 16,
            height: PROPERTY_COMPARTMENT_HEIGHT
        };
        if (lastShape) {
            propertyShapePosition.y = lastShape.y + lastShape.height + 5;
        } else {
            propertyShapePosition.y = clazzShape.y + CLASS_SHAPE_HEADER_HEIGHT;
        }

        // load type and multiplicty before so it can be loaded instantly for renderer
        if (property.type.has()) {
            await property.type.get();
        }

        if (property.lowerValue.has()) {
            await property.lowerValue.get();
        }

        if (property.upperValue.has()) {
            await property.upperValue.get();
        }

        // adjust parent class shape to fit it
        let totalHeight = CLASS_SHAPE_HEADER_HEIGHT + PROPERTY_COMPARTMENT_HEIGHT;
        for (const child of clazzShape.children) {
            totalHeight += 5 + child.height;
        }
        if (totalHeight > clazzShape.height) {
            modeling.resizeShape(
                clazzShape,
                {
                    x: clazzShape.x,
                    y: clazzShape.y,
                    width: clazzShape.width,
                    height: totalHeight,
                }
            );
        }

        const propertyShape = modeling.createShape(
            {
                id: randomID(),
                modelElement: property,
            },
            propertyShapePosition,
            clazzShape
        );
        await createDiagramShape(propertyShape, umlWebClient, diagramContext);
    }
}

export default class Property extends RuleProvider {
    constructor(eventBus) {
        super(eventBus)
    }

    init() {
        this.addRule('elements.move', 1500, (context) => {
            // TODO alter this when drag property to show association
            const shapes = context.shapes;
            for (const shape of shapes) {
                if (shape.modelElement && shape.modelElement.elementType() === 'property') {
                    if (shape.parent && !shape.parent.parent) {
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

Property.$inject = ['eventBus'];
