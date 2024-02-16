import { createElementUpdate } from '../../umlUtil';
import { updateLabel } from '../api/diagramInterchange';
import { CLASSIFIER_SHAPE_GAP_HEIGHT } from './UmlCompartmentableShapeProvider';

class UpdateNameLabelHandler {
    constructor(diagramEmitter, umlWebClient) {
        this._diagramEmitter = diagramEmitter;
        this._umlWebClient = umlWebClient;
    }
    execute(context) {
        const diagramEmitter = this._diagramEmitter,
        umlWebClient = this._umlWebClient;

        // take care of proxy comand
        if (context.proxy) {
            delete context.proxy;
            return context.element;
        }
        
        // fire command for app
        const element = context.element,
        newName = context.newName,
        bounds = context.bounds;
        context.oldBounds = {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
        };
        diagramEmitter.fire('command', {name: 'nameLabel.update', context: {
            element: {
                                id: element.id,
                            },
            bounds: bounds,
            newName: newName,
            oldBounds: context.oldBounds,
        }});

        // update modelElement
        element.modelElement.name = newName;
        umlWebClient.put(element.modelElement);
        diagramEmitter.fire('elementUpdate', createElementUpdate(element.modelElement));

        // update label
        element.text = newName;
        element.x = bounds.x;
        element.y = bounds.y;
        element.width = bounds.width;
        element.height = bounds.height;
       
        // update to server
        updateLabel(element, umlWebClient);

        // return element to commandStack
        return element;
    }
    revert(context) {
        const oldBounds = context.oldBounds;
        const element = context.element;
        const oldText = context.oldText;
        const diagramEmitter = this._diagramEmitter,
        umlWebClient = this._umlWebClient;
        diagramEmitter.fire('command', {undo: {
            // TODO
        }});
        element.x = oldBounds.x;
        element.y = oldBounds.y;
        element.width = oldBounds.width;
        element.height = oldBounds.height;
        element.text = oldText;
        element.modelElement.name = oldText;
        diagramEmitter.fire('elementUpdate', createElementUpdate(element.modelElement));

        updateLabel(element, umlWebClient);

        return element;
    }
}

export default class UmlDirecteEditingProvider{
    constructor(directEditing, umlRenderer, commandStack, canvas) {
        directEditing.registerProvider(this);
        this.umlRenderer = umlRenderer;
        this.commandStack = commandStack;
        this.canvas = canvas;
        commandStack.registerHandler('nameLabel.update', UpdateNameLabelHandler);
    }
    activate(element) {
        if (element.elementType === 'nameLabel') {
            const ret = {
                text: element.modelElement.name,
            };
            // TODO
            // expand bounds to maximum size if in parent
            if (element.parent && element.parent != this.canvas.findRoot(element)) {
                /**
                 * Right now we are assuming the parent is a class diagram classifierShape
                 * when not in a class diagram, the following behavior will have to be chaned
                 *
                 * The current behavior is to just place shapes vertically in order, discounting compartments
                 *
                 **/
                /**let yPos = element.parent.y + CLASSIFIER_SHAPE_GAP_HEIGHT;
                for (const child of element.parent.children) {
                    if (child.elementType === 'compartment') {
                        continue;
                    }
                    if (child == element) {
                        break;
                    }
                    yPos += child.height + CLASSIFIER_SHAPE_GAP_HEIGHT;
                }

                ret.bounds = {
                    x: element.parent.x,
                    y: yPos,
                    width: element.parent.width,
                    height: element.height, // TODO allow height more than 1 line?
                }**/
                const viewbox = this.canvas.viewbox();
                ret.bounds = {
                    x: element.x - viewbox.x,
                    y: element.y - viewbox.y,
                    width: element.width,
                    height: element.height,
                }
            } else {
                throw Error("TODO activate bounds for label with parent that is root");
            }
            ret.style = {
                backgroundColor: this.umlRenderer.EDIT_STYLE.fill,
                fontSize: this.umlRenderer.textStyle.fontSize + 'px',
                fontFamily: this.umlRenderer.textStyle.fontFamily,
                fontWeight: this.umlRenderer.textStyle.fontWeight,
                lineHeight: 1.714,
                overflow: 'hidden',
            };

            return ret;
        } else {
            throw Error('TODO handle direct editing for elementType ' + element.elementType);
        }
    }
    update(element, newName, activeContextText, bounds) {
        if (element.elementType === 'nameLabel') {
            this.commandStack.execute('nameLabel.update', {
                element: element,
                newName: newName,
                bounds: bounds,
            });
        } else {
            throw Error('TODO handle direct editing for elementType ' + element.elementType);
        }
    }
}
