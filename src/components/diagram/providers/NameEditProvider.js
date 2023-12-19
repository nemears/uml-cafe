import { createElementUpdate } from '../../../umlUtil';
import { updateLabel } from '../api/diagramInterchange';
import { getLabelBounds } from './relationships/DirectedComposition';

export default class NameEditProvider {

    constructor(directEditing, umlWebClient, diagramEmitter, umlRenderer, modeling) {
        directEditing.registerProvider(this);
        this._umlWebClient = umlWebClient;
        this._diagramEmitter = diagramEmitter;
        this._umlRenderer = umlRenderer;
        this._modeling = modeling;
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
            
        // TODO make font black atleast

        if (element.modelElement.elementType() === 'class') {
            ret.style = {
                backgroundColor: this._umlRenderer.CLASS_STYLE.fill,
                border: this._umlRenderer.CLASS_STYLE.stroke,
                fontSize: this._umlRenderer.textStyle.fontSize.toString(),
                fontFamily: this._umlRenderer.textStyle.fontFamily,
                fontWeight: this._umlRenderer.textStyle.fontWeight,
            };
        } else if (element.modelElement.elementType() === 'comment') {
            ret.style = {
                backgroundColor: this._umlRenderer.COMMENT_STYLE.fill,
                border: this._umlRenderer.COMMENT_STYLE.stroke,
                fontSize: this._umlRenderer.textStyle.fontSize.toString(),
                fontFamily: this._umlRenderer.textStyle.fontFamily,
                fontWeight: this._umlRenderer.textStyle.fontWeight,
                fontFill: 'var(--vt-c-text-light-1)'
            };
        } else if (element.modelElement.elementType() === 'property') {
            ret.style = {
                backgroundColor: this._umlRenderer.PROPERTY_STYLE.fill,
                border: this._umlRenderer.PROPERTY_STYLE.stroke,
                fontSize: this._umlRenderer.textStyle.fontSize.toString(),
                fontFamily: this._umlRenderer.textStyle.fontFamily,
                fontWeight: this._umlRenderer.textStyle.fontWeight,
            }
        }

        return ret;
    }

    update(element, newLabel, activeContextText, bounds) {
        const umlWebClient = this._umlWebClient,
        diagramEmitter = this._diagramEmitter,
        umlRenderer = this._umlRenderer,
        modeling = this._modeling;
        if (element.modelElement) {
            if (element.modelElement.isSubClassOf('namedElement')) {
                element.modelElement.name = newLabel;
                umlWebClient.put(element.modelElement);
            } else if (element.modelElement.isSubClassOf('comment')) {
                element.modelElement.body = newLabel;
                umlWebClient.put(element.modelElement);
            }
        }
        if (element.labelTarget) {
            element.text = newLabel;
            const labelBounds = getLabelBounds(element.labelTarget, umlRenderer);
            labelBounds.x = element.x;
            labelBounds.y = element.y;
            modeling.resizeShape(
                element,
                labelBounds,
            );
            updateLabel(element, umlWebClient);
        } else {
            element.x = bounds.x;
            element.y = bounds.y;
            element.width = bounds.width;
            element.height = bounds.height;
        }
        diagramEmitter.fire('elementUpdate', createElementUpdate(element.modelElement));
    }
}

NameEditProvider.$inject = ['directEditing', 'umlWebClient', 'diagramEmitter', 'umlRenderer', 'modeling'];
