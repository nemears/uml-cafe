import { randomID } from "uml-client/lib/element";

export default class DragFromTree {
    constructor(create, elementFactory, diagramEmitter, umlWebClient) {
        diagramEmitter.on('dragenter', async (event) => {
            console.log('drag entered diagram');
            if (event.draginfo.elementType === 'class') {
                const shapeID = randomID();
                const name = (await umlWebClient.get(event.draginfo.id)).name;
                var shape = elementFactory.createShape({
                    width: 100,
                    height: 80,
                    id: shapeID,
                    elementID: event.draginfo.id,
                    name: name,
                    newUMLElement: false,
                    newShapeElement: true,
                    umlType: 'class'
                });
                create.start(event.event, shape);
            }
        })
    }
}

DragFromTree.$inject = ['create', 'elementFactory', 'diagramEmitter', 'umlWebClient'];
