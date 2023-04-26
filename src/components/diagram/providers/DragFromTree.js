import { randomID } from "uml-js/lib/element";

export default class DragFromTree {
    constructor(create, elementFactory, diagramEmitter) {
        diagramEmitter.on('dragenter', (event) => {
            console.log('drag entered diagram');
            if (event.draginfo.elementType === 'class') {
                const shapeID = randomID();
                var shape = elementFactory.createShape({
                    width: 100,
                    height: 80,
                    id: shapeID,
                    elementID: event.draginfo.id,
                    shapeID: shapeID,
                    newUMLElement: false,
                    newShapeElement: true,
                    umlType: 'class'
                });
                create.start(event.event, shape);
            }
        })
    }
}

DragFromTree.$inject = ['create', 'elementFactory', 'diagramEmitter'];