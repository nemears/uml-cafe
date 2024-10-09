<script>
    import { createElementUpdate } from '../../umlUtil.js';
    export default {
        props: ['umlid', 'theme'],
        emits: ['elementUpdate'],
        inject: ['elementUpdate'],
        data() {
            return {}
        },
        mounted() {
            const doLater = async () => {
                let el = await this.$umlWebClient.get(this.umlid);
                await this.setSelector(el);
            };
            doLater();
        },
        watch: {
            elementUpdate(newElementUpdate) {
                for (const update of newElementUpdate.updatedElements) {
                    const newElement = update.newElement;
                    if (newElement && newElement.id === this.umlid) {
                        this.setSelector(newElement);
                    }
                }
            }
        },
        methods: {
            async setSelector(el) {
                const lowerValue = await el.lowerValue.get();
                const upperValue = await el.upperValue.get();
                if (lowerValue && upperValue) {
                    if (lowerValue.value === 0 && upperValue.value === 1) {
                        this.$refs.enumInput.value = '0..1';
                    } else if (lowerValue.value === 1 && upperValue.value == 1) {
                        this.$refs.enumInput.value = '1..1';
                    } else if (lowerValue.value === 0 && upperValue.value === '*') {
                        this.$refs.enumInput.value = '0..*';
                    } else if (lowerValue.value === 1 && upperValue.value === '*') {
                        this.$refs.enumInput.value = '1..*';
                    }
                } else {
                    this.$refs.enumInput.value = 'unspecified'
                }
            },
            async submitDataChange() {
                let selectedVal = this.$refs.enumInput.value;
                let el = await this.$umlWebClient.get(this.umlid);
                let lowerValue = await el.lowerValue.get();
                let upperValue = await el.upperValue.get();
                const checkAndCreateLowerValue = () => {
                    if (!lowerValue) {
                        lowerValue = this.$umlWebClient.post('LiteralInt');
                        el.lowerValue.set(lowerValue);
                    }
                };
                const checkAndCreateSingletonUpper = async () => {
                    if (upperValue && !upperValue.is('LiteralInt')) {
                        el.upperValue.set(undefined);
                        await this.$umlWebClient.delete(upperValue);
                        upperValue = undefined;
                    }
                    if (!upperValue) {
                        upperValue = this.$umlWebClient.post('LiteralInt');
                        el.upperValue.set(upperValue);
                    }
                    upperValue.value = 1;
                };
                const checkAndCreateSetUpper = async () => {
                    if (upperValue && !upperValue.is('LiteralUnlimitedNatural')) {
                        el.upperValue.set(undefined);
                        await this.$umlWebClient.delete(upperValue);
                        upperValue = undefined;
                    }
                    if (!upperValue) {
                        upperValue = await this.$umlWebClient.post('LiteralUnlimitedNatural');
                        el.upperValue.set(upperValue);
                    }
                    upperValue.value = '*';
                };
                switch (selectedVal) {
                    case 'unspecified': {
                        if (upperValue) {
                            el.upperValue.set(undefined);
                            await this.$umlWebClient.delete(upperValue);
                            upperValue = undefined;
                        }
                        if (lowerValue) {
                            el.lowerValue.set(undefined);
                            await this.$umlWebClient.delete(lowerValue);
                            lowerValue = undefined;
                        }
                        break;
                    }
                    case '0..1': {
                        await checkAndCreateSingletonUpper();
                        checkAndCreateLowerValue(); 
                        lowerValue.value = 0;
                        break;
                    }
                    case '1..1': {
                        await checkAndCreateSingletonUpper();
                        checkAndCreateLowerValue();
                        lowerValue.value = 1;
                        break; 
                    }
                    case '0..*': {
                        await checkAndCreateSetUpper();
                        checkAndCreateLowerValue();
                        lowerValue.value = 0;
                        break;
                    }
                    case '1..*': {
                        await checkAndCreateSetUpper();
                        checkAndCreateLowerValue();
                        lowerValue.value = 1;
                        break; 
                    }
                    default: {
                        throw Error('impossible multiplicity option selected contact dev!');
                    }
                }
                if (upperValue) {
                    this.$umlWebClient.put(upperValue);
                }
                if (lowerValue) {
                    this.$umlWebClient.put(lowerValue);
                }
                this.$umlWebClient.put(el);
                this.$emit('elementUpdate', createElementUpdate(el));
            }
        }
    }
</script>
<template>
    <div class="enumInputContainer">
        <div class="enumInputLabel">
            <label for="dataField">
                <b>Multiplicity quick select</b>
            </label>
        </div>
        <select name="dataField"
                :class="{
                    darkInput : theme === 'dark',
                    lightInput : theme === 'light',
                }"
                @change="submitDataChange" 
                ref="enumInput">
            <option>unspecified</option>
            <option>0..1</option>
            <option>1..1</option>
            <option>0..*</option>
            <option>1..*</option>
        </select>
    </div>
</template>
<style>
.enumInputContainer {
    display: flex;
    padding-bottom: 10px;
}
.enumInputContainer > select {
    min-width: 400px;
    flex: 1 0;
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
