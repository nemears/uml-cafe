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
            const modelElement = me.modelElements.get(event.element.elementID);
            if (!modelElement) {
                me.modelElements.set(event.element.elementID, [event.element.id]);
            } else {
                if (modelElement.find(shapeID => shapeID === event.element.id)) {
                    modelElement.push(event.element.id);
                }
            }
        });
        eventBus.on('shape.remove', (event) => {
            const modelElement = me.modelElements.get(event.element.elementID);
            if (modelElement) {
                modelElement.splice(modelElement.indexOf(event.element.id), 1);
                if (modelElement.length === 0) {
                    me.modelElements.delete(event.element.elementID);
                }
            }
        });
    }

    // returns a list
    get(id) {
        return this.modelElements.get(id);
    }

    set(id, shapeID) {
        const modelElement = me.modelElements.get(id);
        if (!modelElement) {
            me.modelElements.set(id, [shapeID]);
        } else {
            modelElement.push(shapeID);
        }
    }
};

ModelElementMap.$inject = ['elementRegistry', 'eventBus'];