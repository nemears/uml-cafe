<script>
import packageImage from './icons/package.svg';
import classImage from './icons/class.svg';
import UmlWebClient from 'uml-js/lib/umlClient';
import propertyImage from './icons/property.svg';

export default {
    name: "ContainmentTreePanel",
    props: [
        "umlID",
        "depth"
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
    methods: {
        async populateDisplayInfo() {
            const client = new UmlWebClient(this.$sessionName);
            const el = await client.get(this.umlID);
            this.options.push({ 
                        label: "Specification", 
                        onClick: () => {
                            alert("TODO");
                        }
                    });
            const renameOption = {
                label: 'Rename',
                onClick: () => {
                    this.editing = true;
                    // select text for user
                    let sel = window.getSelection();
                    sel.removeAllRanges();
                    let range = document.createRange();
                    // TODO below doesn't work for editing text without clicking the
                    // element again. FIX PLZ
                    range.selectNodeContents(this.$refs.nameDiv);
                    sel.addRange(range);
                }
            }
            switch (el.elementType()) {
                case "class": {
                    this.image = classImage;
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
                            this.children.push(newProperty.id);
                            this.expanded = true;
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
                    this.options.push(renameOption);
                    this.options.push({
                        divided: true
                    })
                    this.options.push({
                        label: 'Create Package',
                        onClick: async () => {
                            const newPackage = await client.post('package');
                            el.packagedElements.add(newPackage);
                            client.put(el);
                            client.put(newPackage);
                            this.children.push(newPackage.id);
                            this.expanded = true;
                        }
                    });
                    this.options.push({
                        label: 'Create Class',
                        onClick: async () => {
                            const newClass = await client.post('class');
                            el.packagedElements.add(newClass);
                            client.put(el);
                            client.put(newClass);
                            this.children.push(newClass.id);
                            this.expanded = true;
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
            this.name = el.name;
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
        },
        cancelRename() {
            this.editing = false;
            this.$forceUpdate();
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
        }
    }
}
</script>
<template>
    <div class="containmentTreeBlock" v-if="!isFetching">
        <div class="containmentTreePanel" @click="childrenToggle" 
            @contextmenu="onContextMenu($event)">
            <div :style="indent"></div>
            <img v-bind:src="image"/>
            <div ref="nameDiv" :contenteditable="editing" @keydown.enter.prevent="stopRename"
                @keydown.escape="cancelRename">{{ umlName }}</div>
        </div>
        <div v-if="expanded && !isFetching">
            <ContainmentTreePanel v-for="child in children" :umlID="child" 
                :depth="depth + 1" :key="child"></ContainmentTreePanel>
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
    background-color: #d0dfff;
}
</style>