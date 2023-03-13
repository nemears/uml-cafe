<script>
import packageImage from './icons/package.svg';
import classImage from './icons/class.svg';
import UmlWebClient from 'uml-js/lib/umlClient';
import propertyImage from './icons/property.svg';

export default {
    name: "ContainmentTreePanel",
    props: [
        "umlID",
        "depth",
        'dataChange'
    ],
    emits: [
        'specification',
        'dataChange'
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
            editing: false
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
        dataChange(newDataChange, oldDataChange) {
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
            }
            // TODO
        }
    },
    methods: {
        async populateDisplayInfo() {
            const client = new UmlWebClient(this.$sessionName);
            let el = await client.get(this.umlID);
            this.options.push({ 
                        label: "Specification", 
                        onClick: async () => {
                            this.$emit('specification', await client.get(this.umlID));
                        }
                    });
            const renameOption = {
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
                }
            }
            switch (el.elementType()) {
                case "class": {
                    this.image = classImage;
                    renameOption.divided = true;
                    this.options.push(renameOption);
                    for (let attributeID of el.ownedAttributes.ids()) {
                        this.children.push(attributeID);
                    }
                    this.options.push({
                        label: 'Create Property',
                        onClick: async () => {
                            const newProperty = await client.post('property');
                            el.ownedAttributes.add(newProperty);
                            client.put(newProperty);
                            client.put(el);
                            el = await client.get(el.id);
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
                    break;
                }
                case "package": {
                    // TODO bug here when getting multiple children
                    // iterator fails for everything but last child
                    for (let packagedElID of el.packagedElements.ids()) {
                        this.children.push(packagedElID);
                    }
                    renameOption.divided = true;
                    this.options.push(renameOption);
                    this.options.push({
                        label: 'Create Package',
                        onClick: async () => {
                            const newPackage = await client.post('package');
                            el.packagedElements.add(newPackage);
                            client.put(el);
                            client.put(newPackage);
                            el = await client.get(el.id);
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
                            const newClass = await client.post('class');
                            el.packagedElements.add(newClass);
                            client.put(el);
                            client.put(newClass);
                            el = await client.get(el.id);
                            this.children.push(newClass.id);
                            this.expanded = true;
                            this.$emit('dataChange', {
                                id: el.id,
                                type: 'add',
                                set: 'packagedElements',
                                el: newClass.id
                            });
                        }
                    })
                    break;
                }
                case "primitiveType": {
                    this.image = classImage;
                    this.options.push(renameOption);
                    break;
                }
                case 'property': {
                    this.image = propertyImage;
                    this.options.push(renameOption);
                    break;
                }
            }

            this.options[this.options.length - 1].divided = true;

            this.options.push({
                label: 'Delete',
                onClick: () => {
                    client.deleteElement(el);
                    this.$emit('dataChange', {
                        id: this.umlID,
                        type: 'delete'
                    })
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
            const client = new UmlWebClient(this.$sessionName);
            const el = await client.get(this.umlID);
            el.name = this.name;
            client.put(el);
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
        async specification() {
            const client = new UmlWebClient(this.$sessionName);
            this.$emit('specification', await client.get(this.umlID));
        }
    }
}
</script>
<template>
    <div class="containmentTreeBlock" v-if="!isFetching">
        <div class="containmentTreePanel" @click="childrenToggle" @dblclick="specification"
            @contextmenu="onContextMenu($event)">
            <div :style="indent"></div>
            <img v-bind:src="image"/>
            <div ref="nameDiv" :contenteditable="editing" @keydown.enter.prevent="stopRename"
                @keydown.escape="cancelRename">{{ umlName }}</div>
                <!-- TODO we need some sort of handling for a click-outside of this div directive to cancel rename TODO -->
        </div>
        <div v-if="expanded && !isFetching">
            <ContainmentTreePanel v-for="child in children" :umlID="child" 
                :depth="depth + 1" :data-change="dataChange" :key="child" @specification="propogateSpecification" @data-change="propogateDataChange"></ContainmentTreePanel>
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
.containmentTreePanel:hover {
    background-color: var(--vt-c-dark-soft);
}
</style>