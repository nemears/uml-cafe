<script>
import { createElementUpdate } from '../../umlUtil.js'
export default {
    props: ['label', 'inputType', 'initialData', 'readOnly', 'type', 'umlid'],
    data() {
        return {
            data: undefined
        }
    },
    emits: ['elementUpdate'],
    created() {
        this.data = this.initialData;
    },
    watch: {
        initialData(newInitalData) {
            this.data = newInitalData;
        },
    },
    methods: {
        async submitDataChange() {
            console.log('TODO submit integer data change (maybe not needed)');
            this.data = this.inputType === 'checkbox' ? this.$refs.numberInput.checked : this.$refs.numberInput.value;
            const el = await this.$umlWebClient.get(this.umlid);
            el[this.type] = this.data; // this may be dangerous in the future
            this.$umlWebClient.put(el);
            this.$emit('elementUpdate', createElementUpdate(el));
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
        <input name="dataField" :type="inputType" :id="umlid" v-model="data" :readonly="readOnly" @change="submitDataChange" ref="numberInput"/>
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
