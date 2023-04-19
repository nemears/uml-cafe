<script>
export default {
    props: ['label', 'initialData', 'readOnly', 'type', 'umlid'],
    data() {
        return {
            data: undefined
        }
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
            console.log('TODO submit integer data change (maybe not needed)');
            this.data = this.$refs.numberInput.value;
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
    <div class="numberInputContainer">
        <div class="numberInputLabel">
            <label for="dataField">
                <b>{{ label }}</b>
            </label>
        </div>
        <input name="dataField" type="number" :value="data" :readonly="readOnly" @change="submitDataChange" ref="numberInput"/>
    </div>
</template>
<style>
.numberInputContainer {
    display: flex;
    padding-bottom: 10px;
}
.numberInputContainer > input {
    min-width: 700px;
    color: azure;
    background-color: #222427;
    border: none;
    font-size: 18px;
}
.numberInputLabel {
    min-width: 200px;
}
</style>