import { randomID } from "uml-client/lib/element";
import { getMid } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout'

export default class DragFromTree {
    constructor(create, elementFactory, diagramEmitter) {
        diagramEmitter.on('dragenter', (event) => {
            const elements = [];
            for (const element of event.selectedElements) {
                if (element.elementType() === 'class') {
                    elements.push(elementFactory.createShape({
                        width: 100,
                        height: 80,
                        // TODO uml stuff
                        id: randomID(),
                        modelElement: element,
                        newUMLElement: false,
                        newShapeElement: true,
                    }));
                }
            }
            create.start(event.event, elements);
        });
    }
}

DragFromTree.$inject = ['create', 'elementFactory', 'diagramEmitter'];