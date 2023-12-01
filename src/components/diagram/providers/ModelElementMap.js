export default class ModelElementMap {

    modelElements = new Map();

    constructor(elementRegistry, eventBus) {
        const me = this;
        elementRegistry.forEach((element) => {
            if (element.elementID) {
                me.modelElements.set(element.elementID, element.id);
            }
        });
        eventBus.on('shape.added', (event) => {
            me.set(event.element.modelElement.id, event.element.id);
        });
        eventBus.on('connection.added', (event) => {
            me.set(event.element.modelElement.id, event.element.id);
        })
        eventBus.on('shape.remove', (event) => {
            me.remove(event.element.modelElement.id, event.element.id);
        });
        eventBus.on('connection.remove', (event) => {
            me.remove(event.element.modelElement.id, event.element.id);
        });
    }

    // returns a list
    get(id) {
        return this.modelElements.get(id);
    }

    set(id, shapeID) {
        const modelElement = this.modelElements.get(id);
        if (!modelElement) {
            this.modelElements.set(id, [shapeID]);
        } else {
            modelElement.push(shapeID);
        }
    }

    remove(id, shapeID) {
        const modelElement = this.modelElements.get(id);
        if (modelElement) {
            modelElement.splice(modelElement.indexOf(shapeID), 1);
            if (modelElement.length === 0) {
                this.modelElements.delete(id);
            }
        }
    }
};

ModelElementMap.$inject = ['elementRegistry', 'eventBus'];