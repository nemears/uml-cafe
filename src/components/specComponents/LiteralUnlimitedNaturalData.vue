<script>
import { createElementUpdate } from '../../umlUtil';

export default {
    props: ['initialData', 'readOnly', 'umlid'],
    data() {
        return {
            infinityData: false,
            numberData: undefined,
        }
    },
    emits: ['elementUpdate'],
    created() {
        if (this.initialData === '*') {
            this.infinityData = true;
        } else {
            this.numberData = this.data;
        }
        this.data = this.initialData;
    },
    watch: {
        initialData(newInitalData) {
            this.data = newInitalData;
        },
    },
    methods: {
        async submitDataNumberChange() {
            this.numberData = this.$refs.numberInput.value;
            this.infinityData = false;
            const el = await this.$umlWebClient.get(this.umlid);
            el.value = this.numberData;
            this.$umlWebClient.put(el);
            this.$emit('elementUpdate', createElementUpdate(el));
        },
        async submitInfinityDataChange() {
            const isInfinite = this.$refs.infinityInput.checked;
            const el = await this.$umlWebClient.get(this.umlid);
            if (isInfinite) {
                el.value = '*'
                this.infinityData = true;
                this.numberData = undefined;
            } else {
                this.infinityData = false;

                // check number input
                const numberData = this.$refs.numberInput.value;
                if (numberData) {
                    el.value = numberData;
                    this.numberData = numberData;
                } else {
                    el.value = undefined;
                }
            }
            this.$umlWebClient.put(el);
            this.$emit('elementUpdate', createElementUpdate(el));
        }
    }
}
</script>
<template>
    <div class="unlimitedNaturalContainer">
        <div class="unlimtedNaturalLabel">
            <b>Value</b>
        </div>
        <div class="infinityContainer">
            <label for="infinityField">
                <b>*</b>
            </label>
            <input  name="infinityField" 
                type="checkbox" 
                :id="umlid + 'infinity'" 
                v-model="infinityData" 
                :readonly="readOnly" 
                @change="submitInfinityDataChange"
                ref="infinityInput">
        </div>
        <div class="numberContainer">
            <label for="numberField">
                <b>number</b>
            </label>
            <input  name="numberField" 
                type="number" 
                :id="umlid + 'number'" 
                v-model="data" 
                :readonly="readOnly" 
                @change="submitNumberDataChange" 
                ref="numberInput"/>
        </div>
    </div>
</template>
<style>
.unlimitedNaturalContainer {
    display: flex;
    padding-bottom: 10px;
}
.infinityContainer {
    display: flex;
}
.numberContainer {
    display: flex;
}
.infinityContainer > input {
    min-width: 50px;
    color: azure;
    background-color: #222427;
    border: none;
    font-size: 18px;
}
.numberContainer > input {
    margin-left: 10px;
    min-width: 570px;
    color: azure;
    background-color: #222427;
    border: none;
    font-size: 18px;
}
.unlimtedNaturalLabel {
    min-width: 200px;
}
</style>