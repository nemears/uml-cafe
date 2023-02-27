<script setup>
import UmlContextMenu from "./UmlContextMenu.vue";
</script>

<script>
import packageImage from './icons/package.svg'
import classImage from './icons/class.svg'
import UmlWebClient from 'uml-js/lib/umlClient';
const clickOutsideDirective = {
    beforeMount: (el, binding) => {
        el.clickOutsideEvent = event => {
            if (!(el == event.target || el.contains(event.target))) {
                binding.value();
            }
        };
        document.addEventListener("click", el.clickOutsideEvent);
    },
    unmounted: el => {
        document.removeEventListener("click", el.clickOutsideEvent);
    },
};
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
            menu: {
                left: 0,
                top: 0,
                show: false
            }
        };
    },
    components: [
        "ContainmentTreePanel", UmlContextMenu
    ],
    directives: {
        clickOutside: clickOutsideDirective
    },
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
                    break;
                }
                case "primitiveType": {
                    this.image = classImage;
                    break;
                }
            }
            this.name = el.name;
            this.options.push({
                name: "rename",
                action: this.rename()
            });
            this.isFetching = false;
        },
        childrenToggle() {
            this.expanded = !this.expanded;
        },
        openContainmentTreeMenu(evt) {
            this.menu.left = evt.pageX || evt.clickX;
            this.menu.top = evt.pageY || evt.clickY;
            this.menu.show = true;
        },
        closeContainmentTree() {
            this.menu.left = 0;
            this.menu.top = 0;
            this.menu.show = false;
        },
        rename() {}
    }
}
</script>
<template>
    <div class="containmentTreeBlock" v-if="!isFetching">
        <div class="containmentTreePanel" @click="childrenToggle" @contextmenu.capture.prevent 
            @click.right="openContainmentTreeMenu">
            <div :style="indent"></div>
            <img v-bind:src="image"/>
            <div>{{ name }}</div>
        </div>
        <div v-if="expanded && !isFetching">
            <ContainmentTreePanel v-for="child in children" :umlID="child" 
                :depth="depth + 1" :key="child"></ContainmentTreePanel>
        </div>
        <UmlContextMenu v-if="menu.show" :menu="menu" v-clickOutside="closeContainmentTree">
            PeePee
            PooPoo
        </UmlContextMenu>
        <!-- <div class="containmentTreeMenu" v-if="menu" v-clickOutside="menuToggle">
            <div class="containmentTreeMenuOption" v-for="option in options" 
                :key="option.name" @click="option.action">
                {{ option.name }}
            </div>
        </div> -->
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