<script>
import getImage from '../../GetUmlImage.vue';
import CreationPopUp from './CreationPopUp.vue';
import { createElementUpdate } from '../../createElementUpdate.js';
export default {
    props: ['label', 'umlID', 'initialData', 'readonly', 'createable', 'singletonData'],
    emits: ['specification', 'elementUpdate'],
    inject: ['elementUpdate'],
    data() {
        return {
            img: undefined,
            valID: undefined,
            valLabel: '',
            drag: false,
            badDrag: false,
            creationPopUp: false,
        }
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
            for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                if (newElement) {
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
    },
    methods: {
        setData(data) {
            this.img = data.img;
            this.valID = data.id;
            this.valLabel = data.label;
        },
        async specification() {
            if (this.valID === undefined) {
                return;
            }
            this.$emit('specification', await this.$umlWebClient.get(this.valID));
        },
        dragenter(event) {
            this.drag = true;
            const eventData = event.dataTransfer.getData('text/plain').split(',');
            const elementType = eventData[1];
        },
        dragleave(event) {
            this.drag = false;
            this.badDrag = false;
        },
        async drop(event) {
            console.log('dropped on singleton div ' + this.label);
            const wasA_BadDrag = this.badDrag;
            this.drag = false;
            this.badDrag = false;
            if (wasA_BadDrag || this.$umlWebClient.readonly) {
                return;
            }
            const elementID = event.dataTransfer.getData('umlid');
            const me = await this.$umlWebClient.get(this.umlID);
            const elementDragged = await this.$umlWebClient.get(elementID);
            
            // determine if element dragged in is valid
            let isValidElement = false;
            for (let type of this.singletonData.validTypes) {
                if (elementDragged.isSubClassOf(type)) {
                   isValidElement = true;
                }
            }

            if (isValidElement) {
                // TODO check if there is an element there already
                me[this.singletonData.setName].set(elementDragged);
                this.$umlWebClient.put(me);
                this.$umlWebClient.put(elementDragged);
                this.img = getImage(elementDragged);
                this.valLabel = elementDragged.name !== undefined ? elementDragged.name : '';
                this.valID = elementDragged.id;
                // TODO emit data change
 
            } else {
                console.warn('bad element dragged in, TODO alert user!');
            }
        },
        createElement(event) {
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
                label: el.name !== undefined ? el.name : '' 
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
                        el.sets[this.singletonData.setName].set(null);
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
            @dblclick="specification"
            :class="{singletonBadDrag: drag && (readonly || badDrag), singletonGoodDrag: drag && !readonly}"
            @dragenter.prevent="dragenter($event)"
            @dragleave.prevent="dragleave($event)"
            @drop="drop($event)"
            @dragover.prevent
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
    border: 1px solid;
    border-color:#292c30;
    width: 700px;
    background-color: var(--open-uml-selection-dark-1);
    min-height: 24px;
    display: flex;
    padding-left: 5px;
}
.singletonElement:hover {
    background-color: var(--open-uml-selection-dark-2);
}
.singletonBadDrag {
    border: 1px solid;
    border-color: #d10000;
}
.singletonGoodDrag {
    border: 1px solid;
    border-color:#5ac3ff;
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
