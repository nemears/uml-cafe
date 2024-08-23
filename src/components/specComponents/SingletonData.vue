<script>
import DragArea from './DragArea.vue';
import ElementPanel from './ElementPanel.vue';
import CreationPopUp from './CreationPopUp.vue';
import { createElementUpdate } from '../../umlUtil.js';
import { nullID } from 'uml-client/lib/types/element';
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
        'userSelected',
        'userDeselected'
    ],
    data() {
        return {
            valID: undefined,
            creationPopUp: false,
        }
    },
    mounted() {
        this.valID = this.initialData;
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
                        if (this.valID) {
                            const newID = newElement.sets.get(this.singletonData.setName).id();
                            if (newID !== this.valID) {
                                if (!newElement.sets.get(this.singletonData.setName).has()) {
                                    this.valID = nullID();
                                } else {
                                    this.valID = newID;
                                }
                            }
                        } else {
                            if (newElement.sets.get(this.singletonData.setName).has()) {
                                this.valID = newElement.sets.get(me.singletonData.setName).id();
                            }
                        }
                    }
                } 
            }
        }
    },
    methods: {
        async drop(recentDragInfo) {
            const me = await this.$umlWebClient.get(this.umlID);
            const el = recentDragInfo.selectedElements[0];
            const owners = [];
            const oldOwner = await el.owner.get();
            if (oldOwner) {
                owners.push(oldOwner);
            }
            const myOldOwner = await me.owner.get();
            if (myOldOwner) {
                owners.push(myOldOwner);
            }
            await me[this.singletonData.setName].set(el);
            this.$umlWebClient.put(me);
            this.$umlWebClient.put(el);
            this.$emit('elementUpdate', createElementUpdate(me, el, ...owners));
            this.valID = el.id;
        },
        createElement() {
            this.creationPopUp = true;
        },
        closePopUp(el) {
            this.creationPopUp = false;
            if (el === undefined) {
                return;
            }
            this.valID = el.id;
        },
        onContextMenu(data) {
            const evt = data.evt;
            const val = data.el;

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
                        this.$emit('specification', val);
                    }
                });
                items.push({
                    label: 'Remove',
                    onClick: async () => {
                        const el = await this.$umlWebClient.get(this.umlID);
                        el.sets.get(this.singletonData.setName).set(undefined);
                        this.$umlWebClient.put(el);
                        this.$umlWebClient.put(val);
                        this.$emit('elementUpdate', createElementUpdate(el));
                        this.valID = nullID();
                    }
                });
                items.push({
                    label: 'Delete',
                    onClick: async () => {
                        const el = val;
                        const owner = await el.owner.get();
                        this.$umlWebClient.deleteElement(el);
                        this.$emit('elementUpdate', createElementUpdate(owner));
                        this.$umlWebClient.put(owner);
                        this.valID = nullID();
                    } 
                });
            }

            //show our menu
            this.$contextmenu({
                x: evt.x,
                y: evt.y,
                items: items,
                theme: 'flat'
            });
        },
        propogateSpecification(el) {
            this.$emit('specification', el);
        },
        propogateSelect(data) {
            this.$emit('select', data);
        },
        propogateDeselect(data) {
            this.$emit('deselect', data);
        }
    },
    components: { CreationPopUp, DragArea, ElementPanel }
}
</script>
<template>
    <div class="singletonDiv">
        <div class="singletonLabel">
            {{ label }}
        </div>
        <DragArea :readonly="singletonData.readonly" :type="singletonData.type" :size="1" @drop="drop">
            <ElementPanel :umlid="valID"
                          :theme="theme"
                          :selected-elements="selectedElements"
                          @select="propogateSelect"
                          @deselect="propogateDeselect"
                          @specification="propogateSpecification"
                          @menu="onContextMenu">
                <div class="createButton" v-if="createable" @click="createElement">
                    +
                </div>
                <CreationPopUp  v-if="creationPopUp && !$umlWebClient.readonly" 
                                :types="createable.types" 
                                :set="singletonData.setName" 
                                :umlid="umlID"
                                :theme="theme"
                                @closePopUp="closePopUp"></CreationPopUp>
            </ElementPanel>
        </DragArea>
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
