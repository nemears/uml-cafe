<script>
export default {
    props: ['label', 'initialData', 'readOnly'],
    data() {
        return {
            data: ''
        };
    },
    mounted() {
        this.data = this.initialData;
    },
    watch: {
        initialData(newInitalData, oldInitialData) {
            this.data = newInitalData;
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
        <input name="dataField" type="text" :value="data" :readonly="readOnly"/>
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
    border: solid #525258;
    border-width: 2px;
    font-size: 18px;
}
.stringInputLabel {
    min-width: 200px;
}
</style>