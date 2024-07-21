import { CLASS_SHAPE_HEADER_HEIGHT } from './ClassHandler';

export default class UmlCompartmentProvider {
    constructor(eventBus, elementRegistry, elementFactory, canvas) {
        eventBus.on('selection.changed', 1100, (context) => {
            const selectedCompartments = context.newSelection.filter(el => el.elementType === 'compartment');
            for (const compartment of selectedCompartments) {
                // remove compartment from selection
                context.newSelection.splice(context.newSelection.indexOf(compartment), 1);
                if (!context.newSelection.includes(compartment.parent)) {
                    context.newSelection.push(compartment.parent);
                }
            }
        });
        eventBus.on('shape.move.start', 1600, (event) => {
            const shape = event.shape;
            if (shape.elementType === 'compartment') {
                event.shape = shape.parent;
            }
        });
        eventBus.on('connect.end', 1200, (event) => {
            checkIfCompartmentAndChangeToParent(event.context, 'start');
            checkIfCompartmentAndChangeToParent(event, 'hover');
            checkIfCompartmentAndChangeToParent(event.context, 'target');
            checkIfCompartmentAndChangeToParent(event.context, 'source');
        });
        eventBus.on('server.create', (context) => {
            if (context.serverElement.is('UMLCompartment')) {
                // TODO
                const umlCompartment = context.serverElement;
                const owner = elementRegistry.get(umlCompartment.owningElement.id());
                
                // api puts us before our parent is made so just skip over for now
                if (owner) {
                    const compartment = elementFactory.createShape({
                        id: umlCompartment.id,
                        y: owner.y + CLASS_SHAPE_HEADER_HEIGHT,
                        x: owner.x,
                        width: owner.width,
                        height: owner.height - CLASS_SHAPE_HEADER_HEIGHT,
                        inselectable: true,
                        elementType: context.serverElement.elementType(),
                    });
                    owner.compartments.push(compartment);
                    canvas.addShape(compartment, owner);
                }
            }
        });

        eventBus.on('server.delete', (event) => {
            const element = event.element,
            elementType = element.elementType;
            if (elementType === 'compartment') {
                canvas.removeShape(element);
            }
        });
    }
}

UmlCompartmentProvider.$inject = ['eventBus', 'elementRegistry', 'elementFactory', 'canvas'];

function checkIfCompartmentAndChangeToParent(context, property) {
    if (context[property] && context[property].elementType === 'compartment') {
        context[property].parent.connectType = context[property].connectType; // important
        context[property] = context[property].parent;
    }
}
