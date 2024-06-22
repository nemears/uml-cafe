import { Diagram, createDiagramFeatures } from './diagram';
import { CLASS_DIAGRAM_ID, DIAGRAM_HEADING_SLOT_ID, DIAGRAM_NAME_SLOT_ID } from './ids';

/**
 * enum NavigabilityNotationKind
 * always
 * oneway
 * never
 **/

export class DiagramWithAssociation extends Diagram {
    isAssociationDotShown = false; // TODO implement
    navigabilityNotation = 'oneway'; // TODO implement
    nonNavigabilityNotation = 'never'; // TODO implement
    elementType() {
        return 'diagramWithAssociation';
    }
}

export class StructureDiagram extends DiagramWithAssociation {
    elementType() {
        return 'structureDiagram';
    }
}

export class ClassDiagram extends StructureDiagram {
    elementType() {
        return 'classDiagram';
    }
}

export async function createClassDiagram(diagram, umlWebClient, diagramContext) {
    const diagramInstance = umlWebClient.post('instanceSpecification', {id: diagram.id});
    diagramInstance.classifiers.add(CLASS_DIAGRAM_ID);

    await createDiagramFeatures(diagram, diagramInstance, umlWebClient, diagramContext);

    // TODO Diagram with associations


    diagramContext.diagram.packagedElements.add(diagramInstance);
    umlWebClient.put(diagramInstance);
    umlWebClient.put(diagramContext.diagram);

    const ret = new ClassDiagram();
    ret.id = diagram.id;
    if (diagram.name) {
        ret.name = diagram.name;
    }
    if (diagram.documentation) {
        ret.documentation = diagram.documentation;
    }
    if (diagram.resolution) {
        ret.resolution = diagram.resolution;
    }
    ret.isFrame = diagram.isFrame === undefined ? true : diagram.isFrame;
    ret.isIso = diagram.isIso === undefined ? true : diagram.isIso;
    ret.isInheritedLighter = diagram.isInheritedLighter ? true : false;
    if (diagram.heading) {
        ret.heading = diagram.heading.id;
    }
    return ret;
}

// TODO remove/ replace
export async function updateClassDiagram(classDiagram, umlWebClient) {
    const diagramInstance = await umlWebClient.get(classDiagram.id);
    for await (const diagramSlot of diagramInstance.slots) {
        if (classDiagram.heading && diagramSlot.definingFeature.id() === DIAGRAM_HEADING_SLOT_ID) {
            let headingValue = await diagramSlot.values.front();
            if (!headingValue) {
                headingValue = umlWebClient.post('instanceValue');
                diagramSlot.values.add(headingValue);
                umlWebClient.put(diagramSlot);
            }
            headingValue.instance.set(classDiagram.heading.id);
            umlWebClient.put(headingValue);
        } else if (classDiagram.name && diagramSlot.definingFeature.id() === DIAGRAM_NAME_SLOT_ID) {
            const headingValue = await diagramSlot.values.front();
            headingValue.value = classDiagram.name;
            umlWebClient.put(headingValue);
        }
        // TODO others
    }
    umlWebClient.put(diagramInstance);
}
