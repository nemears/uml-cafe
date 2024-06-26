<script>
import { createElementUpdate } from '../../umlUtil.js'
export default {
    props: ['label', 'inputType', 'initialData', 'readOnly', 'type', 'umlid', 'theme'],
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
    <div :class="{ numberInputContainer : inputType !== 'checkbox' , checkBoxInputContainer : inputType === 'checkbox' }">
        <div class="numberInputLabel">
            <label for="dataField">
                <b>{{ label }}</b>
            </label>
        </div>
        <input  name="dataField"
                :class="{
                    inputLight : theme === 'light',
                    inputDark : theme === 'dark',
                }"
                :type="inputType" 
                :id="umlid" 
                v-model="data" 
                :readonly="readOnly" 
                @change="submitDataChange" 
                ref="numberInput"/>
    </div>
</template>
<style>
.numberInputContainer, .checkBoxInputContainer {
    display: flex;
    padding-bottom: 10px;
}
.numberInputContainer > input {
    min-width: 700px;
    border: none;
    font-size: 18px;
}
.checkBoxInputContainer > input {
    border: none;
    font-size:18px;
    min-height: 20px;
    min-width: 20px;
}
.inputDark {
    color: azure;
    background-color: #222427;
}
.inputLight {
    background-color: var(--uml-cafe-selection-light-1);
    color: var(--vt-c-dark-dark);
}
.numberInputLabel {
    min-width: 200px;
}
</style>
