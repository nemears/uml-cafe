<script>
import packageImage from '../assets/icons/general/package.svg';
import getImage from '../GetUmlImage.vue';
import classDiagramImage from '../assets/icons/general/class_diagram.svg';
import { assignTabLabel, createElementUpdate, deleteElementElementUpdate, createUmlClassDiagram, mapColor, getPanelClass, isTypedElement } from '../umlUtil.js'
import { randomID } from 'uml-client/lib/types/element';

export default {
    name: "ElementExplorer",
    props: [
        "umlID",
        "depth",
        "selectedElements",
        "treeGraph",
        'theme',
    ],
    inject: [
        'elementUpdate',
        'treeUpdate',
        'userSelected',
        'userDeselected',
        'latestCommand',
        'commandUndo',
    ],
    emits: [
        'specification',
        'elementUpdate',
        'diagram',
        'draginfo',
        'select',
        'deselect',
        'updateTree',
        'command',
    ],
    mounted() {
        this.populateDisplayInfo();
    },
    data() {
        return {
            name: "",
            isFetching: true,
            children: [],
            expanded: false,
            image: packageImage,
            options: [],
            editing: false,
            diagram: false,
            elementType: undefined,
            expandSymbol: '+',
            selected: false,
            currentUsers: [],
            hover: false,
            typedElementLabel: "",
            stereotypedLabel: [],
            propertyLabel: "",
            generalizationLabel: ""
        };
    },
    components: [
        "ElementExplorer"
    ],
    computed: {
        indent() {
            return {
                "min-width": 25 * this.depth + "px",
                overflow: 'visible'
            };
        },
        umlName() {
            return this.name;
        },
        panelClass() {
            return getPanelClass(this.selected, this.hover, this.currentUsers, this.$umlWebClient, this.theme);
        }
    },
    watch: {
        async elementUpdate(newElementUpdate) {
          await this.handleElementUpdate(newElementUpdate);  
        },
        selectedElements(newSelectedElements) {
            if (this.selected) {
                if (!newSelectedElements.includes(this.umlID)) {
                    this.selected = false;
                }
            } else {
                if (newSelectedElements.includes(this.umlID)) {
                    this.selected = true;
                }
            }
        },
        treeUpdate(newTreeNode) {
            if (this.umlID === newTreeNode.id) {
                this.expanded = newTreeNode.expanded;
                if (this.expanded) {
                    this.expandSymbol = '-';
                } else {
                    this.expandSymbol = '+';
                } 
                this.children = newTreeNode.childOrder;
            }
        },
        userSelected(newUserSelected) {
            if (newUserSelected.id === this.umlID) {
                this.currentUsers.push(mapColor(newUserSelected.color))
            }
        },
        userDeselected(newUserDeselcted) {
            for (const element of newUserDeselcted.elements) {
                if (element === this.umlID && this.currentUsers.includes(mapColor(newUserDeselcted.color))) {
                    this.currentUsers.splice(this.currentUsers.indexOf(mapColor(newUserDeselcted.color)), 1);
                }
            }
        },
        async latestCommand(newCommand) {
            const context = newCommand.context;
            if (newCommand && newCommand.element === this.umlID && newCommand.redo) {
                const commandName = newCommand.name;
                if (commandName === 'elementExplorerCreate') {
                    const createElID = context.createElID,
                    type = context.type,
                    set = context.set,
                    parentID = context.parentID;
                    this.createElementAndAddToSet(createElID, type, set, await this.$umlWebClient.get(parentID));
                } else if (commandName === 'diagramCreate') {
                    const diagramID = newCommand.context.diagramID;
                    await this.createNewClassDiagram(await this.$umlWebClient.get(this.umlID), diagramID);
                } else if (commandName === 'elementExplorerRename') {
                    await this.rename(context.newName)
                } else if (commandName === 'elementExplorerDelete') {
                    await this.deleteElement(await this.$umlWebClient.get(context.elementDirectlyDeleted));
                }
            }
        },
        async commandUndo(undoCommand) {
            if (undoCommand && undoCommand.element === this.umlID) {
                // our scope
                const commandName = undoCommand.name,
                context = undoCommand.context;
                if (commandName === 'elementExplorerCreate') {
                    const createdElID = context.createElID;
                    await this.deleteElement(await this.$umlWebClient.get(createdElID));
                } else if (commandName === 'diagramCreate') {
                    const diagramID = context.diagramID;
                    await this.deleteElement(await this.$umlWebClient.get(diagramID));
                } else if (commandName === 'elementExplorerRename') {
                    await this.rename(context.oldName);
                } else if (commandName === 'elementExplorerDelete') {
                    for (const rawData of context.elementsData) {
                        const parseData = this.$umlWebClient.parse(rawData);
                        const remadeElement = parseData.newElement;
                        this.$emit('elementUpdate', createElementUpdate(remadeElement));
                        this.$umlWebClient.put(remadeElement);
                    }
                    this.$emit('updateTree', {
                        id: this.umlID,
                        children: this.children,
                        expanded: true,
                    });
                }
            }
        }
    },
    methods: {
        async createElementAndAddToSet(id, type, set, parent) {
            const createdEl = await this.$umlWebClient.post(type, {id:id});
            await parent.sets.get(set).add(createdEl);
            this.$umlWebClient.put(createdEl);
            this.$umlWebClient.put(parent);
            this.children.push(createdEl.id);
            this.expanded = true;
            this.$emit('elementUpdate', createElementUpdate(parent));
            this.$emit('updateTree', {
                id: this.umlID,
                children: this.children,
                expanded: true,
            });
            return createdEl;
        },
        async deleteElement(el) {
            const owner = await el.owner.get();
            this.$emit('elementUpdate', deleteElementElementUpdate(el));
            await this.$umlWebClient.deleteElement(el);
            this.$umlWebClient.put(owner);
            this.$emit('elementUpdate', createElementUpdate(owner));
        },
        async createNewClassDiagram(el, diagramID) {
            const diagramPackage = await createUmlClassDiagram(diagramID, el, this.$umlWebClient);
            this.expanded = true;
            this.children.push(diagramPackage.id);
            this.$emit('updateTree', {
                id: this.umlID,
                children: this.children,
                expanded: true,
            });
            this.$emit('diagram', diagramPackage);
            return diagramPackage;
        },
        async populateDisplayInfo() {
            const treeNode = this.treeGraph.get(this.umlID);
            this.expanded = treeNode.expanded;
            if (this.expanded) {
                this.expandSymbol = '-';
            } else {
                this.expandSymbol = '+';
            }

            // check if other users have selected this
            this.currentUsers = treeNode.usersSelecting.map(user => mapColor(user.color));

            let el = await this.$umlWebClient.get(this.umlID);
            if (!el) {
                throw Error("bad state, element in tree not in client!");
            }
            this.elementType = el.elementType();
            if (el.appliedStereotypes.size() > 0) {
                for await (let stereotypeInst of el.appliedStereotypes) {
                    if (stereotypeInst.classifiers.contains('Diagram_nuc1IC2Cavgoa4zMBlVq')) {
                        this.diagram = true;
                        this.image = classDiagramImage;
                    }
                }
            }
            if (!this.diagram) {
                this.image = getImage(el);
            }
            this.options.push({ 
                        label: "Specification", 
                        onClick: async () => {
                            this.$emit('specification', await this.$umlWebClient.get(this.umlID));
                        }
                    });
            if (el.is('NamedElement')) {
                this.options.push({
                    label: 'Rename',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        this.editing = true;
                        setTimeout(() => {
                            // select text for user
                            let sel = window.getSelection();
                            sel.removeAllRanges();
                            let range = document.createRange();
                            range.selectNodeContents(this.$refs.nameDiv);
                            sel.addRange(range);
                        }, '0.1 seconds');
                    },
                    divided: true
                });
            }
            // creation options

            // create diagrams
            if (el.is('Package')) {
                this.options.push({
                    label: 'Create Class Diagram',
                    disabled: this.$umlWebClient.readonly,
                    onClick: async () => {
                        const diagramID = randomID()
                        this.$emit('command', {
                            name: 'diagramCreate',
                            element: this.umlID,
                            redo: false,
                            context: {
                                diagramID: diagramID,
                                parentID: this.umlID,
                            }
                        });
                        this.createNewClassDiagram(await this.$umlWebClient.get(this.umlID), diagramID);
                    }
                });
            }

            const createAndAddToSet = async (type, set) => {
                const createdEl = await this.createElementAndAddToSet(randomID(), type, set, await this.$umlWebClient.get(el.id));
                this.$emit('command', {
                    name: 'elementExplorerCreate',
                    element: this.umlID,
                    redo: false,
                    context: {
                        createElID: createdEl.id,
                        parentID: this.umlID,
                        set: set,
                        type: type,
                    }
                });
            };

            // create elements
            const createOption = {
                label: 'Create Element',
                children: []
            };
            for (let commentID of el.ownedComments.ids()) {
                this.children.push(commentID);
            }
            if (el.is('Classifier')) {
                for (let generalizationID of el.generalizations.ids()) {
                    this.children.push(generalizationID);
                }
                if (el.is('Class') || el.is('DataType')) {
                    for (let attributeID of el.ownedAttributes.ids()) {
                        this.children.push(attributeID);
                    }
                }
                createOption.children.push({
                    label: 'Create Property',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('Property', 'ownedAttributes')
                    }
                });
            }
            if (el.is('Association')) {
                for (let propertyID of el.ownedEnds.ids()) {
                    this.children.push(propertyID);
                }
            }
            if (el.is('Enumeration')) {
                for (const literalID of el.ownedLiterals.ids()) {
                    this.children.push(literalID);
                }
                createOption.children.push({
                    label: 'Create Enumeration',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('Enumeration', 'ownedLiterals')
                    }
                });
            }
            if (el.is('InstanceSpecification')) {
                for (let slotID of el.slots.ids()) {
                    this.children.push(slotID);
                }
                createOption.children.push({
                    label: 'Create Slot',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('Slot', 'slots')
                    }
                });
            }
            if (el.is('Package')) {
                for (let packagedElID of el.packagedElements.ids()) {
                    this.children.push(packagedElID);
                }
                createOption.children.push({
                    label: 'Create Package',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('Package', 'packagedElements')
                    }
                });
                createOption.children.push({
                    label: 'Create Class',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('Class', 'packagedElements')
                    }
                });
                createOption.children.push({
                    label: 'Create Data Type',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('DataType', 'packagedElements')
                    }
                }); 
                createOption.children.push({
                    label: 'Create Primitive Type',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('PrimitiveType', 'packagedElements')
                    }
                });
                createOption.children.push({
                    label: 'Create Association',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('Association', 'packagedElements');
                    }
                });
                createOption.children.push({
                    label: 'Create Instance Specification',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('InstanceSpecification', 'packagedElements')
                    }
                });
                createOption.children.push({
                    label: 'Create Interface',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('Interface', 'packagedElements')
                    }
                });
                createOption.children.push({
                    label: 'Create Signal',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('Signal', 'packagedElements')
                    }
                });
            }

            this.options.push(createOption);

            this.options.push({
                label: 'Delete',
                disabled: this.$umlWebClient.readonly,
                onClick: async () => {
                    const el = await this.$umlWebClient.get(this.umlID);
                    const owner = await el.owner.get();
                    const queue = [el];
                    const elementsData = [owner.emit()];
                    while (queue.length > 0) {
                        const front = queue.shift();
                        elementsData.push(front.emit());
                        for await (const ownedEl of front.ownedElements) {
                            queue.push(ownedEl);
                        }
                    }
                    if (!owner) {
                        throw Error('Cannot delete root of model sorry!');
                    }
                    this.$emit('command', {
                        name: 'elementExplorerDelete',
                        element: owner.id,
                        redo: false,
                        context: {
                            elementDirectlyDeleted: this.umlID,
                            elementsData: elementsData,
                        }
                    });
                    this.deleteElement(el);
                }
            });
            
            if (el.is('TypedElement') && el.type.has()) {
                this.typedElementLabel = ': ' + (await el.type.get()).name;
            }
            if (el.appliedStereotypes && el.appliedStereotypes.size() !== 0) {
                for await (let instance of el.appliedStereotypes) {
                    for await (let classifier of instance.classifiers) {
                        this.stereotypedLabel.push('«' + classifier.name + '»'); 
                    }
                }
            }
            if (el.is('Property') && el.defaultValue.has()) {
                const defaultValue = await el.defaultValue.get();
                if (defaultValue.elementType() === 'literalString') {
                    this.propertyLabel = '= "' + (await el.defaultValue.get()).value + '"';
                } else {this.propertyLabel = '= ' + (await el.defaultValue.get()).value;}
            }
            if (el.is('Generalization')) {
                if (el.general.has()) {
                    var name = (await el.general.get()).name;
                    this.generalizationLabel = '-> ' + name;
                } else {
                    this.generalizationLabel = '';
                }
            }

            this.name = await assignTabLabel(el);
            this.isFetching = false;
        },
        childrenToggle() {
            if (this.diagram) {
                return;
            }
            
            this.$emit('updateTree', {
                id: this.umlID,
                children: this.children,
                expanded: !this.expanded,
            });
        },
        async stopRename() {
            this.editing = false;
            const name = this.$refs.nameDiv.innerText || this.$refs.nameDiv.textContent;
            const el = await this.$umlWebClient.get(this.umlID);
            const oldName = el.name;
            await this.rename(name);
            this.$emit('command', {
                name: 'elementExplorerRename',
                element: this.umlID,
                redo: false,
                context: {
                    oldName: oldName,
                    newName: el.name,
                }
            });
        },
        async rename(name) {
            this.name = name;
            const el = await this.$umlWebClient.get(this.umlID);
            el.name = this.name;
            this.$umlWebClient.put(el);
            this.$emit('elementUpdate', createElementUpdate(el));
        },
        cancelRename() {
            this.editing = false;
            // TODO set name back to original!
            // TODO fix me fix me!
        },
        onContextMenu(evt) {
            //prevent the browser's default menu
            if (evt.ctrlKey) {
                return;
            }
            evt.preventDefault();
            //show our menu
            this.$contextmenu({
                x: evt.x,
                y: evt.y,
                items: this.options
            });
        },
        propogateSpecification(spec) {
            this.$emit('specification', spec);
        },
        async handleElementUpdate(newElementUpdate) { //add data here
            for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                const oldElement = update.oldElement;
                // const oldElement = newElementUpdate.oldElement;
                if (!newElement) {
                    if (isTypedElement(this.elementType)) {
                        const element = await this.$umlWebClient.get(this.umlID);
                        if (oldElement.is('Classifier')) {
                            if (element.type.id() === oldElement.id) {
                                    this.typedElementLabel = '';
                            }
                        }
                    }
                    // TODO delete
                    // check if the deleted element is in our children
                    // might not be worth it
                    // pros: client will be able to update with out getting this element
                    // cons: will always run a loop through all of our children when an element is updated (laggy)
                } else if (newElement.id === this.umlID) { //umlID represents 
                    //name
                    if (newElement.is('NamedElement')) {
                        if (newElement.name !== this.name) {
                            this.name = newElement.name; 
                        } 
                    }
                    
                    // check children
                    // add
                    const childrenCopies = [...this.children];
                    for (const ownedElementID of newElement.ownedElements.ids()) {
                        if (!this.children.includes(ownedElementID)) {
                            this.children.push(ownedElementID);
                        }
                    }
                    // remove
                    for (const childID of childrenCopies) {
                        if (!newElement.ownedElements.contains(childID)) {
                           this.children = this.children.filter(child => child !== childID); 
                        }
                    }

                    this.$emit('updateTree', {
                        id: this.umlID,
                        children: this.children,
                        expanded: this.expanded,
                    });

                    const element = await this.$umlWebClient.get(this.umlID);
                    if (element && element.is('Comment')) {
                        for (let elID of element.annotatedElements.ids()) {
                            if (elID === newElement.id) {
                                this.name = await assignTabLabel(element);
                            }
                        }
                    }
                    if (newElement.is('TypedElement')) {
                        if (newElement.type.has()) {
                            this.typedElementLabel = ': ' + (await newElement.type.get()).name;
                        } else { this.typedElementLabel = ''; }    
                    }
                    if (newElement.appliedStereotypes && newElement.appliedStereotypes.size() !== 0) {
                        const newStereotypeLabels = [];
                        for await (let instance of newElement.appliedStereotypes) {
                            for await (let classifier of instance.classifiers) {
                                newStereotypeLabels.push('«' + classifier.name + '»'); 
                            }
                        }
                        this.stereotypedLabel = newStereotypeLabels;
                    }
                    if (newElement.elementType() === 'Property' && newElement.defaultValue.has()) {
                        const defaultValue = await newElement.defaultValue.get();
                        if (defaultValue.elementType() === 'LiteralString') {
                            this.propertyLabel = '= "' + (await newElement.defaultValue.get()).value + '"';
                        } else {this.propertyLabel = '= ' + (await newElement.defaultValue.get()).value;}
                    }
                    
                    if (newElement.is('Generalization')) {
                        this.generalizationLabel = '-> ' + await (newElement.general.get()).name;
                    }
                        
                } else {
                    if (isTypedElement(this.elementType)) {
                        const element = await this.$umlWebClient.get(this.umlID);
                        if (newElement.is('Classifier')) {
                            if (element.type.id() === newElement.id) {
                                this.typedElementLabel = ': ' + newElement.name;
                            }
                        }
                    }
                    if (this.elementType === 'Property') {
                        const element = await this.$umlWebClient.get(this.umlID);
                        if (element.defaultValue.has() && (element.defaultValue.id() === newElement.id)) {
                            if (newElement.value) {
                                if (newElement.elementType() === 'LiteralString') {
                                    this.propertyLabel = '= "' + newElement.value + '"';
                                } else {this.propertyLabel = '= ' + newElement.value;}
                            }
                        }
                    }
                    if (this.elementType === 'Generalization') {
                        const element = await this.$umlWebClient.get(this.umlID);
                        if (newElement.is('Classifier')) {
                            if (element.general.id() === newElement.id) {
                                this.generalizationLabel = '-> ' + newElement.name;
                            }
                        }
                    }
                }
            }
             
        },
        async propogateElementUpdate(newElementUpdate) {
            await this.handleElementUpdate(newElementUpdate);
            this.$emit('elementUpdate', newElementUpdate);
        },
        propogateDiagram(diagramClass) {
            this.$emit('diagram', diagramClass);
        },
        async specification() {
            if (this.diagram) {
                this.$emit('diagram', await this.$umlWebClient.get(this.umlID));
            } else {
                this.$emit('specification', await this.$umlWebClient.get(this.umlID));
            }
        },
        async startDrag(modifier, event) {
            const me = this;
            event.dataTransfer.setData('umlID', this.umlID);
            event.dataTransfer.dropEffect = 'copy';
            event.dataTransfer.effectAllowed = 'all';
            if (!this.selected) {
                this.selected = true;
                this.$emit('select', {
                    el: this.umlID,
                    modifier: modifier,
                });
            }
            this.$emit('draginfo', {
                element: await me.$umlWebClient.get(me.umlID),
                event: event,
            });
        },
        propogateDraginfo(draginfo) {
            this.$emit('draginfo', draginfo);
        },
        select(modifier) {
            this.selected = !this.selected;
            if (this.selected) {
                this.$emit('select', {
                    el: this.umlID,
                    modifier: modifier,
                });
            } else {
                this.$emit('deselect', {
                    el: this.umlID,
                    modifier: modifier,
                });
            }
        },
        propogateSelect(event) {
            this.$emit('select', event);
        },
        propogateDeselect(event) {
            this.$emit('deselect', event);
        },
        propogateUpdateTree(event) {
            this.$emit('updateTree', event);
        },
        propogateCommand(event) {
            this.$emit('command', event);
        },
        mouseEnter() {
            if (!this.hover) {
                this.hover = true;
            }
        },
        mouseLeave() {
            if (this.hover) {
                this.hover = false;
            }
        },
    }
}
</script>
<template>
    <div class="elementExplorerBlock" v-if="!isFetching" :class="{notFirstBlock: depth !== 0}" draggable="false">
        <div draggable="true"
             class="elementExplorerPanel"
             :class="panelClass"
             @click.exact="select('none')"
             @click.ctrl="select('ctrl')"
             @click.shift="select('shift')"
             @dblclick="specification"
             @dragstart.exact="startDrag('none', $event)"
             @dragstart.ctrl="startDrag('ctrl', $event)"
             @dragstart.shift="startDrag('shift', $event)"
             @mouseenter="mouseEnter"
             @mouseleave="mouseLeave"
             @contextmenu="onContextMenu($event)">
            <div :style="indent"></div>
            <div v-if="children.length > 0 && !diagram" @click.stop="childrenToggle" class="expandSymbol">
                {{ expandSymbol }}
            </div>
            <div v-if="children.length == 0 || diagram" class="noExpand"></div>
            <div style="display:inline-flex;" 
                 draggable="true">
                <img v-bind:src="image" draggable="false"/>
                <div style="display:inline-flex;white-space:nowrap;" 
                     ref="nameDiv" :contenteditable="editing" 
                     @keydown.enter.prevent="stopRename"
                     @keydown.escape="cancelRename">
                    {{ umlName }}
                </div>
                <div v-if="typedElementLabel.length != 0" style="color:gray" class="labelSpacing">{{ typedElementLabel }}</div>
                <div v-if="propertyLabel.length != 0" style="color:lightgray" class="labelSpacing">{{ propertyLabel }}</div>
                <div style="color:orange" class="labelSpacing" v-for="label in stereotypedLabel" :key="label">{{ label }}</div>
                <div v-if="generalizationLabel.length != 0" class="labelSpacing">{{ generalizationLabel }}</div>
                    <!-- TODO we need some sort of handling for a click-outside of this div directive to cancel rename TODO -->
            </div>
        </div>
        <div v-if="expanded && !isFetching">
            <ElementExplorer v-for="child in children" 
                    :umlID="child" 
                    :depth="depth + 1"
                    :selected-elements="selectedElements"
                    :tree-graph="treeGraph"
                    :theme="theme"
                    :key="child"
                    @specification="propogateSpecification" 
                    @element-update="propogateElementUpdate"
                    @diagram="propogateDiagram"
                    @draginfo="propogateDraginfo"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    @update-tree="propogateUpdateTree"
                    @command="propogateCommand"></ElementExplorer>
        </div>
    </div>
</template>
<style>
.elementExplorerBlock {
    min-width: 300px;
    display: inline-block;
    font-size: 0px;
}
.notFirstBlock {
    width:100%;
}
.elementExplorerPanel {
    vertical-align: middle;
    min-width: 300px;
    display: inline-flex;
    width: 100%;
    font-size: 15px;
}
.elementExplorerPanelDarkHover {
    background-color: var(--vt-c-dark-soft);
}
.elementExplorerPanelDark {
    background-color: var(--vt-c-dark);
}
.elementExplorerPanelLightHover {
    background-color: var(--vt-c-white-mute);
    color: var(--vt-c-dark-dark);
}
.elementExplorerPanelLight {
    background-color: var(--vt-c-white-soft);
    color: var(--vt-c-dark-dark);
}
.redUserPanel {
    background-color: var(--uml-cafe-red-user);
}
.redUserPanelLight {
    background-color: var(--uml-cafe-red-user-light);
}
.blueUserPanel {
    background-color: var(--uml-cafe-blue-user);
}
.blueUserPanelLight {
    background-color: var(--uml-cafe-blue-user-light);
}
.greenUserPanel {
    background-color: var(--uml-cafe-green-user);
}
.greenUserPanelLight {
    background-color: var(--uml-cafe-green-user-light);
}
.yellowUserPanel {
    background-color: var(--uml-cafe-yellow-user);
}
.yellowUserPanelLight {
    background-color: var(--uml-cafe-yellow-user-light);
}
.magentaUserPanel {
    background-color: var(--uml-cafe-magenta-user);
}
.magentaUserPanelLight {
    background-color: var(--uml-cafe-magenta-user-light);
}
.orangeUserPanel {
    background-color: var(--uml-cafe-orange-user);
}
.orangeUserPanelLight {
    background-color: var(--uml-cafe-orange-user-light);
}
.cyanUserPanel {
    background-color: var(--uml-cafe-cyan-user);
}
.cyanUserPanelLight {
    background-color: var(--uml-cafe-cyan-user-light);
}
.limeUserPanel {
    background-color: var(--uml-cafe-lime-user);
}
.limeUserPanelLight {
    background-color: var(--uml-cafe-lime-user-light);
}
.expandSymbol {
    padding-left: 5px;
    padding-right: 5px;
    font-size: 14px;
    width: 15px;
    -webkit-user-select: none; /* Safari */        
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
}
.noExpand {
    min-width: 15px;
}
.labelSpacing {
    padding-left:5px;
    padding-right:5px;
    white-space: nowrap;
}
</style>
