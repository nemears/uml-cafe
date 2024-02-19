export default class UmlCompartmentProvider {
    constructor(eventBus) {
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
    }
}

UmlCompartmentProvider.$inject = ['eventBus'];

function checkIfCompartmentAndChangeToParent(context, property) {
    if (context[property] && context[property].elementType === 'compartment') {
        context[property].parent.connectType = context[property].connectType; // important
        context[property] = context[property].parent;
    }
}
