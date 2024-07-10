import { createElementUpdate } from '../../../umlUtil';
import { updateLabel } from '../api/diagramInterchange';
import { getLabelBounds } from './relationships/Association';

class UpdateNameHandler {
    constructor(umlWebClient, diagramEmitter, umlRenderer, graphicsFactory, canvas, elementRegistry) {
        this._umlWebClient = umlWebClient;
        this._diagramEmitter = diagramEmitter;
        this._umlRenderer = umlRenderer;
        this._graphicsFactory = graphicsFactory;
        this._canvas = canvas;
        this._elementRegistry = elementRegistry;
    }
    execute(context) {
        const umlWebClient = this._umlWebClient,
        diagramEmitter = this._diagramEmitter,
        umlRenderer = this._umlRenderer,
        graphicsFactory = this._graphicsFactory,
        canvas = this._canvas,
        elementRegistry = this._elementRegistry;
        context.element = elementRegistry.get(context.element.id);
        if (context.proxy) {
            delete context.proxy;
            return context.element;
        }
        const element = context.element,
        newLabel = context.newLabel,
        bounds = context.bounds;
        context.oldBounds = {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
        };
        diagramEmitter.fire('command', {name: 'uml.name.update', context: {
            element: {
                id: element.id,
            },
            bounds: bounds,
            newLabel: newLabel,
            oldBounds: context.oldBounds,
        }});
        if (element.modelElement) {
            if (element.modelElement.is('NamedElement')) {
                context.oldText = element.modelElement.name;
                element.modelElement.name = newLabel;
                umlWebClient.put(element.modelElement);
            } else if (element.modelElement.is('Comment')) {
                context.oldText = element.modelElement.body;
                element.modelElement.body = newLabel;
                umlWebClient.put(element.modelElement);
            }
        }
        if (element.labelTarget) {
            element.text = newLabel;
            if (element.modelElement.elementType() === 'property' && element.parent.modelElement.elementType() === 'association') {
                const labelBounds = getLabelBounds(element.modelElement, element.parent, umlRenderer);
                element.width = labelBounds.width;
                element.height = labelBounds.heigt;
                graphicsFactory.update('shape', element, canvas.getGraphics(element));
                updateLabel(element, umlWebClient);
            }
        } else {
            element.x = bounds.x;
            element.y = bounds.y;
            element.width = bounds.width;
            element.height = bounds.height;
        }
        diagramEmitter.fire('elementUpdate', createElementUpdate(element.modelElement));
        return element;
    }
    revert(context) {
        const oldBounds = context.oldBounds;
        const element = context.element;
        const oldText = context.oldText;
        const graphicsFactory = this._graphicsFactory;
        const canvas = this._canvas;
        const diagramEmitter = this._diagramEmitter;
        diagramEmitter.fire('command', {undo: {
            // TODO
        }});
        element.x = oldBounds.x;
        element.y = oldBounds.y;
        element.width = oldBounds.width;
        element.height = oldBounds.height;
        if (element.labelTarget) {
            element.text = oldText;
        }
        if (element.modelElement) {
            if (element.modelElement.is('NamedElement')) {
                element.modelElement.name = oldText;
            } else if (element.modelElement.elementType() === 'Comment') {
                element.modelElement.body = oldText;
            }
        }
        graphicsFactory.update('shape', element, canvas.getGraphics(element));
        diagramEmitter.fire('elementUpdate', createElementUpdate(element.modelElement));
        return element;
    }
}

UpdateNameHandler.$inject = ['umlWebClient', 'diagramEmitter', 'umlRenderer', 'graphicsFactory', 'canvas', 'elementRegistry'];

export default class NameEditProvider {

    constructor(directEditing, umlRenderer, commandStack) {
        directEditing.registerProvider(this);
        this._umlRenderer = umlRenderer;
        this.commandStack = commandStack;
        commandStack.registerHandler('uml.name.update', UpdateNameHandler);
    }

    activate(element) {
        const ret = {};
        if (element.modelElement) {
            if (element.modelElement.is('NamedElement')) {
                ret.text = element.modelElement.name;
            } else if (element.modelElement.is('Comment')) {
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
        this.commandStack.execute('uml.name.update', {
            element: element,
            newLabel: newLabel,
            bounds: bounds,
        });
    }
}

NameEditProvider.$inject = ['directEditing', 'umlRenderer', 'commandStack'];
