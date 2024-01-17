<script>
import getImage from '../../GetUmlImage.vue';
import CreationPopUp from './CreationPopUp.vue';
import { createElementUpdate, assignTabLabel } from '../../umlUtil.js';
export default {
    props: ['label', 'initialData', 'umlid', 'subsets', 'creatable', "setData"],
    inject: ['elementUpdate', 'draginfo'],
    emits: ['specification', 'elementUpdate'],
    data() {
        return {
            data: [],
            createPopUp: false,
            drag: false,
            badDrag: false,
            recentDragInfo: undefined,
            dragCounter: 0,
        };
    },
    mounted() {
        this.data = this.initialData;
    },
    watch: {
        initialData(newInitialData) {
            this.data = newInitialData;
        },
        async elementUpdate(newElementUpdate) {
            for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                if (newElement) {
                    // check that the new element is us
                    if (newElement.id === this.umlid) {
                        // keep track of original children
                        const existingIDs = this.data.map((el) => el.id);

                        // check if we need to add children
                        for (const elementID of newElement.sets[this.setData.setName].ids()) {
                            if (!this.data.find((el) => el.id === elementID)) {
                                // add the data
                                const element = await this.$umlWebClient.get(elementID);
                                this.data.push({
                                    id: elementID,
                                    label: element.name !== undefined ? element.name : '',
                                    img: getImage(element),
                                });
                            }
                        }

                        // check if we need remove an element
                        for (const existingID of existingIDs) {
                            if (!newElement.sets[this.setData.setName].contains(existingID)) {
                                // remove the element
                                this.data = this.data.filter((el) => el.id !== existingID);
                            }
                        }
                    } else {
                        const foundData = this.data.find((el) => el.id === newElement.id);
                        if (foundData) {
                            foundData.label = await assignTabLabel(newElement);
                        }
                    }
                }
 
            }
        },
        draginfo(newDragInfo) {
            this.recentDragInfo = newDragInfo;
        }
    },
    methods: {
        async specification(id) {
            this.$emit('specification', await this.$umlWebClient.get(id));
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
                label: await assignTabLabel(element)  
            });
            this.$emit('elementUpdate', createElementUpdate(await this.$umlWebClient.get(this.umlid)));
        },
        dragenter(event) {
            event.preventDefault();
            this.dragCounter++;
            this.drag = true;
            this.badDrag = this.setData.readonly || this.$umlWebClient.readonly;
            if (!this.badDrag && this.creatable) {
                for (const el of this.recentDragInfo.selectedElements) {
                    let isValidType = false;
                    for (const type of this.creatable.types) {
                        if (el.isSubClassOf(type)) {
                            isValidType = true;
                            break;
                        }
                    }
                    if (!isValidType) {
                        this.badDrag = true;
                        break;
                    }
                }
            }
        },
        dragleave() {
            this.dragCounter--;
            if (this.dragCounter === 0) {
                this.drag = false;
            }
        },
        async drop() {
            this.drag = false;
            if (this.badDrag) {
                return;
            }    
            const me = await this.$umlWebClient.get(this.umlid);
            const oldOwners = [];
            for (const element of this.recentDragInfo.selectedElements) {
                if (element.owner.has()) {
                    oldOwners.push(await element.owner.get());
                }
                me[this.setData.setName].add(element);
                this.data.push({
                    img: getImage(element),
                    id: element.id,
                    label: element.name !== undefined ? element.name : '',
                });
                this.$umlWebClient.put(element);
            }
            this.$umlWebClient.put(me);
            this.$emit('elementUpdate', createElementUpdate(me, ...this.recentDragInfo.selectedElements, ...oldOwners))
        },
        async elementContextMenu(evt, el) {
            evt.preventDefault();
            
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
                        owner.sets[this.setData.setName].remove(element);
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
                items: items
            });
        }
    },
    components: { CreationPopUp }
}
</script>
<template>
    <div class="setInputContainer">
        <div class="setLabel">
            {{  label }}
        </div>
        <div :class="drag ? badDrag ? 'badDrag' : 'dragElement' : 'noDrag'"
             @dragenter="dragenter"
             @dragleave="dragleave"
             @drop="drop($event)"
             @dragover.prevent>
            <div    class="setElement" 
                    v-for="el in data" 
                    :key="el.id" 
                    @dblclick="specification(el.id)"
                    @contextmenu="elementContextMenu($event, el)">
                <img v-if="el.img !== undefined" :src="el.img"/>
                <div>
                    {{ el.label }}
                </div>
            </div>
            <div v-if="creatable || data.length === 0" >
                <div class="setElement" @dblclick="createElement">
                    <div class="createToolTip" 
                         :class="{ readOnlyToolTip : $umlWebClient.readonly }" 
                         v-if="creatable">
                        double click to create an element
                    </div>
                    <div class="createButton" 
                         :class="{ readOnlyButton : $umlWebClient.readonly}" 
                         v-if="creatable" 
                         @click="createElement">
                        +
                    </div>
                </div>
                <CreationPopUp v-if="createPopUp && !$umlWebClient.readonly" 
                               :types="creatable.types" 
                               :set="creatable.set" 
                               :umlid="umlid" 
                               @closePopUp="closePopUp"></CreationPopUp>
            </div>
        </div>
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
.setElement {
    width: 700px;
    background-color: var(--open-uml-selection-dark-1);
    min-height: 24px;
    display: flex;
    padding-left: 5px;
}
.setElement:hover {
    background-color: var(--open-uml-selection-dark-2);
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
.noDrag {
    border: none;
}
.dragElement {
    border: 1px solid;
    border-color: var(--uml-cafe-selected-hover);
}
.badDrag {
    border: 1px solid;
    border-color: var(--uml-cafe-selected-error);
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
}
.readOnlyToolTip {
    color: var(--vt-c-divider-dark-1);
}
.readOnlyButton {
    color: var(--vt-c-divider-dark-1);
    background-color: var(--vt-c-dark-soft);
}
</style>
