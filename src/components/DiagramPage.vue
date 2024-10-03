<script>
import { Editor } from '../diagram/editor';
const EventEmitter = require('events');
import { createElementUpdate } from '../umlUtil.js';
import { toRaw } from 'vue';
import { CLASS_SHAPE_HEADER_HEIGHT } from '../diagram/providers/ClassHandler';
import { getTypedElementText, getTextDimensions, LABEL_HEIGHT } from '../diagram/providers/ClassDiagramPaletteProvider';
import { randomID } from 'uml-client/lib/types/element.js';
import { isPropertyValidForMultiplicityLabel } from '../diagram/providers/relationships/Association';
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
    emits: ['focus', 'elementUpdate', 'command'],
    inject: ['draginfo', 'elementUpdate', 'userSelected', 'userDeselected', 'latestCommand', 'commandUndo'],
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
            if (this.emitter) {
                this.emitter.emit('user.selected',newUserSelected);
            }
        },
        userDeselected(newUserDeselected) {
            if (this.emitter) {
                this.emitter.emit('user.deselected', newUserDeselected);
            }
        },
        latestCommand(newCommand) {
            if (newCommand.redo === this.umlID) {
                return;
            }
            if (newCommand.element === this.umlID) {
                return;
            }
            
            newCommand.context.proxy = true;
            this.emitter.emit('externalCommand', newCommand);
        },
    },
    async mounted() {
        this.reloadDiagram();        
    },
    unmounted() {
        this.diagram.get('keyboard').unbind(document);
    },
    methods: {
        // specification(event) {
        //     if (event.currentTarget == this.$refs.diagram) {
        //         this.$emit('specification', event);
        //     }
        // },
        async reloadDiagram() {
            this.loading = true;
            if (this.diagram) {
                this.diagram.destroy()
            }
            const scopedEmitter = new EventEmitter();

            // get the diagram as a regular UML Package first
            const diagramPackage = await this.$umlWebClient.get(this.umlID);

            // we will be using the built in api to get the diagram as a Diagram type from our Profile
            await this.$umlCafeModule.initialization;
            const DIManager = new this.$umlCafeModule.module.UMLManager(diagramPackage, this.$umlWebClient);
            const umlDiagram = await DIManager.get(this.umlID);
            const classifierShapeStyle = await umlDiagram.classifierShapeStyle.get();
            await classifierShapeStyle.fillColor.get();
            await classifierShapeStyle.fontColor.get();
            this.diagram = new Editor({
                container: this.$refs.diagram,
                umlWebClient: this.$umlWebClient,
                emitter: scopedEmitter,
                context: await diagramPackage.owningPackage.get(),
                // diagramElement: diagramPackage, // TODO delete
                umlDiagram: umlDiagram,
                diManager: DIManager,
            });
            const canvas = this.diagram.get('canvas');
            const elementFactory = this.diagram.get('elementFactory');
            const elementRegistry = this.diagram.get('elementRegistry');
            const commandStack = this.diagram.get('commandStack');
            const umlRenderer = this.diagram.get('umlRenderer');
            const diagramContext = this.diagram.get('diagramContext');
            
            this.diagram.get('keyboard').bind(document);

            // add root
            const root = elementFactory.createRoot({
                id: umlDiagram.id 
            });

            canvas.setRootElement(root);

            // TODO / In Progress
            // Diagram Frame shape
            let diagramFrame = undefined;
            if (umlDiagram.isFrame) {
                // create frame

                // TODO determine size
                
                // move viewbox to show heading
                const oldViewbox = canvas.viewbox();
                canvas.viewbox({
                    x: -139,
                    y: -25,
                    width: oldViewbox.width,
                    height: oldViewbox.height,
                });

                // create diagram Frame
                const divRect = this.$refs.diagram.getBoundingClientRect();
                const modelElement = await this.$umlWebClient.get((await umlDiagram.modelElement.front()).modelElementID);
                diagramFrame = elementFactory.createShape({
                    x: 0,
                    y: 0,
                    width: divRect.width -175,
                    height: divRect.height - 50,
                    id: umlDiagram.id,
                    elementType: umlDiagram.elementType(),
                    modelElement: modelElement,
                    isFrame: true,
                    name: umlDiagram.name,
                    documentation: umlDiagram.name,
                });
                canvas.addShape(diagramFrame);

                // add heading
                const width = 5 + umlRenderer.textUtil.getDimensions(modelElement.elementType(), {
                        align: 'left-middle',
                        padding: {
                            left: 5,
                        },
                        style: {
                            fontWeight: 'Bold',
                        },
                        box: {
                            width: 1000,
                            height: LABEL_HEIGHT,
                            x: 0,
                            y: 0,
                        }
                    }).width + 5 + umlRenderer.textUtil.getDimensions(umlDiagram.name, {
                        align: 'left-middle',
                        padding: {
                            left: 5,
                        },
                        box: {
                            width: 1000,
                            height: LABEL_HEIGHT,
                            x: 0,
                            y: 0,
                        }
                    }).width + 10;
                let headingID = undefined;
                if (!umlDiagram.heading) {
                    headingID = randomID();
                } else {
                    headingID = umlDiagram.heading;
                }
                const diagramHeading = elementFactory.createLabel({
                    id: headingID,
                    elementType: 'UMLLabel',
                    modelElement: modelElement,
                    parent: diagramFrame,
                    labelTarget: diagramFrame,
                    headedDiagram: diagramFrame,
                    diagramKind: umlDiagram.modelElement.elementType(),
                    diagramName: umlDiagram.name,
                    x: 0,
                    y: 0,
                    width: width,
                    height: 25,
                    inselectable: true,
                });
                diagramFrame.heading = diagramHeading;

                if (!umlDiagram.heading) {
                    await createDiagramLabel(diagramHeading, this.$umlWebClient, diagramContext);
                    await updateClassDiagram(diagramFrame, this.$umlWebClient);
                }
                canvas.addShape(diagramHeading, diagramFrame);
            }


            // set up diagram from model
            {
                
                const drawDiagramElement = async (umlDiagramElement) => {
                    const shapeAlreadyDrawn = elementRegistry.get(umlDiagramElement.id); 
                    if (shapeAlreadyDrawn) {
                        return shapeAlreadyDrawn;
                    }
                    const updateLabelTextAndBounds = (text, connection, placement) => {
                        umlDiagramElement.text = text;
                        const oldWidth = umlDiagramElement.bounds.width;
                        umlDiagramElement.bounds.width = Math.round(getTextDimensions(text, umlRenderer).width) + 10;
                        let lastPoint = undefined;
                        if (placement === 'source') {
                            lastPoint = connection.waypoints[0];
                        } else if (placement === 'target') {
                            lastPoint = connection.waypoints.slice(-1)[0];
                        }
                        if (lastPoint.x > umlDiagramElement.bounds.x) {
                            umlDiagramElement.bounds.x += oldWidth - umlDiagramElement.bounds.width;
                        }
                    };
                    if (umlDiagramElement.is('Diagram')) {
                        return root;
                    }
                    if (umlDiagramElement.elementType() === 'UMLShape') {
                        const umlShape = umlDiagramElement;

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
                            elementType: 'UMLShape',
                        });
                        canvas.addShape(shape, parent);
                        return shape;
                    } else if (umlDiagramElement.elementType() === 'UMLClassifierShape') {
                        const umlClassifierShape = umlDiagramElement;
                        if (umlClassifierShape.modelElement.size() === 0) {
                            console.warn('classifier shape with no corresponding model element, deleting!');
                            await DIManager.delete(umlClassifierShape);
                            return undefined;
                        }
                        const modelElement = await this.$umlWebClient.get((await umlClassifierShape.modelElement.front()).modelElementID);
                        let parent = elementRegistry.get(umlClassifierShape.owningElement.id());
                        if (!parent) {
                            parent = await drawDiagramElement(await DIManager.get(umlClassifierShape.owningElement.id()));
                        }
                        if (parent.id === diagramContext.umlDiagram.id) {
                            parent = canvas.findRoot(parent);
                        }
                        const bounds = await umlClassifierShape.bounds.get();
                        // todo compartments
                        const compartments = [];
                        for await (const compartment of umlClassifierShape.compartment) {
                            const compartmentShape = elementFactory.createShape({
                                id: compartment.id,
                                x: bounds.x,
                                y: bounds.y + CLASS_SHAPE_HEADER_HEIGHT,
                                width: bounds.width,
                                height: bounds.height - CLASS_SHAPE_HEADER_HEIGHT,
                                // modelElement: umlClassifierShape.modelElement,
                                elementType: 'UMLCompartment',
                                inselectable: true,
                            });
                            compartments.push(compartmentShape);
                        }
                        const shape = elementFactory.createShape({
                            x: bounds.x,
                            y: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            id: umlClassifierShape.id,
                            modelElement: modelElement,
                            compartments: compartments,
                            elementType: 'UMLClassifierShape',
                        });
                        canvas.addShape(shape, parent);
                        for (const compartmentShape of compartments) {
                            canvas.addShape(compartmentShape, shape);
                        }
                    } else if (umlDiagramElement.elementType() === 'UMLEdge') {
                        const umlEdge = umlDiagramElement;
                        if (!umlEdge.modelElement.size() === 0) {
                            // model element has been deleted
                            await DIManager.delete(umlEdge);
                            return undefined;
                        }

                        let source = elementRegistry.get(umlEdge.source.id());
                        let target = elementRegistry.get(umlEdge.target.id());
                        if (!source) {
                            source = await drawDiagramElement(await umlEdge.source.get());
                        }
                        if (!target) {
                            target = await drawDiagramElement(await umlEdge.target.get());
                        }
                        const modelElement = await this.$umlWebClient.get((await umlEdge.modelElement.front()).modelElementID);
                        if (modelElement.is('Association')) {
                            for await (const memberEnd of modelElement.memberEnds) {
                                await memberEnd.type.get()
                            }
                        }
                        const waypoints = [];
                        for await (const point of umlEdge.waypoints) {
                            waypoints.push({x : point.x, y: point.y});
                        }
                        var relationship = elementFactory.createConnection({
                            waypoints: waypoints,
                            id: umlEdge.id,
                            modelElement: modelElement,
                            source: source,
                            target: target,
                            children: [],
                            elementType: 'UMLEdge',
                            numTargetLabels: 0,
                            numSourceLabels: 0,
                            numCenterLabels: 0,
                        });
                        canvas.addConnection(relationship, diagramFrame ? diagramFrame : root);
                        return relationship;
                    } else if (umlDiagramElement.elementType() === 'UMLLabel') {
                        const umlLabel = umlDiagramElement;
                        if (!umlLabel.modelElement) {
                            // TODO
                            console.error('TODO diagramInterchange');

                        }
                        // TODO create label pointing to shape
                        if ((await umlLabel.modelElement.front()).elementType() === 'Property' && umlLabel.modelElement.association.has()) {
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
                                    elementType: 'UMLLabel',
                                });
                                canvas.addShape(label, labelTarget);
                                return label;
                        }
                    } else if (umlDiagramElement.elementType() === 'UMLNameLabel') {
                        const umlNameLabel = umlDiagramElement;
                        const labelTarget = elementRegistry.get(umlNameLabel.owningElement.id());

                        // update name 
                        let updatedName = false;
                        const modelElement = await this.$umlWebClient.get((await umlNameLabel.modelElement.front()).modelElementID);
                        if (umlNameLabel.text != modelElement.name) {
                            umlNameLabel.text = modelElement.name;
                            updatedName = true;
                        }
                        const bounds = await umlNameLabel.bounds.get();
                        const label = elementFactory.createLabel({
                            id: umlNameLabel.id,
                            text: umlNameLabel.text,
                            modelElement: modelElement,
                            x: bounds.x,
                            y: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            labelTarget: labelTarget,
                            elementType: 'UMLNameLabel',
                            inselectable: !labelTarget.waypoints, // TODO determine this elsewhere
                        });
                        canvas.addShape(label, labelTarget);
                        if (updatedName) {
                            await DIManager.put(umlNameLabel);
                        }

                        return label;
                    } else if (umlDiagramElement.elementType() === 'UMLTypedElementLabel') {
                        const umlTypedElementLabel = umlDiagramElement;
                        const labelTarget = elementRegistry.get(umlTypedElementLabel.owningElement.id());

                        // update text
                        const modelElement = await this.$umlWebClient.get((await umlTypedElementLabel.modelElement.front()).modelElementID);
                        await modelElement.type.get();
                        let newText = getTypedElementText(modelElement);
                        if (newText != umlTypedElementLabel.text) {
                            umlTypedElementLabel.text = newText;
                            umlTypedElementLabel.bounds.width = Math.round(getTextDimensions(newText, this.diagram.get('umlRenderer')).width) + 15;
                        }
                        let placement;
                        if (labelTarget.waypoints) {
                            placement = 'center';
                        }
                        const bounds = await umlTypedElementLabel.bounds.get();
                        const label = elementFactory.createLabel({
                            id: umlTypedElementLabel.id,
                            text: umlTypedElementLabel.text,
                            modelElement: modelElement,
                            x: bounds.x,
                            y: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            labelTarget: labelTarget,
                            elementType: 'UMLTypedElementLabel',
                            placement: placement,
                        });
                        if (newText) {
                            await DIManager.put(umlTypedElementLabel);
                        }
                        canvas.addShape(label, labelTarget);
                        return label;
                    } else if (umlDiagramElement.elementType() === 'UMLKeywordLabel') {
                        const labelTarget = elementRegistry.get(umlDiagramElement.owningElement.id());
                        let placement;
                        if (labelTarget.waypoints) {
                            placement = 'center';
                        }
                        const bounds = await umlDiagramElement.bounds.get();
                        const label = elementFactory.createLabel({
                            id: umlDiagramElement.id,
                            text: umlDiagramElement.text,
                            modelElement: await this.$umlWebClient.get((await umlDiagramElement.modelElement.front()).modelElementID),
                            x: bounds.x,
                            y: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            elementType: 'UMLKeywordLabel',
                            inselectable: true, // TODO determine this elsewhere
                            placement: placement,
                        });
                        canvas.addShape(label, labelTarget);
                        return label;
                    } else if (umlDiagramElement.elementType() === 'UMLAssociationEndLabel') {
                        const labelTarget = elementRegistry.get(umlDiagramElement.owningElement.id());
                        const modelElement = await this.$umlWebClient.get((await umlDiagramElement.modelElement.front()).modelElementID);
                        let placement;
                        let placementIndex;
                        if (labelTarget.waypoints) {
                            // setup alignment
                            placementIndex = 0; // always put it on top (Assumption) // get around this by having additional di
                            if (modelElement.type.id() === labelTarget.source.modelElement.id) {
                                placement = 'source'
                                labelTarget.numSourceLabels += 1;
                            } else if (modelElement.type.id() === labelTarget.target.modelElement.id) {
                                placement = 'target';
                                labelTarget.numTargetLabels += 1;
                            }
                        }
                        // update name 
                        let updatedName = false;
                        if (modelElement.name === '') {
                            // not valid, delete from diagram
                            await DIManager.delete(umlDiagramElement);
                            return undefined;
                        }

                        if (umlDiagramElement.text != modelElement.name) {
                            updatedName = true;
                            updateLabelTextAndBounds(modelElement.name, labelTarget, placement);
                        }
                        const bounds = await umlDiagramElement.bounds.get();
                        const label = elementFactory.createLabel({
                            id: umlDiagramElement.id,
                            text: umlDiagramElement.text,
                            modelElement: modelElement,
                            labelTarget: labelTarget,
                            x: bounds.x,
                            y: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            elementType: 'UMLAssociationEndLabel',
                            placement: placement,
                            placementIndex: placementIndex,
                        });
                        if (updatedName) {
                            throw Error('uh oh');
                        }
                        canvas.addShape(label, labelTarget);
                        return label;
                    } else if (umlDiagramElement.elementType() === 'UMLMultiplicityLabel') {
                        const labelTarget = elementRegistry.get(umlDiagramElement.owningElement);
                        const modelElement = await this.$umlWebClient.get((await umlDiagramElement.modelElement.front()).modelElementID);
                        const bounds = await umlDiagramElement.bounds.get();
                        let placement;
                        let placementIndex;
                        if (labelTarget.waypoints) {
                            placementIndex = 1; // put on bottom // assumption since it is multiplicityLabel
                            // setup alignment
                            if (umlDiagramElement.modelElement.type.id() === labelTarget.source.modelElement.id) {
                                placement = 'source'
                                labelTarget.numSourceLabels += 1;
                            } else if (umlDiagramElement.modelElement.type.id() === labelTarget.target.modelElement.id) {
                                placement = 'target';
                                labelTarget.numTargetLabels += 1;
                            }
                        }

                        // TODO update label if changed
                        if (!(await isPropertyValidForMultiplicityLabel(modelElement))) {
                            // not valid, delete from diagram
                            await DIManager.delete(umlDiagramElement);
                            return undefined;
                        }

                        let multiplicityText = (await modelElement.lowerValue.get()).value + '..' + (await modelElement.upperValue.get()).value;
                        let updateMultiplictyLabel = false;
                        if (multiplicityText !== umlDiagramElement.text) {
                            updateMultiplictyLabel = true;
                            updateLabelTextAndBounds(multiplicityText, labelTarget, placement);
                        }

                        const label = elementFactory.createLabel({
                            id: umlDiagramElement.id,
                            text: umlDiagramElement.text,
                            modelElement: modelElement,
                            labelTarget: labelTarget,
                            x: bounds.x,
                            y: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            elementType: 'UMLMultiplicityLabel',
                            placement: placement,
                            placementIndex: placementIndex,
                        });
                        if (updateMultiplictyLabel) {
                            await DIManager.put(umlDiagramElement);
                        }
                        canvas.addShape(label, labelTarget);
                        return label;
                    } else {
                        throw Error('unhandled uml di type on diagram loading!');
                    }
                }

                const edges = [];
                const labels = [];
                const shapes = [];
                for await (const diagramElement of umlDiagram.ownedElement) {
                    if (diagramElement.is('UMLEdge')) {
                        edges.push(diagramElement);
                    } else if (diagramElement.is('UMLLabel')) {
                        labels.push(diagramElement);
                    } else if (diagramElement.is('UMLShape')) {
                        shapes.push(diagramElement);
                    }
                }

                const drawDiagramElementAndChildren = async (shape) => {
                    await drawDiagramElement(shape);
                    const queue = [];
                    const addChildrenToQueue = async (parent) => {
                        for await (const diagramElement of parent.ownedElement) {
                            queue.push(diagramElement);
                        }
                    };
                    await addChildrenToQueue(shape);
                    
                    while (queue.length > 0) {
                        const front = queue.shift();
                        await drawDiagramElement(front);
                        await addChildrenToQueue(front);
                    }
                };

                for (const shape of shapes) {
                    await drawDiagramElementAndChildren(shape);
                }

                for (const edge of edges) {
                    await drawDiagramElementAndChildren(edge);
                }

                for (const label of labels) {
                    await drawDiagramElementAndChildren(label);
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
            scopedEmitter.on('focus', (event) => {
                diagramPage.$emit('focus', event);
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
                if (command.element === this.umlID && command.name !== 'elementExplorerRename') { // there may be more edgecases as development continues
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
    <div
        v-if="this.loading" 
        style="position:absolute;background-color:var(--vt-c-dark-dark);opacity:75%;width:100%;height:100%;z-index:5;text-align:center;">
        <img style="display: block;margin-left: auto;margin-right: auto;margin-top:45vh;" width="50" alt="YouTube loading symbol 3 (transparent)" src="https://upload.wikimedia.org/wikipedia/commons/a/ad/YouTube_loading_symbol_3_%28transparent%29.gif">
    </div>
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
