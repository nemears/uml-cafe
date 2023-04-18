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
        'diagram'
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
            diagram: false
        };
    },
    components: [
        "ContainmentTreePanel"
    ],
    computed: {
        indent() {
            return {
                width: 25 * this.depth + "px"
            };
        },
        umlName() {
            return this.name;
        }
    },
    watch: {
        async dataChange(newDataChange, oldDataChange) {
            const handleNewData = async () => {
                if (newDataChange === undefined) {
                    return;
                }
                if (newDataChange.id === undefined) {
                    console.warn('data change made without id');
                    return;
                }
                if (newDataChange.id !== this.umlID) {
                    // TODO may have to do something here
                    return;
                }
                if (newDataChange.type === 'name') {
                    this.name = newDataChange.value;
                } else if (newDataChange.type === 'add') {
                    const me = await this.$umlWebClient.get(this.umlID);
                    if (this.children.includes(newDataChange.el)) {
                        return;
                    }
                    this.children.push(newDataChange.el);
                }
            };
            handleNewData();
        }
    },
    methods: {
        async populateDisplayInfo() {
            let el = await this.$umlWebClient.get(this.umlID);
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

            this.options[this.options.length - 1].divided = true;

            // create elements
            if (el.isSubClassOf('class')) {
                for (let generalizationID of el.generalizations.ids()) {
                    this.children.push(generalizationID);
                }
                for (let attributeID of el.ownedAttributes.ids()) {
                    this.children.push(attributeID);
                }
                this.options.push({
                    label: 'Create Property',
                    onClick: async () => {
                        const newProperty = await this.$umlWebClient.post('property');
                        el.ownedAttributes.add(newProperty);
                        this.$umlWebClient.put(newProperty);
                        this.$umlWebClient.put(el);
                        el = await this.$umlWebClient.get(el.id);
                        this.children.push(newProperty.id);
                        this.expanded = true;
                        this.$emit('dataChange', {
                            id: el.id,
                            type: 'add',
                            set: 'ownedAttributes',
                            el: newProperty.id
                        });
                    }
                });
            }
            if (el.isSubClassOf('association')) {
                for (let propertyID of el.ownedEnds.ids()) {
                    this.children.push(propertyID);
                }
            }
            if (el.isSubClassOf('package')) {
                for (let packagedElID of el.packagedElements.ids()) {
                        this.children.push(packagedElID);
                    }
                    this.options.push({
                        label: 'Create Package',
                        onClick: async () => {
                            const newPackage = await this.$umlWebClient.post('package');
                            el.packagedElements.add(newPackage);
                            this.$umlWebClient.put(el);
                            this.$umlWebClient.put(newPackage);
                            el = await this.$umlWebClient.get(el.id);
                            this.children.push(newPackage.id);
                            this.expanded = true;
                            this.$emit('dataChange', {
                                id: el.id,
                                type: 'add',
                                set: 'packagedElements',
                                el: newPackage.id
                            });
                        }
                    });
                    this.options.push({
                        label: 'Create Class',
                        onClick: async () => {
                            const newClass = await this.$umlWebClient.post('class');
                            el.packagedElements.add(newClass);
                            this.$umlWebClient.put(el);
                            this.$umlWebClient.put(newClass);
                            el = await this.$umlWebClient.get(el.id);
                            this.children.push(newClass.id);
                            this.expanded = true;
                            this.$emit('dataChange', {
                                id: el.id,
                                type: 'add',
                                set: 'packagedElements',
                                el: newClass.id
                            });
                        }
                    });
            }

            this.options[this.options.length - 1].divided = true;

            this.options.push({
                label: 'Delete',
                onClick: async () => {
                    const owner = await el.owner.get();
                    this.$umlWebClient.deleteElement(el);
                    this.$emit('dataChange', {
                        id: this.umlID,
                        type: 'delete'
                    });
                }
            })

            this.name = el.name; // this will have to change eventually
            this.isFetching = false;
        },
        childrenToggle() {
            this.expanded = !this.expanded;
        },
        async stopRename() {
            this.editing = false;
            this.name = this.$refs.nameDiv.innerText || this.$refs.nameDiv.textContent;
            const el = await this.$umlWebClient.get(this.umlID);
            el.name = this.name;
            this.$umlWebClient.put(el);
            this.$emit('dataChange', {
                id: this.umlID,
                type: 'name',
                value: this.name
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
            if (dataChange.type === 'delete') {
                let childToDeleteIndex = 0;
                for (let child of this.children) {
                    if (child === dataChange.id) {
                        break;
                    }
                    childToDeleteIndex++;
                }
                if (childToDeleteIndex < this.children.length) {
                    this.children.splice(childToDeleteIndex, 1);
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
        }
    }
}
</script>
<template>
    <div class="containmentTreeBlock" v-if="!isFetching">
        <div class="containmentTreePanel" :class="{notEditable: !editing}" 
            @click="childrenToggle" 
            @dblclick="specification"
            @contextmenu="onContextMenu($event)" >
            <div :style="indent"></div>
            <div draggable="true" style="display:flex" @dragstart="startDrag($event, item)">
                <img v-bind:src="image" draggable="false"/>
                <div ref="nameDiv" :contenteditable="editing" @keydown.enter.prevent="stopRename"
                    @keydown.escape="cancelRename">{{ umlName }}</div>
                    <!-- TODO we need some sort of handling for a click-outside of this div directive to cancel rename TODO -->
            </div>
        </div>
        <div v-if="expanded && !isFetching">
            <ContainmentTreePanel v-for="child in children" :umlID="child" 
                :depth="depth + 1" :data-change="dataChange" :key="child" @specification="propogateSpecification" 
                @data-change="propogateDataChange" @diagram="propogateDiagram"></ContainmentTreePanel>
        </div>
    </div>
</template>
<style>
.containmentTreeBlock {
    display: block;
}
.containmentTreePanel {
    vertical-align: middle;
    display: flex;
}
.notEditable {
    -webkit-user-select: none; /* Safari */        
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
}
.containmentTreePanel:hover {
    background-color: var(--vt-c-dark-soft);
}
</style>