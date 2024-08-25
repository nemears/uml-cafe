<script>
    import { assignTabLabel, getPanelClass, mapColor } from '../../umlUtil';
    import getUmlImage from '../../GetUmlImage.vue';
    import { nullID } from 'uml-client/lib/types/element';
    export default {
        props: ['umlid', 'theme', 'selectedElements'],
        emits: ['specification', 'select', 'deselect', 'menu'],
        inject: ['userSelected', 'userDeselected', 'elementUpdate'],
        data() {
            return {
                img: undefined,
                label: '',
                hover: false,
                selected: false,
                currentUsers: [],
                dummy: false,
                hidden: false
            }
        },
        async mounted() {
            await this. setData(this.umlid);
        },
        watch: {
            async umlid(newID) {
                await this.setData(newID);
            },
            selectedElements(newSelectedElements) {
                if (this.selected) {
                    if (!newSelectedElements.includes(this.umlid)) {
                        this.selected = false;
                    }
                } else {
                    if (newSelectedElements.includes(this.umlid)) {
                        this.selected = true;
                    }
                }
            },
            userSelected(newUserSelected) {
                let reRender = false;
                if (this.umlid === newUserSelected.id) {
                    this.currentUsers.push(mapColor(newUserSelected.color));
                    reRender = true;
                }
                if (reRender) {
                    this.dummy = !this.dummy; 
                }
            },
            userDeselected(newUserDeselcted) {
                let reRender = false;
                for (const deselectedEl of newUserDeselcted.elements) {
                    if (this.umlid === deselectedEl && this.currentUsers.includes(mapColor(newUserDeselcted.color))) {
                        this.currentUsers.splice(this.currentUsers.indexOf(mapColor(newUserDeselcted.color)), 1);
                        reRender = true;
                        break;
                    }
                }
                if (reRender) {
                    this.dummy = !this.dummy;
                }
            },
            async elementUpdate(newElementUpdate) {
                for (const updatedElement of newElementUpdate.updatedElements) {
                    const newElement = updatedElement.newElement;
                    if (newElement.id === this.umlid) {
                        this.label = await assignTabLabel(newElement);
                    }
                }
            }
        },
        computed: {
            panelClass() {
                const ret = getPanelClass(this.selected, this.hover, this.currentUsers, this.$umlWebClient, this.theme).replace('elementExplorerPanel', 'setElement');
                return ret;
            }
        },
        methods: {
            async setData(id) {
                if (id && id !== nullID()) {
                    const el = await this.$umlWebClient.get(this.umlid);
                    for await (const appliedStereotype of el.appliedStereotypes) {
                        for (const classifierID of appliedStereotype.classifiers.ids()) {
                            if (classifierID === 'O6KKRb5g0f2Aidq2B8j8RZqkDWzy') { // hidden package
                                this.hidden = true;
                            }
                        }
                    }
                    this.img = getUmlImage(el);
                    this.label = await assignTabLabel(el);
                } else {
                    this.img = undefined;
                    this.label = '';
                } 
            },
            async specification() {
                if (this.umlid && !this.umlid !== nullID()) {
                    this.$emit('specification', await this.$umlWebClient.get(this.umlid));
                }
            },
            select(modifier) {
                if (this.umlid && this.umlid === nullID()) {
                    return;
                }
                this.selected = !this.selected;
                if (this.selected) {
                    this.$emit('select', {
                        el: this.umlid,
                        modifier: modifier,
                    });
                } else {
                    this.$emit('deselect', {
                        el: this.umlid,
                        modifier: modifier,
                    });
                }
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
            async menu(evt) {
                evt.preventDefault();
                let el = undefined;
                if (this.umlid && this.umlid !== nullID()) {
                    el = await this.$umlWebClient.get(this.umlid);
                }
                this.$emit('menu', {
                    evt: evt,
                    el: el
                });
            }
        }
    }
</script>
<template>
    <div    v-if="!hidden"
            class="setElement" 
            :class="panelClass"
            @click.exact="select('none')"
            @click.ctrl="select('ctrl')"
            @click.shift="select('shift')"
            @dblclick="specification"
            @mouseenter="mouseEnter"
            @mouseleave="mouseLeave"
            @contextmenu="menu">
        <img v-if="img !== undefined" :src="img"/>
        <div>
            {{ label }}
        </div>
        <slot>
        </slot>
    </div>
</template>
<style>
.setElement, .selectedSetElement{
    width: 700px;
    min-height: 30px;
    display: flex;
    padding-left: 5px;
}
.setElementDark {
    background-color: var(--open-uml-selection-dark-1);
}
.setElementDarkHover {
    background-color: var(--open-uml-selection-dark-2);
}
.setElementLight {
    background-color: var(--uml-cafe-selection-light-1);
    color: var(--vt-c-dark-dark);
}
.setElementLightHover {
    background-color: var(--uml-cafe-selection-light-2);
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
</style>
