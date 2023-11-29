import { randomID } from "uml-client/lib/element";
import { createClassShape } from "../api/diagramInterchange";

export default class DragFromTree {
    constructor(create, elementFactory, diagramEmitter, umlWebClient, diagramContext) {
        diagramEmitter.on('dragenter', (event) => {
            console.log('drag entered diagram');
            if (event.element.elementType() === 'class') {
                const shapeID = randomID();
                const shape = elementFactory.createShape({
                    width: 100,
                    height: 80,
                    // TODO uml stuff
                    id: shapeID,
                    elementID: event.element.id,
                    name: event.element.name,
                    newUMLElement: false,
                    newShapeElement: true,
                    umlType: 'class'
                });
                create.start(event.event, shape);
            }
        });
    }
}

DragFromTree.$inject = ['create', 'elementFactory', 'diagramEmitter', 'umlWebClient', 'diagramContext'];