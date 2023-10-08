<script>
import packageImage from './icons/package.svg';
import getImage from '../GetUmlImage.vue';
import classDiagramImage from './icons/class_diagram.svg';

export default {
    name: "ContainmentTreePanel",
    props: [
        "umlID",
        "depth",
        'dataChange'
    ],
    emits: [
        'specification',
        'dataChange',
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
        dataChange: {
            handler(newDataChange) {
                const handleNewData = async () => {
                    for (let data of newDataChange.data) {
                        if (data === undefined) {
                            return;
                        }
                        if (data.id === undefined) {
                            console.warn('data change made without id');
                            return;
                        }
                        if (data.id !== this.umlID) {
                            if (this.children.includes(data.id)) {
                                if (data.type === 'delete') {
                                    this.children = this.children.filter(child => child !== data.id);
                                } else if (data.type === 'remove') {
                                    const element = await this.$umlWebClient.get(this.umlID);
                                    if (!element.ownedElements.contains(data.id)) {
                                        this.children = this.children.filter(child => child !== data.id);
                                    }     
                                }                   
                            }
                            continue;
                        }
                        if (data.type === 'name') {
                            this.name = data.value;
                        } else if (data.type === 'add') {
                            if (this.children.includes(data.el)) {
                                continue;
                            }
                            this.children.push(data.el);
                        } else if (data.type === 'remove') {
                            if (this.children.includes(data.val)) {
                                this.children = this.children.filter(child => child !== data.val);
                            }
                        }
                    }
                };
            handleNewData();
            }
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
                this.$emit('dataChange', {
                    data: [
                        {
                            id: el.id,
                            type: 'add',
                            set: set,
                            el: createdEl.id
                        }
                    ]
                });
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
                    this.$umlWebClient.deleteElement(el);
                    this.$emit('dataChange', {
                        data: [
                            {
                                id: this.umlID,
                                type: 'delete'
                            }
                        ]
                    });
                    this.$umlWebClient.put(owner);
                }
            })

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
            this.$emit('dataChange', {
                data: [
                    {
                        id: this.umlID,
                        type: 'name',
                        value: this.name
                    }
                ]
            });
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
        propogateDataChange(dataChange) {
            for (let data of dataChange.data) {
                if (data.type === 'delete') {
                    let childToDeleteIndex = 0;
                    for (let child of this.children) {
                        if (child === data.id) {
                            break;
                        }
                        childToDeleteIndex++;
                    }
                    if (childToDeleteIndex < this.children.length) {
                        this.children.splice(childToDeleteIndex, 1);
                    }
                } else if (data.type === 'add' && data.id === this.umlID) {
                    this.children.push(data.element);
                }
            }
            this.$emit('dataChange', dataChange);
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
        startDrag(event, item) {
            event.dataTransfer.setData('umlID', this.umlID);
            event.dataTransfer.dropEffect = 'copy';
            event.dataTransfer.effectAllowed = 'all';
            console.log('dragging');
            this.$emit('draginfo', {
                id: this.umlID,
                elementType: this.elementType,
            });
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
                 @dragstart="startDrag($event, item)">
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
                    :data-change="dataChange" 
                    :key="child" 
                    @specification="propogateSpecification" 
                    @data-change="propogateDataChange" 
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
