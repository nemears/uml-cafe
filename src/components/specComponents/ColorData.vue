<script>
    import { nullID } from 'uml-client/lib/types/element';
    import ElementPanel from './ElementPanel.vue';
    export default {
        props: [
            'umlid',
            'setData',
            'initialVal',
            'selectedElements',
            'theme',
            'manager'
        ],
        emits: [
            'focus',
            'select',
            'deselect'
        ],
        data() {
            return {
                valID: nullID(),
                colorVal: 'rgb(100, 100, 100)'
            };
        },
        async mounted() {
            this.valID = this.initialVal;
            const color = await this.$umlCafeModule.metaClient.get(this.valID);
            this.colorVal = 'rgb(' + color.red + ', ' + color.green + ', ' + color.blue + ')';
        },
        methods: {
            async updateColor(data) {
                const inbetweenParentheses = data.slice(4, -1);
                const rgbSplit = inbetweenParentheses.split(',');                
                const color = await this.$umlCafeModule.metaClient.get(this.valID);
                color.red = rgbSplit[0];
                color.green = rgbSplit[1];
                color.blue = rgbSplit[2];
                await this.$umlCafeModule.metaClient.put(color);
            },
            propogateFocus(data) {
                this.$emit('focus', data);
            },
            propogateSelect(data) {
                this.$emit('select', data);
            },
            propogateDeselect(data) {
                this.$emit('deselect', data);
            }
        },
        components: {
            ElementPanel
        }
    }
</script>
<template>
    <div class="colorDiv">
        <div class="colorLabel">
            {{ setData.name }}
        </div>
        <ElementPanel   :umlid="valID"
                        :theme="theme"
                        :selected-elements="selectedElements"
                        :manager="manager"
                        @focus="propogateFocus"
                        @select="propogateSelect"
                        @deselect="propogateDeselect">
            <div style="margin-left: auto;">
                <ColorPicker    format="rgb" 
                                shape="square" 
                                :pureColor="colorVal"
                                disable-alpha
                                @update:pureColor="updateColor">
                </ColorPicker>
            </div>
        </ElementPanel>
    </div>
</template>
<style>
.colorDiv {
    display: flex;
    padding-bottom: 10px;
}
.colorLabel {
    min-width: 200px;
}
</style>
