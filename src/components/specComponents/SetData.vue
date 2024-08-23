<script>
import getImage from '../../GetUmlImage.vue';
import CreationPopUp from './CreationPopUp.vue';
import DragArea from './DragArea.vue';
import ElementPanel from './ElementPanel.vue';
import { createElementUpdate, assignTabLabel } from '../../umlUtil.js';
import { nullID } from 'uml-client/lib/types/element';
export default {
    props: [
        'label', 
        'initialData', 
        'umlid', 
        'subsets', 
        'creatable', 
        'setData',
        'selectedElements',
        'theme',
    ],
    inject: [
        'elementUpdate',
        'userSelected',
        'userDeselected'
    ],
    emits: ['specification', 'elementUpdate', 'select', 'deselect'],
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
                    if (newElement.id === this.umlid) {
                        // keep track of original children
                        const existingIDs = this.data.map((el) => el.id);

                        // check if we need to add children
                        for (const elementID of newElement.sets.get(this.setData.setName).ids()) {
                            if (!this.data.find((el) => el.id === elementID)) {
                                // add the data
                                this.data.push({
                                    id: elementID,
                                });
                            }
                        }

                        // check if we need remove an element
                        for (const existingID of existingIDs) {
                            if (!newElement.sets.get(this.setData.setName).contains(existingID)) {
                                // remove the element
                                this.data = this.data.filter((el) => el.id !== existingID);
                            }
                        }
                    }
                }
 
            }
        }
    },
    methods: {
        async propogateSpecification(el) {
            this.$emit('specification', el);
        },
        createElement() {
            this.createPopUp = true;
        },
        async closePopUp(element) {
            this.createPopUp = false;
            if (element === undefined) {
                return;
            }
            this.data.push({
                img: getImage(element),
                id: element.id,
                label: await assignTabLabel(element),
                selected: false,
                currentUsers: [],
            });
            this.$emit('elementUpdate', createElementUpdate(await this.$umlWebClient.get(this.umlid)));
        },
        async drop(recentDragInfo) {
            const me = await this.$umlWebClient.get(this.umlid);
            const oldOwners = [];
            for (const element of recentDragInfo.selectedElements) {
                if (element.owner.has()) {
                    oldOwners.push(await element.owner.get());
                }
                me[this.setData.setName].add(element);
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
                    this.$emit('specification', element);
                }
            });
           
            if (this.setData.readonly === undefined || !this.setData.readonly) {
                items.push({
                    label: 'Remove',
                    onClick: async () => {
                        const owner = await this.$umlWebClient.get(this.umlid);
                        owner.sets.get(this.setData.setName).remove(element);
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
                        await this.$umlWebClient.deleteElement(element);
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
            {{  label }}
        </div>
        <DragArea :readonly="setData.readonly" :type="setData.type" @drop="drop">
            <ElementPanel v-for="el in data"
                          :key="el.id"
                          :umlid="el.id"
                          :theme="theme"
                          :selected-elements="selectedElements"
                          @specification="propogateSpecification"
                          @select="propogateSelect"
                          @deselect="propogateDeselect"
                          @menu="elementContextMenu">
            </ElementPanel>
            <div v-if="creatable || data.length === 0">
                <ElementPanel :umlid="nullID"
                              :theme="theme"
                              :selected-elements="selectedElements"
                              @dblclick="createElement">
                    <div    class="createToolTip" 
                            v-if="creatable">
                        double click to create an element
                    </div>
                    <div class="createButton" 
                         :class="{ readOnlyButton : $umlWebClient.readonly}" 
                         v-if="creatable" 
                         @click="createElement">
                        +
                    </div>
                </ElementPanel>
                <CreationPopUp v-if="createPopUp && !$umlWebClient.readonly" 
                               :types="creatable.types" 
                               :set="creatable.set" 
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
    padding-left: 150px;
    -webkit-user-select: none; /* Safari */        
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
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
