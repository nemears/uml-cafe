<script>
import CloseSymbol from '../../assets/icons/general/close_symbol.svg';
import getImage from '../../GetUmlImage.vue';
export default {
    props: ['types', 'umlid', 'set'],
    emits: ['closePopUp'],
    data() {
        return {
            closeSymbol: CloseSymbol,
            images: {}
        }
    },
    mounted() {
        for (let type of this.types) {
            this.images[type] = getImage(type);
        }
    },
    methods: {
        closePopUp(event) {
            this.$emit('closePopUp', undefined);
        },
        async createElement(elementType) {
            const elCreated = await this.$umlWebClient.post(elementType);
            const contextEl = await this.$umlWebClient.get(this.umlid);
            contextEl.sets[this.set].add(elCreated);
            this.$umlWebClient.put(contextEl);
            this.$umlWebClient.put(elCreated);
            this.$emit('closePopUp', elCreated);
        }
    }
}
</script>
<template>
    <div class="mainPopUp">
        <div class="banner">
            Select Element Type to create...
            <div class="closePopUp" @click.stop="closePopUp">
                <img v-bind:src="closeSymbol" style="padding:5px"/>
            </div>
        </div>
        <div class="content">
            <div class="elementCreationOption" v-for="elementType in types" :key="elementType" @dblclick="createElement(elementType)">
                <img v-bind:src="images[elementType]"/>
                <div style="padding-left:5px" class="notEditable">
                    {{ elementType }}
                </div>
            </div>
        </div>
    </div>
</template>
<style>
.mainPopUp {
    position: absolute;
    z-index: 1;
    background-color: var(--open-uml-selection-dark-1);
    pointer-events: all;
    border: 1px solid;
    border-color: var(--vt-c-divider-dark-1);
}
.content {
    margin: 5px;
}
.banner {
    display: inline-block;
    width: 410px;
    padding-left: 10px;
}
.closePopUp {
    display: flex;
    float: right;
    z-index: 2;
}
.elementCreationOption {
    border: 1px solid;
    border-color: var(--vt-c-divider-dark-1);
    width: 400px;
    background-color: var(--open-uml-selection-dark-1);
    vertical-align: middle;
    display: flex;
    padding-left: 5px;
}
.elementCreationOption:hover {
    background-color: var(--open-uml-selection-dark-2);
}
</style>
