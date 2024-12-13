<script>
import DragArea from './DragArea.vue';
import ElementPanel from './ElementPanel.vue';
import CreationPopUp from './CreationPopUp.vue';
import { createElementUpdate, getElementAndChildrenString } from '../../umlUtil.js';
import { nullID } from 'uml-client/lib/types/element';
export default {
    props: [
        'umlID', 
        'initialData', 
        'singletonData',
        'selectedElements',
        'theme',
        'manager',
    ],
    emits: [
        'focus',
        'elementUpdate',
        'select',
        'deselect',
        'command'
    ],
    inject: [
        'elementUpdate', 
        'userSelected',
        'userDeselected',
        'latestCommand',
        'commandUndo'
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
            for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                if (newElement) {
                    const newElementSingleton = newElement.typeInfo.getSet(this.singletonData.id);
                    if (newElement.id === this.umlID) {
                        if (this.valID) {
                            const newID = newElementSingleton.id();
                            if (newID !== this.valID) {
                                if (!newElementSingleton.has()) {
                                    this.valID = nullID();
                                } else {
                                    this.valID = newID;
                                }
                            }
                        } else {
                            if (newElementSingleton.has()) {
                                this.valID = newElementSingleton.id();
                            }
                        }
                    }
                } 
            }
        },
        async latestCommand(newCommand) {
            if (newCommand && newCommand.redo && newCommand.element === this.umlID && newCommand.context.set === this.singletonData.id) {
                if (newCommand.name === 'specificationPageDelete') {
                    await this.deleteElement(await this.$umlWebClient.get(newCommand.context.elementDirectlyDeleted));
                } else if (newCommand.name === 'singletonSpecPageRemove') {
                    await this.removeElement(await this.$umlWebClient.get(newCommand.context.elementRemoved));
                } else if (newCommand.name === 'singletonElementCreation') {
                    const ourElement = await this.$umlWebClient.get(this.umlID);
                    const newElement = this.$umlWebClient.post(newCommand.context.elementType, { id: newCommand.context.elementID });
                    ourElement.typeInfo.getSet(this.singletonData.id).set(newElement);
                } else if (newCommand.name === 'singletonDropElement') {
                    await this.drop(newCommand.context.dragInfo);
                }
            }
        },
        async commandUndo(undoneCommand) {
            if (undoneCommand.element === this.umlID && undoneCommand.context.set === this.singletonData.id) {
                if (undoneCommand.name === 'specificationPageDelete') {
                    for (const data of undoneCommand.context.elementsData) {
                        const el = await this.$umlWebClient.parse(data);
                        this.$umlWebClient.put(el);
                    }
                    const element = await this.$umlWebClient.get(undoneCommand.context.elementDirectlyDeleted);
                    this.valID = element.id;
                    const ourElement = await this.$umlWebClient.get(this.umlID);
                    this.$emit('elementUpdate', createElementUpdate(element, ourElement));
                    this.$umlWebClient.put(ourElement);            
                } else if (undoneCommand.name === 'singletonSpecPageRemove') {
                    // add el back
                    const ourElement = await this.$umlWebClient.get(this.umlID);
                    const val = await this.$umlWebClient.get(undoneCommand.context.elementRemoved);
                    await ourElement.typeInfo.getSet(this.singletonData.id).set(val);
                    this.$emit('elementUpdate', createElementUpdate(ourElement, val));
                    this.$umlWebClient.put(ourElement);
                    this.$umlWebClient.put(val);
                } else if (undoneCommand.name === 'singletonElementCreation') {
                    // delete the element removed
                    const ourElement = await this.$umlWebClient.get(this.umlID);
                    const val = await this.$umlWebClient.get(undoneCommand.context.elementID);
                    await ourElement.typeInfo.getSet(this.singletonData.id).set(undefined);
                    this.$umlWebClient.delete(val);
                    this.$emit('elementUpdate', createElementUpdate(ourElement));
                } else if (undoneCommand.name === 'singletonDropElement') {
                    const me = await this.$umlWebClient.get(this.umlID);
                    const val = await this.$umlWebClient.get(this.valID);
                    let oldVal = undefined;
                    let elsChanged = [me, val];
                    if (undoneCommand.context.oldVal !== nullID()){
                        oldVal = await this.$umlWebClient.get(undoneCommand.context.oldVal);
                        elsChanged.push(oldVal);
                    }
                    await me.typeInfo.getSet(this.singletonData.id).set(oldVal);
                    // TODO check composite
                    this.valID = oldVal ? oldVal.id : nullID();
                    this.$emit('elementUpdate', createElementUpdate(...elsChanged));
                }
            }
        }
    },
    methods: {
        async dropNoCommand(recentDragInfo) {
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
            await me.typeInfo.getSet(this.singletonData.id).set(el);
            this.$umlWebClient.put(me);
            this.$umlWebClient.put(el);
            this.$emit('elementUpdate', createElementUpdate(me, el, ...owners));
            this.valID = el.id;
 
        },
        async drop(recentDragInfo) {
            const oldVal = this.valID;
            await this.dropNoCommand(recentDragInfo);
            this.$emit('command', {
                name: 'singletonDropElement',
                element: this.umlID,
                specification: this.umlID,
                context: {
                    set: this.singletonData.id,
                    dragInfo: recentDragInfo,
                    oldVal: oldVal
                }
            });
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
            this.$emit('command', {
                name: 'singletonElementCreation',
                element: this.umlID,
                specification: this.umlID,
                context: {
                    set: this.singletonData.id,
                    elementID: el.id,
                    elementType: el.elementType()
                }
            });
        },
        onContextMenu(data) {
            const evt = data.evt;
            const val = data.el;

            // determine items
            let items = [];
            if (!this.valID) {
                if (this.singletonData.composition === 'composite') {
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
                        this.$emit('focus', {
                            el: val
                        });
                    }
                });
                if (!this.singletonData.readonly) {
                    items.push({
                        label: 'Remove',
                        onClick: async () => {
                            this.$emit('command', {
                                name: 'singletonSpecPageRemove',
                                element: this.umlID,
                                specification: this.umlID,
                                context: {
                                    set: this.singletonData.id,
                                    elementRemoved: this.valID
                                }
                            });
                            await this.removeElement(val);
                        }
                    });
                    items.push({
                        label: 'Delete',
                        onClick: async () => {
                            const element = val;
                            const elementsData = await getElementAndChildrenString(element); 
                            this.$emit('command', {
                                name: 'specificationPageDelete',
                                element: this.umlID,
                                specification: this.umlID,
                                redo: false,
                                context: {
                                    elementDirectlyDeleted: element.id,
                                    elementsData: elementsData,
                                    set: this.singletonData.id
                                }
                            });
                            await this.deleteElement(element);
                        } 
                    });
                }
            }

            if (items.length > 0) {
                //show our menu
                this.$contextmenu({
                    x: evt.x,
                    y: evt.y,
                    items: items,
                    theme: 'flat'
                });
            }
        },
        async deleteElement(element) {
            const owner = await element.owner.get();
            await this.$umlWebClient.delete(element);
            this.$emit('elementUpdate', createElementUpdate(owner));
            this.$umlWebClient.put(owner);
            this.valID = nullID(); 
        },
        async removeElement(val) {
            const el = await this.$umlWebClient.get(this.umlID);
            el.typeInfo.getSet(this.singletonData.id).set(undefined);
            this.$umlWebClient.put(el);
            this.$umlWebClient.put(val);
            this.$emit('elementUpdate', createElementUpdate(el));
            this.valID = nullID();
        },
        propogateFocus(el) {
            this.$emit('focus', el);
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
            {{ singletonData.name }}
        </div>
        <DragArea   :readonly="singletonData.readonly" 
                    :type="singletonData.type" 
                    :size="1"
                    :composition="singletonData.composition"
                    @drop="drop">
            <ElementPanel :umlid="valID"
                          :theme="theme"
                          :selected-elements="selectedElements"
                          :manager="manager"
                          @select="propogateSelect"
                          @deselect="propogateDeselect"
                          @focus="propogateFocus"
                          @menu="onContextMenu">
                <div    class="createButton" 
                        v-if="singletonData.composition === 'composite' && !singletonData.readonly" 
                        @click="createElement">
                    +
                </div>
                <CreationPopUp  v-if="creationPopUp && !$umlWebClient.readonly" 
                                :type="singletonData.type" 
                                :setid="singletonData.id" 
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
