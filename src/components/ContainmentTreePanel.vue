<script>
import packageImage from './icons/package.svg';
import getImage from '../GetUmlImage.vue';
import classDiagramImage from './icons/class_diagram.svg';
import { createElementUpdate, deleteElementElementUpdate } from '../createElementUpdate.js'

export default {
    name: "ContainmentTreePanel",
    props: [
        "umlID",
        "depth",
    ],
    inject: [
        'elementUpdate',
    ],
    emits: [
        'specification',
        'elementUpdate',
        'diagram',
        'draginfo',
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
        };
    },
    components: [
        "ContainmentTreePanel"
    ],
    computed: {
        indent() {
            return {
                width: 25 * this.depth + "px",
                overflow: 'visible'
            };
        },
        umlName() {
            return this.name;
        }
    },
    watch: {
        elementUpdate(newElementUpdate) {
          this.handleElementUpdate(newElementUpdate);  
        }
    },
    methods: {
        async populateDisplayInfo() {
            let el = await this.$umlWebClient.get(this.umlID);
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
            if (el.isSubClassOf('namedElement')) {
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
            if (el.isSubClassOf('package')) {
                this.options.push({
                    label: 'Create Class Diagram',
                    disabled: this.$umlWebClient.readonly,
                    onClick: async () => {
                        const diagramPackage = await this.$umlWebClient.post('package');
                        el.packagedElements.add(diagramPackage);
                        diagramPackage.name = el.name;
                        const diagramStereotypeInstance = await this.$umlWebClient.post('instanceSpecification');
                        diagramStereotypeInstance.classifiers.add(await this.$umlWebClient.get('Diagram_nuc1IC2Cavgoa4zMBlVq'));
                        // TODO slots
                        diagramPackage.appliedStereotypes.add(diagramStereotypeInstance);
                        this.$umlWebClient.put(el);
                        this.$umlWebClient.put(diagramPackage);
                        this.$umlWebClient.put(diagramStereotypeInstance);
                        await this.$umlWebClient.get(diagramPackage.id);
                        this.expanded = true;
                        this.children.push(diagramPackage.id);
                        this.$emit('diagram', diagramPackage);
                    }
                })
            }

            const createAndAddToSet = async (type, set) => {
                const createdEl= await this.$umlWebClient.post(type);
                el.sets[set].add(createdEl);
                this.$umlWebClient.put(createdEl);
                this.$umlWebClient.put(el);
                el = await this.$umlWebClient.get(el.id);
                this.children.push(createdEl.id);
                this.expanded = true;
                this.$emit('elementUpdate', createElementUpdate(el));
            }; 

            // create elements
            const createOption = {
                label: 'Create Element',
                children: []
            };
            if (el.isSubClassOf('classifier')) {
                for (let generalizationID of el.generalizations.ids()) {
                    this.children.push(generalizationID);
                }
                if (el.isSubClassOf('class') || el.isSubClassOf('dataType')) {
                    for (let attributeID of el.ownedAttributes.ids()) {
                        this.children.push(attributeID);
                    }
                }
                createOption.children.push({
                    label: 'Create Property',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('property', 'ownedAttributes')
                    }
                });
            }
            if (el.isSubClassOf('association')) {
                for (let propertyID of el.ownedEnds.ids()) {
                    this.children.push(propertyID);
                }
            }
            if (el.isSubClassOf('enumeration')) {
                for (const literalID of el.ownedLiterals.ids()) {
                    this.children.push(literalID);
                }
                createOption.children.push({
                    label: 'Create Enumeration Literal',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('enumerationLiteral', 'ownedLiterals')
                    }
                });
            }
            if (el.isSubClassOf('instanceSpecification')) {
                for (let slotID of el.slots.ids()) {
                    this.children.push(slotID);
                }
                createOption.children.push({
                    label: 'Create Slot',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('slot', 'slots')
                    }
                });
            }
            if (el.isSubClassOf('package')) {
                for (let packagedElID of el.packagedElements.ids()) {
                    this.children.push(packagedElID);
                }
                createOption.children.push({
                    label: 'Create Package',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('package', 'packagedElements')
                    }
                });
                createOption.children.push({
                    label: 'Create Class',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('class', 'packagedElements')
                    }
                });
                createOption.children.push({
                    label: 'Create Data Type',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('dataType', 'packagedElements')
                    }
                }); 
                createOption.children.push({
                    label: 'Create Enumeration',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('enumeration', 'packagedElements')
                    }
                }); 
                createOption.children.push({
                    label: 'Create Primitive Type',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('primitiveType', 'packagedElements')
                    }
                }); 
                createOption.children.push({
                    label: 'Create Association',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('association', 'packagedElements');
                    }
                });
                createOption.children.push({
                    label: 'Create Instance Specification',
                    disabled: this.$umlWebClient.readonly,
                    onClick: () => {
                        createAndAddToSet('instanceSpecification', 'packagedElements')
                    }
                });
            }

            this.options.push(createOption);

            this.options.push({
                label: 'Delete',
                disabled: this.$umlWebClient.readonly,
                onClick: async () => {
                    const owner = await el.owner.get();
                    this.$emit('elementUpdate', deleteElementElementUpdate(el));
                    await this.$umlWebClient.deleteElement(el);
                    this.$umlWebClient.put(owner);
                    this.$emit('elementUpdate', createElementUpdate(owner));
                }
            });

            this.name = el.name; // this will have to change eventually
            this.isFetching = false;
        },
        childrenToggle() {
            if (this.diagram) {
                return;
            }
            this.expanded = !this.expanded;
        },
        async stopRename() {
            this.editing = false;
            this.name = this.$refs.nameDiv.innerText || this.$refs.nameDiv.textContent;
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
        handleElementUpdate(newElementUpdate) {
            for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                // const oldElement = newElementUpdate.oldElement;
                if (!newElement) {
                    // TODO delete
                    // check if the deleted element is in our children
                    // might not be worth it
                    // pros: client will be able to update with out getting this element
                    // cons: will always run a loop through all of our children when an element is updated (laggy)
                } else if (newElement.id === this.umlID) {
                    //name
                    if (newElement.isSubClassOf('namedElement')) {
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
                } 
            }
             
        },
        propogateElementUpdate(newElementUpdate) {
            this.handleElementUpdate(newElementUpdate);
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
        propogateDraginfo(draginfo) {
            this.$emit('draginfo', draginfo);
        }
    }
}
</script>
<template>
    <div class="containmentTreeBlock" v-if="!isFetching" :class="{notFirstBlock: depth !== 0}">
        <div class="containmentTreePanel" 
             :class="{notEditable: !editing}" 
             @click="childrenToggle" 
             @dblclick="specification"
             @contextmenu="onContextMenu($event)" >
            <div :style="indent"></div>
            <div style="display:inline-flex;" 
                 draggable="true" 
                 >
                <img v-bind:src="image" draggable="false"/>
                <div style="display:inline-flex;white-space:nowrap;" 
                     ref="nameDiv" :contenteditable="editing" 
                     @keydown.enter.prevent="stopRename"
                     @keydown.escape="cancelRename">
                    {{ umlName }}
                </div>
                    <!-- TODO we need some sort of handling for a click-outside of this div directive to cancel rename TODO -->
            </div>
        </div>
        <div v-if="expanded && !isFetching">
            <ContainmentTreePanel v-for="child in children" 
                    :umlID="child" 
                    :depth="depth + 1" 
                    :key="child" 
                    @specification="propogateSpecification" 
                    @element-update="propogateElementUpdate"
                    @diagram="propogateDiagram"
                    @draginfo="propogateDraginfo"></ContainmentTreePanel>
        </div>
    </div>
</template>
<style>
.containmentTreeBlock {
    min-width: 300px;
    display: inline-block;
}
.notFirstBlock {
    width:100%;
}
.containmentTreePanel {
    vertical-align: middle;
    min-width: 300px;
    display: inline-flex;
    width: 100%;
}
.containmentTreePanel:hover {
    background-color: var(--vt-c-dark-soft);
}
</style>
