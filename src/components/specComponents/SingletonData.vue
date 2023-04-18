<script>
import getImage from '../../GetUmlImage.vue';
export default {
    props: ['label', 'umlID', 'initalData', 'readonly'],
    emits: ['specification'],
    inject: ['dataChange'],
    data() {
        return {
            img: undefined,
            valID: undefined,
            valLabel: '',
            drag: false,
            badDrag: false
        }
    },
    mounted() {
        if (this.initalData !== undefined) {
            this.setData(this.initalData);
        }
    },
    watch: {
        initialData(newInitialData, oldInitialData) {
            if (newInitialData !== undefined) {
                this.setData(newInitialData);
            }
        },
        dataChange(newDataChange, oldDataChange) {
            for (let data of newDataChange.data) {
                if (data.id === this.valID && data.type === 'name') {
                    if (data.value === '') {
                        this.valLabel = this.valID;
                    } else {
                        this.valLabel = data.value;
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
            // if (this.label === 'Type') {
            //     const typeSubClasses = ['type', 'classifier', 'dataType', 'primitiveType', 'class', 'interface', 
            //                             'enumeration', 'association', 'activity', 'opaqueBehavior'];
            //     if (!typeSubClasses.includes(elementType)) {
            //         this.badDrag = true;
            //     }
            // }
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
            if (wasA_BadDrag) {
                return;
            }
            const elementID = event.dataTransfer.getData('umlid');
            const me = await this.$umlWebClient.get(this.umlID);
            const elementDragged = await this.$umlWebClient.get(elementID);
            if (this.label === 'Type' && elementDragged.isSubClassOf('classifier')) {
                me.type.set(elementDragged);
                this.$umlWebClient.put(me);
                this.$umlWebClient.put(elementDragged);
                this.img = getImage(elementDragged);
                this.valLabel = elementDragged.name !== undefined && elementDragged.name !== '' ? elementDragged.name : elementDragged.id;
                this.valID = elementDragged.id;
                // TODO emit data change
            }
        }
    }
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
            @dragover.prevent>
            <img v-bind:src="img" v-if="img !== undefined" />
            <div>
                {{ valLabel }}
            </div>
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
    background-color: #222427;
    min-height: 24px;
    display: flex;
}
.singletonElement:hover {
    background-color: #292c30;
}
.singletonBadDrag {
    border: 1px solid;
    border-color: #d10000;
}
.singletonGoodDrag {
    border: 1px solid;
    border-color:#5ac3ff;
}
</style>