<script>
import { Editor } from '../diagram/editor';
const EventEmitter = require('events');
import { createElementUpdate } from '../umlUtil.js';
import { getUmlDiagramElement, deleteUmlDiagramElement } from '../diagram/api/diagramInterchange/util';
import { CLASSIFIER_SHAPE_ID, LABEL_ID, NAME_LABEL_ID, SHAPE_ID , TYPED_ELEMENT_LABEL_ID } from './diagram/api/diagramInterchange/ids';
import { toRaw } from 'vue';
import { CLASS_SHAPE_HEADER_HEIGHT } from '../diagram/providers/ClassHandler';
import { getTypedElementText, getTextDimensions } from '../diagram/providers/ClassDiagramPaletteProvider';
export default {
    data() {
        return {
            emitter : undefined,
            recentDraginfo: undefined,
            dragging: false,
            recentElementUpdate: undefined,
            loading: true,
        };
    },
    props: ['umlID', 'commandStack', 'undoStack'],
    emits: ['specification', 'elementUpdate', 'command'],
    inject: ['draginfo', 'elementUpdate', 'userSelected', 'userDeselected'],
    watch : {
        draginfo(newDraginfo) {
            this.recentDraginfo = newDraginfo;
            this.emitter.emit('dragenter', newDraginfo);
        },
        elementUpdate(newElementUpdate) {
            if (this.loading) return;
            if (this.recentElementUpdate !== newElementUpdate) {
                // send update to diagram via emitter
                this.emitter.emit('elementUpdate', newElementUpdate);
            }
        },
        umlID() {
            this.reloadDiagram();
        },
        userSelected(newUserSelected) {
            this.emitter.emit('user.selected',newUserSelected);
        },
        userDeselected(newUserDeselected) {
            this.emitter.emit('user.deselected', newUserDeselected);
        },
        commandStack(newCommandStack) {
            const newCommand = newCommandStack[0];
            newCommand.context.proxy = true;
            this.emitter.emit('externalCommand', newCommand);
        },
        undoStack(newUndoStack) {
            // TODO
        }
    },
    async mounted() {
        this.reloadDiagram();        
    },
    unmounted() {
        this.diagram.get('keyboard').unbind(document);
    },
    methods: {
        specification(event) {
            if (event.currentTarget == this.$refs.diagram) {
                this.$emit('specification', event);
            }
        },
        async reloadDiagram() {
            if (this.diagram) {
                this.diagram.destroy()
            }
            const scopedEmitter = new EventEmitter();
            const diagramPackage = await this.$umlWebClient.get(this.umlID);
            let diagramInstance = undefined;
            for await (const packagedElement of diagramPackage.packagedElements) {
                if (packagedElement.isSubClassOf('instanceSpecification')) {
                    for (const classifierID of packagedElement.classifiers.ids()) {
                        if (classifierID === 'U3CQzJden20cL0mG0nQN_HuWfisB') {
                            diagramInstance = packagedElement;
                        }
                    }
                }
            }
            this.diagram = new Editor({
                container: this.$refs.diagram,
                umlWebClient: this.$umlWebClient,
                emitter: scopedEmitter,
                context: await diagramPackage.owningPackage.get(),
                diagramElement: diagramPackage,
            });
            const canvas = this.diagram.get('canvas');
            const elementFactory = this.diagram.get('elementFactory');
            const elementRegistry = this.diagram.get('elementRegistry');
            const commandStack = this.diagram.get('commandStack');
            
            this.diagram.get('keyboard').bind(document);

            // add root
            var root = elementFactory.createRoot({
                id: diagramInstance.id
            });

            canvas.setRootElement(root);

            // set up diagram from model
            {
                
                const drawDiagramElement = async (umlDiagramElement) => {
                    const shapeAlreadyDrawn = elementRegistry.get(umlDiagramElement.id); 
                    if (shapeAlreadyDrawn) {
                        return shapeAlreadyDrawn;
                    }
                    if (umlDiagramElement.elementType() === 'shape') {
                        const umlShape = umlDiagramElement;
                        if (umlShape.modelElement.isSubClassOf('property')) {
                            if (umlShape.modelElement.type.has()) {
                                await umlShape.modelElement.type.get();
                            }
                            if (umlShape.modelElement.lowerValue.has()) {
                                await umlShape.modelElement.lowerValue.get();
                            }
                            if (umlShape.modelElement.upperValue.has()) {
                                await umlShape.modelElement.upperValue.get();
                            }
                        }

                        if (!umlShape.modelElement) {
                            // modelElement for shape has been deleted
                            await deleteUmlDiagramElement(umlShape.id, this.$umlWebClient);
                            return undefined;
                        }
                        let parent = elementRegistry.get(umlShape.owningElement);
                        if (!parent) {
                            parent = await drawDiagramElement(await getUmlDiagramElement(umlShape.owningElement, this.$umlWebClient));
                        }
                        const shape = elementFactory.createShape({
                            x: umlShape.bounds.x,
                            y: umlShape.bounds.y,
                            width: umlShape.bounds.width,
                            height: umlShape.bounds.height,
                            id: umlShape.id,
                            modelElement: umlShape.modelElement,
                            elementType: 'shape',
                        });
                        canvas.addShape(shape, parent);
                        return shape;
                    } else if (umlDiagramElement.elementType() === 'classifierShape') {
                        const umlClassifierShape = umlDiagramElement;
                        if (!umlClassifierShape.modelElement) {
                            await deleteUmlDiagramElement(umlClassifierShape.id, this.$umlWebClient);
                            return undefined;
                        }
                        let parent = elementRegistry.get(umlClassifierShape.owningElement);
                        if (!parent) {
                            parent = await drawDiagramElement(await getUmlDiagramElement(umlClassifierShape.owningElement, this.$umlWebClient));
                        }
                        // todo compartments
                        const compartments = [];
                        for (const compartmentID of umlClassifierShape.compartments) {
                            const compartment = await getUmlDiagramElement(compartmentID, this.$umlWebClient);
                            const compartmentShape = elementFactory.createShape({
                                id: compartment.id,
                                x: umlClassifierShape.bounds.x,
                                y: umlClassifierShape.bounds.y + CLASS_SHAPE_HEADER_HEIGHT,
                                width: umlClassifierShape.bounds.width,
                                height: umlClassifierShape.bounds.height - CLASS_SHAPE_HEADER_HEIGHT,
                                modelElement: umlClassifierShape.modelElement,
                                elementType: 'compartment',
                            });
                            compartments.push(compartmentShape);
                        }
                        const shape = elementFactory.createShape({
                            x: umlClassifierShape.bounds.x,
                            y: umlClassifierShape.bounds.y,
                            width: umlClassifierShape.bounds.width,
                            height: umlClassifierShape.bounds.height,
                            id: umlClassifierShape.id,
                            modelElement: umlClassifierShape.modelElement,
                            compartments: compartments,
                            elementType: 'classifierShape',
                        });
                        canvas.addShape(shape, parent);
                        for (const compartmentShape of compartments) {
                            canvas.addShape(compartmentShape, shape);
                        }
                    } else if (umlDiagramElement.elementType() === 'edge') {
                        const umlEdge = umlDiagramElement;
                        if (!umlEdge.modelElement) {
                            // model element has been deleted
                            await deleteUmlDiagramElement(umlEdge.id, this.$umlWebClient);
                            return undefined;
                        }

                        let source = elementRegistry.get(umlEdge.source);
                        let target = elementRegistry.get(umlEdge.target);
                        if (!source) {
                            source = await drawDiagramElement(await getUmlDiagramElement(umlEdge.source, this.$umlWebClient));
                        }
                        if (!target) {
                            target = await drawDiagramElement(await getUmlDiagramElement(umlEdge.target, this.$umlWebClient));
                        }
                        if (umlEdge.modelElement.isSubClassOf('association')) {
                            for await (const memberEnd of umlEdge.modelElement.memberEnds) {
                                await memberEnd.type.get()
                            }
                        }
                        var relationship = elementFactory.createConnection({
                            waypoints: umlEdge.waypoints,
                            id: umlEdge.id,
                            modelElement: umlEdge.modelElement,
                            source: source,
                            target: target,
                            children: [],
                            elementType: 'edge',
                            numTargetLabels: 0,
                            numSourceLabels: 0,
                            numCenterLabels: 0,
                        });
                        canvas.addConnection(relationship, root);
                        return relationship;
                    } else if (umlDiagramElement.elementType() === 'label') {
                        const umlLabel = umlDiagramElement;
                        if (!umlLabel.modelElement) {
                            // TODO
                            console.error('TODO diagramInterchange');

                        }
                        // TODO create label pointing to shape
                        if (umlLabel.modelElement.elementType() === 'property' && umlLabel.modelElement.association.has()) {
                            // it is a member end label
                            const labelTarget = elementRegistry.get(umlLabel.owningElement);
                            const label = elementFactory.createLabel({
                                    id: umlLabel.id,
                                    text: umlLabel.text,
                                    modelElement: umlLabel.modelElement,
                                    x: umlLabel.bounds.x,
                                    y: umlLabel.bounds.y,
                                    width: umlLabel.bounds.width,
                                    height: umlLabel.bounds.height,
                                    labelTarget: labelTarget,
                                    elementType: 'label',
                                });
                                canvas.addShape(label, labelTarget);
                                return label;
                        }
                    } else if (umlDiagramElement.elementType() === 'nameLabel') {
                        const umlNameLabel = umlDiagramElement;
                        const labelTarget = elementRegistry.get(umlNameLabel.owningElement);

                        // update name 
                        let updatedName = false;
                        if (umlNameLabel.text != umlNameLabel.modelElement.name) {
                            umlNameLabel.text = umlNameLabel.modelElement.name;
                            updatedName = true;
                        }
                        const label = elementFactory.createLabel({
                            id: umlNameLabel.id,
                            text: umlNameLabel.text,
                            modelElement: umlNameLabel.modelElement,
                            x: umlNameLabel.bounds.x,
                            y: umlNameLabel.bounds.y,
                            width: umlNameLabel.bounds.width,
                            height: umlNameLabel.bounds.height,
                            labelTarget: labelTarget,
                            elementType: 'nameLabel',
                            inselectable: !labelTarget.waypoints, // TODO determine this elsewhere
                        });
                        canvas.addShape(label, labelTarget);
                        if (updatedName) {
                            await updateLabel(label, this.$umlWebClient);
                        }

                        return label;
                    } else if (umlDiagramElement.elementType() === 'typedElementLabel') {
                        const umlTypedElementLabel = umlDiagramElement;
                        const labelTarget = elementRegistry.get(umlTypedElementLabel.owningElement);

                        // update text
                        await umlTypedElementLabel.modelElement.type.get();
                        let newText = getTypedElementText(umlTypedElementLabel.modelElement);
                        if (newText != umlTypedElementLabel.text) {
                            umlTypedElementLabel.text = newText;
                            umlTypedElementLabel.bounds.width = Math.round(getTextDimensions(newText, this.diagram.get('umlRenderer')).width) + 15;
                        }
                        let placement;
                        if (labelTarget.waypoints) {
                            placement = 'center';
                        }
                        const label = elementFactory.createLabel({
                            id: umlTypedElementLabel.id,
                            text: umlTypedElementLabel.text,
                            modelElement: umlTypedElementLabel.modelElement,
                            x: umlTypedElementLabel.bounds.x,
                            y: umlTypedElementLabel.bounds.y,
                            width: umlTypedElementLabel.bounds.width,
                            height: umlTypedElementLabel.bounds.height,
                            labelTarget: labelTarget,
                            elementType: 'typedElementLabel',
                            placement: placement,
                        });
                        if (newText) {
                            await updateLabel(label, this.$umlWebClient);
                        }
                        canvas.addShape(label, labelTarget);
                        return label;
                    } else if (umlDiagramElement.elementType() === 'keywordLabel') {
                        const labelTarget = elementRegistry.get(umlDiagramElement.owningElement);
                        let placement;
                        if (labelTarget.waypoints) {
                            placement = 'center';
                        }
                        const label = elementFactory.createLabel({
                            id: umlDiagramElement.id,
                            text: umlDiagramElement.text,
                            modelElement: umlDiagramElement.modelElement,
                            x: umlDiagramElement.bounds.x,
                            y: umlDiagramElement.bounds.y,
                            width: umlDiagramElement.bounds.width,
                            height: umlDiagramElement.bounds.height,
                            elementType: 'keywordLabel',
                            inselectable: true, // TODO determine this elsewhere
                            placement: placement,
                        });
                        canvas.addShape(label, labelTarget);
                        return label;
                    } else if (umlDiagramElement.elementType() === 'associationEndLabel') {
                        const labelTarget = elementRegistry.get(umlDiagramElement.owningElement);
                        let placement;
                        if (labelTarget.waypoints) {
                            // setup alignment
                            if (umlDiagramElement.modelElement.type.id() === labelTarget.source.modelElement.id) {
                                placement = 'source'
                            } else if (umlDiagramElement.modelElement.type.id() === labelTarget.target.modelElement.id) {
                                placement = 'target';
                            }
                        }
                        const label = elementFactory.createLabel({
                            id: umlDiagramElement.id,
                            text: umlDiagramElement.text,
                            modelElement: umlDiagramElement.modelElement,
                            x: umlDiagramElement.bounds.x,
                            y: umlDiagramElement.bounds.y,
                            width: umlDiagramElement.bounds.width,
                            height: umlDiagramElement.bounds.height,
                            elementType: 'associationEndLabel',
                            placement: placement,
                        });
                        canvas.addShape(label, labelTarget);
                        return label;
                    } else if (umlDiagramElement.elementType() === 'multiplicityLabel') {
                        const labelTarget = elementRegistry.get(umlDiagramElement.owningElement);
                        let placement;
                        if (labelTarget.waypoints) {
                            throw Error('TODO multiplicity DiagramPage!');
                        }
                        const label = elementFactory.createLabel({
                            id: umlDiagramElement.id,
                            text: umlDiagramElement.text,
                            modelElement: umlDiagramElement.modelElement,
                            x: umlDiagramElement.bounds.x,
                            y: umlDiagramElement.bounds.y,
                            width: umlDiagramElement.bounds.width,
                            height: umlDiagramElement.bounds.height,
                            elementType: 'multiplicityLabel',
                            placement: placement,
                        });
                        canvas.addShape(label, labelTarget);
                        return label;
                    } else {
                        throw Error('unhandled uml di type on diagram loading!');
                    }
                }

                // draw all shapes
                for await (let packagedEl of diagramPackage.packagedElements) {
                    if (!packagedEl.isSubClassOf('instanceSpecification')) {
                        continue;
                    }
                    if (!packagedEl.classifiers.contains(SHAPE_ID) && !packagedEl.classifiers.contains(CLASSIFIER_SHAPE_ID)) {
                        continue;
                    }
                    // draw shape
                    const umlShape = await getUmlDiagramElement(packagedEl.id, this.$umlWebClient)
                    await drawDiagramElement(umlShape);
                }

                // draw all connections between shapes
                for await (let packagedEl of diagramPackage.packagedElements) {
                    if (!packagedEl.isSubClassOf('instanceSpecification')) {
                        continue;
                    }
                    if (!packagedEl.classifiers.contains('u2fIGW2nEDfMfVxqDvSmPd5e_wNR')) {
                        continue;
                    }

                    const umlEdge = await getUmlDiagramElement(packagedEl.id, this.$umlWebClient);
                    await drawDiagramElement(umlEdge);
                }

                // draw all labels
                for await (let packagedEl of diagramPackage.packagedElements) {
                    if (!packagedEl.isSubClassOf('instanceSpecification')) {
                        continue;
                    }
                    if (!packagedEl.classifiers.contains(LABEL_ID) && !packagedEl.classifiers.contains(NAME_LABEL_ID) && !packagedEl.classifiers.contains(TYPED_ELEMENT_LABEL_ID) && !packagedEl.classifiers.contains(KEYWORD_LABEL_ID) && !packagedEl.classifiers.contains(ASSOCIATION_END_LABEL_ID) && !packagedEl.classifiers.contains(MULTIPLICITY_LABEL_ID)) {
                        continue;
                    }

                    const umlLabel = await getUmlDiagramElement(packagedEl.id, this.$umlWebClient);
                    await drawDiagramElement(umlLabel);
                }
                const colorMap = new Map();
                colorMap.set('Red', 'var(--uml-cafe-red-user)');
                colorMap.set('Blue', 'var(--uml-cafe-blue-user)');
                colorMap.set('Green', 'var(--uml-cafe-green-user)');
                colorMap.set('Yellow', 'var(--uml-cafe-yellow-user)');
                colorMap.set('Magenta', 'var(--uml-cafe-magenta-user)');
                colorMap.set('Orange', 'var(--uml-cafe-orange-user)');
                colorMap.set('Cyan', 'var(--uml-cafe-cyan-user)');
                colorMap.set('Lime', 'var(--uml-cafe-lime-user)');
                for (const client of this.$umlWebClient.otherClients.values()) {
                    for (const selectedElement of client.selectedElements.keys()) {
                        scopedEmitter.emit('user.selected', {
                            id: selectedElement,
                            color: colorMap.get(client.color),
                        });
                    }
                }
            }

            const diagramPage = this;
            // handle emits from diagram to update rest of app
            scopedEmitter.on('elementUpdate', (newElementUpdate) => {
                diagramPage.$emit('elementUpdate', newElementUpdate);
                this.recentElementUpdate = newElementUpdate;
            });
            // whenever a shape is added update diagram context
            scopedEmitter.on('shape.added', async () => {
                diagramPage.$emit('elementUpdate', createElementUpdate(await diagramPackage.owningPackage.get()));
            });
            scopedEmitter.on('specification', (event) => {
                diagramPage.$emit('specification', event);
            });
            scopedEmitter.on('contextmenu', (event) => {
                diagramPage.$contextmenu(event);
            });
            scopedEmitter.on('command', (event) => {
                if (!event.element) {
                    event.element = diagramPage.umlID;
                }
                diagramPage.$emit('command', event);
            });

            const executeCommand = (command) => {
                command.context.proxy = true;
                if (command.element === this.umlID) {
                    commandStack.execute(command.name, toRaw(command.context));
                } else {
                    commandStack.execute('proxy', command);
                }
            }

            for (let command of this.commandStack.toReversed()) {
                executeCommand(command);
            }
            for (let command of this.undoStack) {
                executeCommand(command);
                command.context.proxy = true;
            }
            this.undoStack.toReversed().forEach( () => commandStack.undo());
            this.emitter = Object.freeze(scopedEmitter);
            this.loading = false;
        }
    }
}
</script>
<template>
    <div ref="diagram" class="diagramContainer"></div>
</template>
<style>
.diagramContainer {
    flex: 1 1;
}
.palette-icon-lasso-tool {
    background: url('data:image/svg+xml,%3Csvg%0A%20%20%20%20%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20%0A%20%20%20%20%20fill%3D%22none%22%0A%20%20%20%20%20stroke%3D%22%23000%22%0A%20%20%20%20%20stroke-width%3D%221.5%22%0A%20%20%20%20%20width%3D%2246%22%0A%20%20%20%20%20height%3D%2246%22%3E%0A%20%20%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2216%22%20height%3D%2216%22%20stroke-dasharray%3D%225%2C%205%22%20%2F%3E%0A%20%20%3Cline%20x1%3D%2216%22%20y1%3D%2226%22%20x2%3D%2236%22%20y2%3D%2226%22%20stroke%3D%22black%22%20%2F%3E%0A%20%20%3Cline%20x1%3D%2226%22%20y1%3D%2216%22%20x2%3D%2226%22%20y2%3D%2236%22%20stroke%3D%22black%22%20%2F%3E%0A%3C%2Fsvg%3E');
}

.palette-icon-create-class {
    background: url('../assets/icons/general/class.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-data-type {
    background: url('../assets/icons/general/data_type.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-enumeration {
    background: url('../assets/icons/general/enumeration.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-primitive-type {
    background: url('../assets/icons/general/primitive_type.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-interface {
    background: url('../assets/icons/general/interface.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-signal {
    background: url('../assets/icons/general/signal.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-dependency {
    background: url('../assets/icons/general/dependency.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-usage {
    background: url('../assets/icons/general/usage.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-abstraction {
    background: url('../assets/icons/general/abstraction.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-realization {
    background: url('../assets/icons/general/realization.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-generalization {
    background: url('../assets/icons/general/generalization.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-directed-composition {
    background: url('../assets/icons/general/association.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-composition {
    background: url('../assets/icons/diagram/palette/composition.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-association {
    background: url('../assets/icons/diagram/palette/association.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}
.palette-icon-create-directed-association {
    background: url('../assets/icons/diagram/palette/directedAssociation.svg');
    background-repeat: no-repeat;
    background-size: 100%; 
}
.palette-icon-create-bi-directional-association {
    background: url('../assets/icons/diagram/palette/biDirectionalAssociation.svg');
    background-repeat: no-repeat;
    background-size: 100%; 
}

.context-pad-icon-remove {
    background: url('../assets/icons/diagram/context/deleteShapeDark.svg') !important;
}

.context-pad-icon-connect {
    background: url('../assets/icons/diagram/context/createGeneralizationDark.svg') !important;
}

.context-pad-icon-directed-composition {
    background: url('../assets/icons/diagram/context/directedComposition.svg') !important;
}
.context-pad-icon-spec {
    background: url('../assets/icons/diagram/context/info.svg') !important;
}
.context-pad-icon-delete {
    background: url('../assets/icons/diagram/context/trash.svg') !important;
}
.context-pad-icon-options {
    background: url('../assets/icons/diagram/context/gear.svg') !important;
}
.context-pad-icon-comment {
    background: url('../assets/icons/diagram/context/comment.svg') !important;
}
.context-pad-icon-composition {
    background: url('../assets/icons/diagram/context/composition.svg') !important;
}
.context-pad-icon-dependency {
    background: url('../assets/icons/diagram/context/dependency.svg') !important;
}
.context-pad-icon-abstraction {
    background: url('../assets/icons/diagram/context/abstraction.svg') !important;
}
.context-pad-icon-realization {
    background: url('../assets/icons/diagram/context/realization.svg') !important;
}
.context-pad-icon-usage {
    background: url('../assets/icons/diagram/context/usage.svg') !important;
}
.context-pad-icon-directed-association {
    background: url('../assets/icons/diagram/context/directedAssociation.svg') !important;
}
.context-pad-icon-association {
    background: url('../assets/icons/diagram/context/association.svg') !important;
}
.context-pad-icon-bi-directional-association {
    background: url('../assets/icons/diagram/context/biDirectedAssociation.svg') !important;
}
.djs-element.redUser .djs-outline{
    visibility: visible;
    stroke: var(--uml-cafe-red-user);
}
.djs-element.blueUser .djs-outline {
    visibility: visible;
    stroke: var(--uml-cafe-blue-user);
}
.djs-element.blueUser .djs-outline {
    visibility: visible;
    stroke: var(--uml-cafe-blue-user);
}
.djs-element.greenUser .djs-outline {
    visibility: visible;
    stroke: var(--uml-cafe-green-user);
}
.djs-element.yellowUser .djs-outline {
    visibility: visible;
    stroke: var(--uml-cafe-yellow-user);
}
.djs-element.magentaUser .djs-outline {
    visibility: visible;
    stroke: var(--uml-cafe-magenta-user);
}
.djs-element.orangeUser .djs-outline {
    visibility: visible;
    stroke: var(--uml-cafe-orange-user);
}
.djs-element.limeUser .djs-outline {
    visibility: visible;
    stroke: var(--uml-cafe-lime-user);
}
.djs-element.cyanUser .djs-outline {
    visibility: visible;
    stroke: var(--uml-cafe-cyan-user);
}
@import "diagram-js/assets/diagram-js.css"
</style>
