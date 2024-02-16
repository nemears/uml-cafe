export default class EditOnCreate {
    constructor(eventBus, directEditing) {
        eventBus.on('shape.created', (event) => {
            if (event.element.newUMLElement) {
                directEditing.activate(event.element);
            }
        });
    }
}

EditOnCreate.$inject = ['eventBus', 'directEditing'];
