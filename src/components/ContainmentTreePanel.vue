<script>
import packageImage from './icons/package.svg'
import classImage from './icons/class.svg'
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
    name: 'ContainmentTreePanel',
    props: [
        'client',
        'el',
        'depth'
    ],
    mounted() {
        this.populateDisplayInfo();
    },
    data() {
        return {
            children: [],
            expanded: false,
            image: packageImage,
            menu: false,
            options: []
        }
    },
    components: [
        "ContainmentTreePanel"
    ],
    directives: {
        clickOutside: clickOutsideDirective
    },
    computed: {
        indent() {
            return {
                width: 25 * this.depth + 'px'
            }
        }
    },
    methods: {
        async populateDisplayInfo() {
            switch (this.el.elementType()) {
                case 'class' : {
                    this.image = classImage;
                    break;
                }
                case 'package' : {
                    // TODO bug here when getting multiple children
                    // iterator fails for everything but last child
                    for await (let packagedEl of this.el.packagedElements) {
                        this.children.push(packagedEl);
                    }
                    break;
                }
                case 'primitiveType' : {
                    this.image = classImage;
                    break;
                }
            }
            this.options.push({
                name: 'rename',
                action: this.rename()
            });
        },
        childrenToggle() {
            this.expanded = !this.expanded;
        },
        menuToggle() {
            this.menu = !this.menu;
        },
        rename() {
            // TODO
        }
    }
}
</script>
<template>
    <div class="containmentTreeBlock">
        <div class="containmentTreePanel" @click="childrenToggle" @contextmenu.capture.prevent 
            @click.right="menuToggle">
            <div :style="indent"></div>
            <img v-bind:src="image"/>
            <div>{{ el.name }}</div>
        </div>
        <div v-if="expanded">
            <ContainmentTreePanel v-for="child in children" :client="client" :el="child" 
                :depth="depth + 1" :key="child.id"></ContainmentTreePanel>
        </div>
        <div class="containmentTreeMenu" v-if="menu" v-clickOutside="menuToggle">
            <div class="containmentTreeMenuOption" v-for="option in options" 
                :key="option.name" @click="option.action">
                {{ option.name }}
            </div>
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
.containmentTreeMenu {
    z-index: 1000;
    position: absolute;
    overflow: hidden;
    border: 1px solid #CCC;
    white-space: nowrap;
    font-family: system-ui;
    background: #FFF;
    color: #333;
    border-radius: 5px;
    padding: 0;
}
.containmentTreeMenuOption {
    padding: 8px 12px;
    cursor: pointer;
    list-style-type: none;
    transition: all .3s ease;
    user-select: none;
}
.containmentTreeMenuOption:hover {
    background-color: #DEF;
}
</style>