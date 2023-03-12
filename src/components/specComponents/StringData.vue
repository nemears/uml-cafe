<script>
import UmlWebClient from 'uml-js/lib/umlClient';

export default {
    props: ['label', 'initialData', 'readOnly', 'type', 'umlid'],
    data() {
        return {
            data: ''
        };
    },
    emits: ['dataChange'],
    mounted() {
        this.data = this.initialData;
    },
    watch: {
        initialData(newInitalData, oldInitialData) {
            this.data = newInitalData;
        }
    },
    methods: {
        async submitDataChange() {
            this.data = this.$refs.stringInput.value;
            const client = new UmlWebClient(this.$sessionName);
            const el = await client.get(this.umlid);
            el[this.type] = this.data; // this may be dangerous in the future
            client.put(el);
            this.$emit('dataChange', {
                id: this.umlid,
                type: this.type,
                value: this.data
            });
        }
    }
}
</script>
<template>
    <div class="stringInputContainer">
        <div class="stringInputLabel">
            <label for="dataField">
                <b>{{ label }}</b>
            </label>
        </div>
        <input name="dataField" type="text" :value="data" :readonly="readOnly" @keypress.enter="submitDataChange" ref="stringInput"/>
    </div>
</template>
<style>
.stringInputContainer {
    display: flex;
    padding-bottom: 10px;
}
.stringInputContainer > input {
    min-width: 700px;
    color: azure;
    background-color: #222427;
    border: none;
    font-size: 18px;
}
.stringInputLabel {
    min-width: 200px;
}
</style>