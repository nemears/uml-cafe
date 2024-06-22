import { createDiagramElementFeatures } from './diagramElement';
import { fillOutShapeFeatures, Shape } from './shape.js';
import { createStringSlot, createBooleanSlot, fillOutStringSlot } from './util';
import { DIAGRAM_DOCUMENTATION_SLOT_ID, DIAGRAM_HEADING_SLOT_ID, DIAGRAM_IS_FRAME_SLOT_ID, DIAGRAM_IS_INHERITED_LIGHTER_SLOT_ID, DIAGRAM_IS_ISO_SLOT_ID, DIAGRAM_NAME_SLOT_ID, DIAGRAM_RESOLUTION_SLOT_ID } from './ids';

export class Diagram extends Shape {
    // DI
    name =  '';
    documentation = '';
    resolution = ''
    // UML DI
    isFrame = true;
    isIso = true;
    isInheritedLighter = false;
    heading = undefined;
    elementType() {
        return 'diagram';
    }
}



export async function createDiagramFeatures(diagram, diagramInstance, umlWebClient, diagramContext) {
    createStringSlot(DIAGRAM_NAME_SLOT_ID, diagram.name, diagramInstance, umlWebClient);
    createStringSlot(DIAGRAM_DOCUMENTATION_SLOT_ID, diagram.documentation, diagramInstance, umlWebClient);
    createStringSlot(DIAGRAM_RESOLUTION_SLOT_ID, diagram.resolution, diagramInstance, umlWebClient);
    createBooleanSlot(DIAGRAM_IS_FRAME_SLOT_ID, diagram.isFrame === undefined ? true : diagram.isFrame, diagramInstance, umlWebClient);
    createBooleanSlot(DIAGRAM_IS_INHERITED_LIGHTER_SLOT_ID, diagram.isInheritedLighter, diagramInstance, umlWebClient);
    createBooleanSlot(DIAGRAM_IS_ISO_SLOT_ID, diagram.isIso === undefined ? true : diagram.isIso, diagramInstance, umlWebClient);
    const headingSlot = umlWebClient.post('slot');
    headingSlot.definingFeature.set(DIAGRAM_HEADING_SLOT_ID);
    diagramInstance.slots.add(headingSlot);
    if (diagram.heading) {
        const headingValue = umlWebClient.post('instanceValue');
        headingSlot.values.add(headingValue);
        headingValue.instance.set(diagram.heading.id);
        umlWebClient.put(headingValue);
    }
    
    await createDiagramElementFeatures(diagram, umlWebClient,  diagramInstance, diagramContext);

    umlWebClient.put(headingSlot);
}

export async function fillOutDiagramFeatures(diagram, diagramSlot, umlClient) {
    if (diagramSlot.definingFeature.id() === DIAGRAM_NAME_SLOT_ID) {
        await fillOutStringSlot(diagramSlot, diagram, 'name');
    } else if (diagramSlot.definingFeature.id() === DIAGRAM_DOCUMENTATION_SLOT_ID) {
        await fillOutStringSlot(diagramSlot, diagram, 'documentation');
    } else if (diagramSlot.definingFeature.id() === DIAGRAM_RESOLUTION_SLOT_ID) {
        await fillOutStringSlot(diagramSlot, diagram, 'resolution');
    } else if (diagramSlot.definingFeature.id() === DIAGRAM_IS_FRAME_SLOT_ID) {
        await fillOutStringSlot(diagramSlot, diagram, 'isFrame');
    } else if (diagramSlot.definingFeature.id() === DIAGRAM_IS_ISO_SLOT_ID) {
        await fillOutStringSlot(diagramSlot, diagram, 'isIso');
    } else if (diagramSlot.definingFeature.id() === DIAGRAM_IS_INHERITED_LIGHTER_SLOT_ID) {
        await fillOutStringSlot(diagramSlot, diagram, 'isInheritedLighter');
    } else if (diagramSlot.definingFeature.id() === DIAGRAM_HEADING_SLOT_ID) {
        const headingValue = await diagramSlot.values.front();
        if (!headingValue) {
            return;
        }
        if (!headingValue.instance.has()) {
            throw Error("bad heading state, cannot find heading instance!");
        }
        diagram.heading =  headingValue.instance.id();
    } else {
        await fillOutShapeFeatures(diagram, diagramSlot, umlClient);
    }
}
