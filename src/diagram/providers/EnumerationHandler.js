import { createElementUpdate, deleteElementElementUpdate } from '../../umlUtil';

export const CLASS_SHAPE_HEADER_HEIGHT = 40;

export default class EnumerationHandler {
    constructor(eventBus, modeling, umlWebClient, diagramContext, diagramEmitter, canvas) {
        eventBus.on('elementCreated', (event) => {
            const element = event.element;
            if (element.modelElement.elementType() === 'Enumeration') {
                const enumerationID = element.modelElement.id;
                let clazz = umlWebClient.post('Enumeration', {id:enumerationID});
                diagramContext.context.packagedElements.add(clazz);
                umlWebClient.put(clazz);
                umlWebClient.put(diagramContext.context);

                // bfs set modelElement
                const queue = [element];
                while (queue.length > 0) {
                    const front = queue.shift();
                    if (front.modelElement && front.modelElement.id === enumerationID) {
                        front.modelElement = clazz; 
                    }
                    for (const child of front.children) {
                        queue.push(child);
                    }
                }

                diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context));
            }
        });
        eventBus.on('elementDeleted', (event) => {
            const element = event.element;
            if (element.modelElement.elementType() === 'Enumeration') {
                const doLater = async (element) => {
                    const modelElement = await umlWebClient.get(element.modelElement.id);
                    const owner = await modelElement.owner.get();
                    diagramEmitter.fire('elementUpdate', deleteElementElementUpdate(modelElement));
                    await umlWebClient.delete(modelElement);
                    diagramEmitter.fire('elementUpdate', createElementUpdate(owner));
                }
                doLater(element);
                canvas.removeShape(element);
            }
        });

        eventBus.on('selection.changed', 1100, (context) => {
            const selectedCompartments = context.newSelection.filter(el => el.elementType === 'UMLCompartment');
            for (const compartment of selectedCompartments) {
                // remove compartment from selection
                context.newSelection.splice(context.newSelection.indexOf(compartment), 1);
                if (!context.newSelection.includes(compartment.parent)) {
                    context.newSelection.push(compartment.parent);
                }
            }
        });
    }
}

EnumerationHandler.$inject = ['eventBus', 'modeling', 'umlWebClient', 'diagramContext', 'diagramEmitter', 'canvas'];
