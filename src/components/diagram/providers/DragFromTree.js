import { createClassDiagramClassifierShape } from './ClassDiagramPaletteProvider';

export default class DragFromTree {
    constructor(create, elementFactory, diagramEmitter) {
        diagramEmitter.on('dragenter', (event) => {
            const elements = [];
            for (const element of event.selectedElements) {
                if (element.elementType() === 'class') {
                    const classElements = createClassDiagramClassifierShape(elementFactory, element);
                    for (const el of classElements) {
                        elements.push(el);
                    }
                }
            }
            create.start(event.event, elements);
        });
    }
}

DragFromTree.$inject = ['create', 'elementFactory', 'diagramEmitter'];
