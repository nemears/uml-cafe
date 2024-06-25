<script>
import getImage from '../../GetUmlImage.vue';
import CreationPopUp from './CreationPopUp.vue';
import { createElementUpdate, mapColor, mapClientColor, getPanelClass } from '../../umlUtil.js';
export default {
    props: [
        'label', 
        'umlID', 
        'initialData', 
        'readonly', 
        'createable', 
        'singletonData',
        'selectedElements',
        'theme',
    ],
    emits: [
        'specification',
        'elementUpdate',
        'select',
        'deselect',    
    ],
    inject: [
        'elementUpdate', 
        'draginfo',
        'userSelected',
        'userDeselected'
    ],
    data() {
        return {
            img: undefined,
            valID: undefined,
            valLabel: '',
            drag: false,
            badDrag: false,
            creationPopUp: false,
            dragCounter: 0,
            recentDragInfo: undefined,
            selected: false,
            hover: false,
            currentUsers: [],
        }
    },
    computed: {
        panelClass() {
            let computedPanelClass = getPanelClass(this.selected, this.hover, this.currentUsers, this.$umlWebClient, this.theme); 
            computedPanelClass = computedPanelClass.replace('elementExplorerPanel', 'singletonElement');
            let ret = {
                singletonBadDrag : this.drag && this.badDrag,
                singletonGoodDrag : this.drag,
            };
            ret[computedPanelClass] = true;
            return ret;
        },
    },
    mounted() {
        if (this.initialData !== undefined) {
            this.setData(this.initialData);
        }
    },
    watch: {
        initialData(newInitialData) {
            if (newInitialData !== undefined) {
                this.setData(newInitialData);
            }
        },
        elementUpdate(newElementUpdate) {
            const me = this;
            for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                if (newElement) {
                    if (newElement.id === this.umlID) {
                        const asyncSetData = async () => {
                            const el = await newElement.sets[me.singletonData.setName].get();
                            const currentUsers = this.getCurrentUsers(el);
                            me.setData({
                                img: getImage(el),
                                id: el.id,
                                label: el.name !== undefined ? el.name : '',
                                currentUsers: currentUsers,
                            });
                        };
                        if (this.valID) {
                            if (newElement.sets[this.singletonData.setName].id() !== this.valID) {
                                if (!newElement.sets[this.singletonData.setName].has()) {
                                    this.setData({
                                        id: undefined,
                                        img: undefined,
                                        label: undefined,
                                    });
                                } else {
                                    asyncSetData();
                                }
                            }
                        } else {
                            if (newElement.sets[this.singletonData.setName].has()) {
                                asyncSetData();
                            }
                        }
                    }
                    if (newElement.id === this.valID) {
                        if (newElement.isSubClassOf('namedElement')) {
                            if (newElement.name !== this.valLabel) {
                                this.valLabel = newElement.name;
                            }
                        }
                    }
                } 
            }
        },
        draginfo(newDragInfo) {
            this.recentDragInfo = newDragInfo;
        },
        selectedElements(newSelectedElements) {
            if (this.valID) {
                if (this.selected) {
                    if (!newSelectedElements.includes(this.valID)) {
                        this.selected = false;
                    }
                } else {
                    if (newSelectedElements.includes(this.valID)) {
                        this.selected = true;
                    }
                }
            }
        },
        userSelected(newUserSelected) {
            if (this.valID) {
                if (newUserSelected.id === this.valID) {
                    this.currentUsers.push(mapColor(newUserSelected.color))
                }
            }
        },
        userDeselected(newUserDeselcted) {
            if (this.valID) {
                for (const element of newUserDeselcted.elements) {
                    if (element === this.valID && this.currentUsers.includes(mapColor(newUserDeselcted.color))) {
                        this.currentUsers.splice(this.currentUsers.indexOf(mapColor(newUserDeselcted.color)), 1);
                    }
                }
            }
        }
    },
    methods: {
        setData(data) {
            this.img = data.img;
            this.valID = data.id;
            this.valLabel = data.label;

            // TODO some better handling for this, so that it is always lit up, rn has some weird states
            if (this.valID && !this.currentUsers) {
                this.currentUsers = this.getCurrentUsers({id:this.valID});
            } else {
                this.currentUsers = data.currentUsers;
            }
        },
        getCurrentUsers(el) {
            return Array.from(this.$umlWebClient.otherClients.values())
                .filter((other_client) => other_client.selectedElements.has(el.id))
                .map(other_client => mapClientColor(other_client.color));
        },
        async specification() {
            if (this.valID === undefined) {
                return;
            }
            this.$emit('specification', await this.$umlWebClient.get(this.valID));
        },
        dragenter() {
            this.dragCounter++;
            this.drag = true;
            this.badDrag = this.singletonData.readonly || this.$umlWebClient.readonly;
            if (!this.badDrag) {
                if (this.recentDragInfo.selectedElements.length !== 1) {
                    this.badDrag = true;
                }
                const el = this.recentDragInfo.selectedElements[0];
                if (!el.isSubClassOf(this.singletonData.type)) {
                    this.badDrag = true;
                }
            }
        },
        dragleave() {
            this.dragCounter--;
            if (this.dragCounter === 0) {
                this.drag = false;
                this.badDrag = false;
            }
        },
        async drop() {
            this.drag = false;
            if (this.badDrag) {
                return;
            }    
            const me = await this.$umlWebClient.get(this.umlID);
            const el = this.recentDragInfo.selectedElements[0];
            const owners = [];
            const oldOwner = await el.owner.get();
            if (oldOwner) {
                owners.push(oldOwner);
            }
            const myOldOwner = await me.owner.get();
            if (myOldOwner) {
                owners.push(myOldOwner);
            }
            me[this.singletonData.setName].set(el);
            this.$umlWebClient.put(me);
            this.$umlWebClient.put(el);
            this.$emit('elementUpdate', createElementUpdate(me, el, ...owners));
            this.setData({
                img: getImage(el),
                id: el.id,
                label: el.name !== undefined ? el.name : '' ,
                currentUsers: [] // does this need to be calculated
            });
            this.selected = true;
        },
        createElement() {
            this.creationPopUp = true;
        },
        closePopUp(el) {
            this.creationPopUp = false;
            if (el === undefined) {
                return;
            }
            this.setData({
                img: getImage(el),
                id: el.id,
                label: el.name !== undefined ? el.name : '',
                currentUsers: this.getCurrentUsers(el),
            });
        },
        onContextMenu(evt) {
            //prevent the browser's default menu
            evt.preventDefault();

            // determine items
            let items = [];
            if (!this.valID) {
                if (this.createable) {
                    items.push({
                        label: 'Create Element',
                        onClick: () => {
                           this.createElement(); 
                        }
                    });
                }
            } else {
                items.push({
                    label: 'Specification',
                    onClick: async () => {
                        this.$emit('specification', await this.$umlWebClient.get(this.valID));
                    }
                });
                items.push({
                    label: 'Remove',
                    onClick: async () => {
                        const el = await this.$umlWebClient.get(this.umlID);
                        el.sets[this.singletonData.setName].set(undefined);
                        this.$umlWebClient.put(el);
                        this.$umlWebClient.put(await this.$umlWebClient.get(this.valID));
                        this.$emit('elementUpdate', createElementUpdate(el));
                        this.valID = undefined;
                        this.img = undefined;
                        this.valLabel = '';
 
                    }
                });
                items.push({
                    label: 'Delete',
                    onClick: async () => {
                        const el = await this.$umlWebClient.get(this.valID);
                        const owner = await el.owner.get();
                        this.$umlWebClient.deleteElement(el);
                        this.$emit('elementUpdate', createElementUpdate(owner));
                        this.$umlWebClient.put(owner);
                        this.valID = undefined;
                        this.img = undefined;
                        this.valLabel = '';
                    } 
                });
            }

            //show our menu
            this.$contextmenu({
                x: evt.x,
                y: evt.y,
                items: items
            });
        },
        select(modifier) {
            if (this.valID) {
                this.selected = !this.selected;
                if (this.selected) {
                    this.$emit('select', {
                        el: this.valID,
                        modifier: modifier,
                    });
                } else {
                    this.$emit('deselect', {
                        el: this.valID,
                        modifier: modifier,
                    });
                }
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
        }
    },
    components: { CreationPopUp }
}
</script>
<template>
    <div class="singletonDiv">
        <div class="singletonLabel">
            {{ label }}
        </div>
        <div class="singletonElement" 
            :class="panelClass"
            @click.exact="select('none')"
            @click.ctrl="select('ctrl')"
            @click.shift="select('shift')"
            @dblclick="specification"
            @dragenter="dragenter"
            @dragleave="dragleave"
            @drop="drop"
            @dragover.prevent
            @mouseenter="mouseEnter"
            @mouseleave="mouseLeave"
            @contextmenu="onContextMenu($event)">
            <img v-bind:src="img" v-if="img !== undefined" />
            <div>
                {{ valLabel }}
            </div>
            <div class="createButton" v-if="createable" @click="createElement">
                +
            </div>
            <CreationPopUp  v-if="creationPopUp && !$umlWebClient.readonly" 
                            :types="createable.types" 
                            :set="singletonData.setName" 
                            :umlid="umlID"
                            :theme="theme"
                            @closePopUp="closePopUp"></CreationPopUp>
        </div>
    </div>
</template>
<style>
.singletonDiv {
    display: flex;
    padding-bottom: 10px;
}
.singletonLabel {
    min-width: 200px;
}
.singletonElement {
    width: 700px;
    min-height: 30px;
    display: flex;
    padding-left: 5px;
}
.singletonElementDark {
    background-color: var(--open-uml-selection-dark-1);
}
.singletonElementDarkHover {
    background-color: var(--open-uml-selection-dark-2);
}
.singletonElementLight {
    background-color: var(--uml-cafe-selection-light-1);
    color: var(--vt-c-dark-dark);
}
.singletonElementLightHover {
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
.singletonBadDrag {
    border: 1px solid;
    border-color: var(--uml-cafe-selected-error);
}
.singletonGoodDrag {
    border: 1px solid;
    border-color: var(--uml-cafe-selected-hover);
}
.createButton {
    margin-left: auto;
    text-align: center;
    border: 1px solid;
    min-width: 25px;
    border-color: var(--vt-c-black-soft);
    background-color: var(--vt-c-white-soft);
    color: var(--vt-c-black-soft);
    -webkit-user-select: none; /* Safari */        
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
}
.createButton:hover {
    background-color: var(--vt-c-off-white);
}
</style>
