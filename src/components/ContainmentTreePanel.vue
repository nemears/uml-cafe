<script>
import packageImage from './icons/package.svg'
import classImage from './icons/class.svg'
import UmlWebClient from 'uml-js/lib/umlClient';

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
            options: []
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
                        },
                        divided: true
                    });
            switch (el.elementType()) {
                case "class": {
                    this.image = classImage;
                    break;
                }
                case "package": {
                    // TODO bug here when getting multiple children
                    // iterator fails for everything but last child
                    for (let packagedElID of el.packagedElements.ids()) {
                        this.children.push(packagedElID);
                    }
                    this.options.push({
                        label: 'Create Package',
                        onClick: async () => {
                            const newPackage = await client.post('package');
                            el.packagedElements.add(newPackage);
                            client.put(el);
                            client.put(newPackage);
                            // await client.get(newPackage.id);
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
                    break;
                }
            }
            this.name = el.name;
            this.isFetching = false;
        },
        childrenToggle() {
            this.expanded = !this.expanded;
        },
        rename() {},
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
            <div>{{ name }}</div>
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