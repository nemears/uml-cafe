import InstanceValue from "uml-js/lib/instanceValue";
import Relationship from "./Relationship";

export default class GeneralizationHandler extends Relationship {
    constructor(eventBus, dragging, canvas, elementFactory, umlWebClient, diagramEmitter, diagramContext) {
        super('generalization', eventBus, dragging, canvas, elementFactory);

        eventBus.on('generalization.end', async (event) => {
            // check if it can connect
            if (!this.canConnect(event.context)) {
                return;
            }

            // create generalization
            const generalization = await umlWebClient.post('generalization', {id: event.context.relationship.elementID});
            const specific = await umlWebClient.get(event.context.relationship.source.elementID);
            specific.generalizations.add(generalization);
            generalization.general.set(event.context.relationship.target.elementID);
            umlWebClient.put(generalization);
            umlWebClient.put(specific);
            diagramEmitter.fire('generalization.end', {
                type: 'add',
                id: specific.id,
                set: 'generalizations',
                el: generalization.id
            });

            // create shape
            const pathInstance = await umlWebClient.post('instanceSpecification');
            pathInstance.classifiers.add('NKE5JxXD2Cp82Gw0CzsnlgtanuSp');
            const sourceSlot = await umlWebClient.post('slot');
            sourceSlot.definingFeature.set('nW89s4ZaRhGlrwbri3wIQ6AG5PcY');
            const sourceValue = await umlWebClient.post('instanceValue');
            sourceValue.instance.set(event.context.relationship.source.shapeID);
            sourceSlot.values.add(sourceValue);
            pathInstance.slots.add(sourceSlot);
            const targetSlot = await umlWebClient.post('slot')
            targetSlot.definingFeature.set('KrQkyKfJLEoLHucoJlsUn&06GdTi');
            const targetValue = await umlWebClient.post('instanceValue');
            targetValue.instance.set(event.context.relationship.target.shapeID);
            targetSlot.values.add(targetValue);
            pathInstance.slots.add(targetSlot);
            const elementIDSlot = await umlWebClient.post('slot');
            elementIDSlot.definingFeature.set('5aQ4hcDk32eSc3R&84uIyACddmu0');
            const elementIDValue = await umlWebClient.post('literalString');
            elementIDValue.value = event.context.relationship.elementID;
            elementIDSlot.values.add(elementIDValue);
            pathInstance.slots.add(elementIDSlot);
            diagramContext.diagram.packagedElements.add(pathInstance);
            // TODO waypoints maybe?

            umlWebClient.put(diagramContext.diagram);
            umlWebClient.put(pathInstance);
            umlWebClient.put(sourceSlot);
            umlWebClient.put(sourceValue);
            umlWebClient.put(targetSlot);
            umlWebClient.put(targetValue);
            umlWebClient.put(elementIDValue);
            umlWebClient.put(elementIDSlot);
        });
    }

    canConnect(context) {
        return context.hover.umlType && context.hover.umlType === 'class' && context.hover.elementID !== context.start.elementID;
    };
}