import { createClassDiagramClassifierShape } from './ClassDiagramPaletteProvider';

export default class DragFromTree {
    constructor(create, elementFactory, diagramEmitter, umlRenderer) {
        diagramEmitter.on('dragenter', async (event) => {
            const elements = [];
            for (const element of event.selectedElements) {
                if (element.elementType() === 'class') {
                    // load attributes
                    for await (const attr of element.attributes) {
                        if (attr.type.has()) {
                            await attr.type.get();
                        }
                    }
                    const classElements = createClassDiagramClassifierShape(elementFactory, umlRenderer, element);
                    for (const el of classElements) {
                        elements.push(el);
                    }
                }
            }
            create.start(event.event, elements);
        });
    }
}

DragFromTree.$inject = ['create', 'elementFactory', 'diagramEmitter', 'umlRenderer'];
