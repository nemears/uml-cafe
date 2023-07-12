<script>
export default {
    props: ['label', 'umlID', 'enumValues', 'enumName', 'initialValue'],
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
        <select name="dataField" @change="submitDataChange" ref="enumInput">
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
    color: azure;
    background-color: #222427;
    border: none;
    font-size: 18px;
}
.enumInputLabel {
    min-width: 200px;
}
</style>
