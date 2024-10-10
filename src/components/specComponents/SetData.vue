<script>
import getImage from '../../GetUmlImage.vue';
import CreationPopUp from './CreationPopUp.vue';
import DragArea from './DragArea.vue';
import ElementPanel from './ElementPanel.vue';
import { createElementUpdate, assignTabLabel } from '../../umlUtil.js';
import { nullID } from 'uml-client/lib/types/element';
export default {
    props: [
        'initialData', 
        'umlid', 
        'creatable', 
        'setData',
        'selectedElements',
        'theme',
        'manager',
    ],
    inject: [
        'elementUpdate',
        'userSelected',
        'userDeselected'
    ],
    emits: ['focus', 'elementUpdate', 'select', 'deselect'],
    data() {
        return {
            data: [],
            createPopUp: false,
            dummy: false,
            nullID: nullID(),
        };
    },
    mounted() {
        this.data = this.initialData;
    },
    watch: {
        initialData(newInitialData) {
            this.data = newInitialData;
        },
        elementUpdate(newElementUpdate) {
            for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                if (newElement) {
                    // check that the new element is us
                    const newElementSet = newElement.typeInfo.getSet(this.setData.id); 
                    if (newElement.id === this.umlid) {
                        // keep track of original children
                        const existingIDs = this.data.map((el) => el.id);

                        // check if we need to add children
                        for (const elementID of newElementSet.ids()) {
                            if (!this.data.find((el) => el === elementID)) {
                                // add the data
                                this.data.push(elementID);
                            }
                        }

                        // check if we need remove an element
                        for (const existingID of existingIDs) {
                            if (!newElementSet.contains(existingID)) {
                                // remove the element
                                this.data = this.data.filter((el) => el !== existingID);
                            }
                        }
                    }
                }
 
            }
        }
    },
    methods: {
        async propogateFocus(el) {
            this.$emit('focus', el);
        },
        createElement() {
            this.createPopUp = true;
        },
        async closePopUp(element) {
            this.createPopUp = false;
            if (element === undefined) {
                return;
            }
            this.data.push(element.id);
            this.$emit('elementUpdate', createElementUpdate(await this.$umlWebClient.get(this.umlid)));
        },
        async drop(recentDragInfo) {
            const me = await this.$umlWebClient.get(this.umlid);
            const oldOwners = [];
            for (const element of recentDragInfo.selectedElements) {
                if (element.owner.has()) {
                    oldOwners.push(await element.owner.get());
                }
                await me.typeInfo.getSet(this.setData.id).add(element);
                this.data.push({
                    img: getImage(element),
                    id: element.id,
                    label: element.name !== undefined ? element.name : '',
                    selected: false,
                    currentUsers: [],
                });
                this.$umlWebClient.put(element);
            }
            this.$umlWebClient.put(me);
            this.$emit('elementUpdate', createElementUpdate(me, ...recentDragInfo.selectedElements, ...oldOwners))
        },
        async elementContextMenu(data) {
            const evt = data.evt;
            const el = data.el;
            let items = [];
            let element = await this.$umlWebClient.get(el.id);
            items.push({
                label: 'Specification',
                onClick: () => {
                    this.$emit('focus', {
                        el: element
                    });
                }
            });
           
            if (this.setData.readonly === undefined || !this.setData.readonly) {
                items.push({
                    label: 'Remove',
                    onClick: async () => {
                        const owner = await this.$umlWebClient.get(this.umlid);
                        owner.typeInfo.getSet(this.setData.id).remove(element);
                        this.$umlWebClient.put(owner);
                        this.$umlWebClient.put(element);
                        this.$emit('elementUpdate', createElementUpdate(owner));
                        this.data = this.data.filter(dataEl => dataEl.id !== el.id);
                    }
                });

                items.push({
                    label: 'Delete',
                    onClick: async () => {
                        const owner = await this. $umlWebClient.get(this.umlid);
                        await this.$umlWebClient.delete(element);
                        this.$umlWebClient.put(owner);
                        this.$emit('elementUpdate', createElementUpdate(owner));
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
        propogateSelect(data) {
            this.$emit('select', data);
        },
        propogateDeselect(data) {
            this.$emit('deselect', data);
        },
    },
    components: { CreationPopUp, DragArea, ElementPanel }
}
</script>
<template>
    <div class="setInputContainer">
        <div class="setLabel">
            {{  setData.name }}
        </div>
        <DragArea :readonly="setData.readonly" :type="setData.type" @drop="drop">
            <ElementPanel v-for="el in data"
                          :key="el"
                          :umlid="el"
                          :theme="theme"
                          :selected-elements="selectedElements"
                          :manager="manager"
                          @focus="propogateFocus"
                          @select="propogateSelect"
                          @deselect="propogateDeselect"
                          @menu="elementContextMenu">
            </ElementPanel>
            <div v-if="(setData.composition === 'composite' && !setData.readonly) || data.length === 0">
                <ElementPanel :umlid="nullID"
                              :theme="theme"
                              :selected-elements="selectedElements"
                              @dblclick="createElement">
                    <div    class="createToolTip" 
                            v-if="setData.composition === 'composite' && !setData.readonly">
                        double click to create an element
                    </div>
                    <div class="createButton" 
                         :class="{ readOnlyButton : $umlWebClient.readonly}" 
                         v-if="setData.composition === 'composite' && !setData.readonly" 
                         @click="createElement">
                        +
                    </div>
                </ElementPanel>
                <CreationPopUp v-if="createPopUp && !$umlWebClient.readonly" 
                               :type="setData.type" 
                               :setid="setData.id" 
                               :umlid="umlid"
                               :theme="theme"
                               @closePopUp="closePopUp"></CreationPopUp>
            </div>
        </DragArea>
    </div>
</template>
<style>
.setInputContainer {
    display: flex;
    padding-bottom: 10px;
}
.setLabel {
    min-width: 200px;
}
.createButton {
    margin-left: auto;
    text-align: center;
    border: 1px solid;
    min-width: 25px;
    border-color: var(--vt-c-black-soft);
    /*background-color: var(--vt-c-white-soft);*/
    color: var(--vt-c-black-soft);
    -webkit-user-select: none; /* Safari */        
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
}
.createButton:hover {
    background-color: var(--vt-c-off-white);
}
.createToolTip {
    /*padding-left: 150px;*/
    flex: 1 0;
    text-align: center;
    -webkit-user-select: none; /* Safari */        
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
    white-space: nowrap;
    /* width: 700px; */
}
.readOnlyToolTip {
    color: var(--vt-c-divider-dark-1);
}
.readOnlyButton {
    color: var(--vt-c-divider-dark-1);
    background-color: var(--vt-c-dark-soft);
}
</style>
