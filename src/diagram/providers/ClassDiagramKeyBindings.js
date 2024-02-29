export default class ClassDiagramKeyBindings {
    constructor(keyboard, commandStack, selection) {
        keyboard.addListener((context) => {
            if (context.keyEvent.key === 'Delete' && !context.keyEvent.ctrlKey) {
                // remove shape
                const elements = [];
                for (const el of selection.get()) {
                    elements.push({
                        element: el,
                        parent: el.parent,
                    });
                }
                commandStack.execute('removeDiagramElement', {
                    elements: elements
                });
            } else if ((context.keyEvent.key === 'd' && context.keyEvent.ctrlKey) || (context.keyEvent.key === 'Delete' && context.keyEvent.ctrlKey)) {
                // delete element
                const elements = [];
                for (const el of selection.get()) {
                    elements.push({
                        element: el,
                        parent: el.parent,
                    });
                }
                commandStack.execute('deleteModelElement', {
                    elements: elements
                });
            }
        })
    }
}