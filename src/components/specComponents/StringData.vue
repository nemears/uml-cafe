<script>
export default {
    props: ['label', 'initialData', 'readOnly', 'type', 'umlid'],
    inject: ['dataChange'],
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
        },
        dataChange(newDataChange, oldDataChange) {
            for (let data of newDataChange.data) {
                if (data.type === this.type && data.id === this.umlid) {
                    this.data = data.value;
                }
            }
        }
    },
    methods: {
        async submitDataChange() {
            this.data = this.$refs.stringInput.value;
            const el = await this.$umlWebClient.get(this.umlid);
            el[this.type] = this.data; // this may be dangerous in the future
            this.$umlWebClient.put(el);
            this.$emit('dataChange', {
                data: [
                    {
                        id: this.umlid,
                        type: this.type,
                        value: this.data
                    }
                ]
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