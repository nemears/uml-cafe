<script>
export default {
    props: ['label', 'umlID', 'enumValues', 'enumName', 'initialValue', 'theme'],
    data() {
        return {

        }
    },
    mounted() {
        if (this.initialValue) {
            this.$refs.enumInput.value = this.initialValue;
        }
    },
    methods: {
        async submitDataChange() {
            let selectedVal = this.$refs.enumInput.value;
            if (selectedVal === '') {
                for (const enumVal of this.enumValues) {
                    if (enumVal.default) {
                        selectedVal = enumVal.name;
                    }
                }
            }
            const el = await this.$umlWebClient.get(this.umlID);
            el[this.enumName] = selectedVal;
            this.$umlWebClient.put(el);
        }
    }
}
</script>
<template>
    <div class="enumInputContainer">
        <div class="enumInputLabel">
            <label for="dataField">
                <b>{{ label }}</b>
            </label>
        </div>
        <select name="dataField"
                :class="{
                    darkInput : theme === 'dark',
                    lightInput : theme === 'light',
                }"
                @change="submitDataChange" 
                ref="enumInput">
            <option v-for="value in enumValues" 
                    :key="value.name" 
                    :value="value.name">{{ value.label }}</option>
        </select>
    </div>
</template>
<style>
.enumInputContainer {
    display: flex;
    padding-bottom: 10px;
}
.enumInputContainer > select {
    min-width: 700px;
    border: none;
    font-size: 18px;
}
.darkInput {
    color: azure;
    background-color: var(--open-uml-selection-dark-1);
}
.lightInput {
    background-color: var(--uml-cafe-selection-light-1);
    color: var(--vt-c-dark-dark);
}
.enumInputLabel {
    min-width: 200px;
}
</style>