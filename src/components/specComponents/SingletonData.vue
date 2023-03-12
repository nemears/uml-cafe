<script>
import UmlWebClient from 'uml-js/lib/umlClient';
export default {
    props: ['label', 'umlID', 'initalData'],
    emits: ['specification'],
    inject: ['dataChange'],
    data() {
        return {
            img: undefined,
            valID: undefined,
            valLabel: ''
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
            if (newDataChange.id === this.valID && newDataChange.type === 'name') {
                if (newDataChange.value === '') {
                    this.valLabel = this.valID;
                } else {
                    this.valLabel = newDataChange.value;
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
            const client = new UmlWebClient(this.$sessionName);
            this.$emit('specification', await client.get(this.valID));
        }
    }
}
</script>
<template>
    <div class="singletonDiv">
        <div class="singletonLabel">
            {{ label }}
        </div>
        <div class="singletonElement" @dblclick="specification">
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
    width: 700px;
    background-color: #222427;
    min-height: 24px;
    display: flex;
}
.singletonElement:hover {
    background-color: #292c30;
}
</style>