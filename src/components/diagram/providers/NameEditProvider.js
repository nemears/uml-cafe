import { createElementUpdate } from '../../../createElementUpdate';

export default class NameEditProvider {

    constructor(directEditing, umlWebClient, diagramEmitter, umlRenderer) {
        directEditing.registerProvider(this);
        this._umlWebClient = umlWebClient;
        this._diagramEmitter = diagramEmitter;
        this._umlRenderer = umlRenderer;
    }

    activate(element) {
        const ret = {};
        if (element.modelElement) {
            if (element.modelElement.isSubClassOf('namedElement')) {
                ret.text = element.modelElement.name;
            } else if (element.modelElement.isSubClassOf('comment')) {
                ret.text = element.modelElement.body;
            }
        }

        ret.bounds = {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
        }

        ret.style = {
            backgroundColor: this._umlRenderer.CLASS_STYLE.fill,
            border: this._umlRenderer.CLASS_STYLE.stroke,
            fontSize: this._umlRenderer.textStyle.fontSize.toString(),
            fontFamily: this._umlRenderer.textStyle.fontFamily,
            fontWeight: this._umlRenderer.textStyle.fontWeight,
        };

        return ret;
    }

    update(element, newLabel, activeContextText, bounds) {
        const umlWebClient = this._umlWebClient,
        diagramEmitter = this._diagramEmitter;
        if (element.modelElement) {
            if (element.modelElement.isSubClassOf('namedElement')) {
                element.modelElement.name = newLabel;
                umlWebClient.put(element.modelElement);
            } else if (element.modelElement.isSubClassOf('comment')) {
                element.modelElement.body = newLabel;
                umlWebClient.put(element.modelElement);
            }
        }
        element.x = bounds.x;
        element.y = bounds.y;
        element.width = bounds.width;
        element.height = bounds.height;
        diagramEmitter.fire('elementUpdate', createElementUpdate(element.modelElement));
    }
}

NameEditProvider.$inject = ['directEditing', 'umlWebClient', 'diagramEmitter', 'umlRenderer'];
