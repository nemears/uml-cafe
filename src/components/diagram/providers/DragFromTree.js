import { randomID } from "uml-client/lib/element";
import { getMid } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout'

export default class DragFromTree {
    constructor(create, elementFactory, elementRegistry, diagramEmitter, modelElementMap) {
        diagramEmitter.on('dragenter', (event) => {
            if (event.element.elementType() === 'class') {
                const shapeID = randomID();
                const shape = elementFactory.createShape({
                    width: 100,
                    height: 80,
                    // TODO uml stuff
                    id: shapeID,
                    modelElement: event.element,
                    newUMLElement: false,
                    newShapeElement: true,
                });
                create.start(event.event, shape);
            } /**else if (event.element.elementType() === 'generalization') {
                // TODO eventually implement when we have time
                // // find target and source
                const specificShapes = modelElementMap.get(event.element.specific.id());
                const generalShapes = modelElementMap.get(event.element.general.id());
                if (specificShapes && generalShapes) {
                    // there are shapes for both
                    if (specificShapes.length > 1 || generalShapes.length > 1) {
                        // there is multiple shapes representing a single model element TODO
                    } else {
                        // trigger render until drop
                        const source = elementRegistry.get(specificShapes[0]);
                        const target = elementRegistry.get(generalShapes[0]);
                        const waypoints = connectRectangles(source, target, getMid(source), getMid(target));
                        const connection = elementFactory.createConnection({
                            waypoints:  waypoints,
                            source: source,
                            target: target,
                            elementID: event.element.id,
                            id: randomID(),
                            umlType: event.element.elementType(),
                        });

                        //  preview it
                        connectionPreview.drawPreview({}, true, connection);
                    }
                }
            }**/
        });
    }
}

DragFromTree.$inject = ['create', 'elementFactory', 'elementRegistry', 'diagramEmitter', 'modelElementMap'];