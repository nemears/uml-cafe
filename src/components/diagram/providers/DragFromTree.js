import { randomID } from "uml-client/lib/element";
import { createClassShape } from "../api/diagramInterchange";

export default class DragFromTree {
    constructor(create, elementFactory, diagramEmitter, umlWebClient, diagramContext) {
        diagramEmitter.on('dragenter', (event) => {
            console.log('drag entered diagram');
            if (event.draginfo.elementType === 'class') {
                const shapeID = randomID();
                // const name = (await umlWebClient.get(event.draginfo.id)).name;
                const shape = elementFactory.createShape({
                    width: 100,
                    height: 80,
                    // TODO uml stuff
                    update: true, // just saying it is from the backend
                    id: shapeID,
                    elementID: event.draginfo.id,
                    name: event.draginfo.name,
                    newUMLElement: false,
                    newShapeElement: true,
                    umlType: 'class'
                });
                event.draginfo.mouseEvent.pointers = [event.event];
                event.draginfo.mouseEvent.originalEvent = event.event;
                // await createClassShape(shape, umlWebClient, diagramContext);
                create.start(event.draginfo.mouseEvent, shape);
            }
        });
    }
}

DragFromTree.$inject = ['create', 'elementFactory', 'diagramEmitter', 'umlWebClient', 'diagramContext'];