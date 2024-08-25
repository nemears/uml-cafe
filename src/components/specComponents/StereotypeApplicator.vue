<script>
    import { generate } from 'uml-client/lib/generate';
    import { nullID } from 'uml-client/lib/types/element';
    import DragArea from './DragArea.vue';
    import ElementPanel from './ElementPanel.vue';
    import { createElementUpdate } from '../../umlUtil.js';
    export default {
        props: ['initialData', 'umlid', 'theme', 'selectedElements'],
        data() {
            return {
                data: [],
                nullID: nullID()
            }
        },
        mounted() {
            for (const el of this.initialData) {
                this.data.push({
                    id: el.classifiers.ids().front()
                });
            }
        },
        methods: {
            async drop(dragInfo) {
                /**const applyingEl = await this.$umlWebClient.get(this.umlid);
                for (const stereotype of dragInfo.selectedElements) {
                    const profile = await stereotype.profile.get();
                    const profileModule = await generate(profile, this.$umlWebClient); // TODO expensive
                    const profileManager = new profileModule[profile.name + 'Manager'](TODO HAVE APILOCATION FOR GENERAL STEREOTYPES);
                    await profileManager.apply(applyingEl, stereotype);
                    this.data.push({
                        id: stereotype.id,
                    });
                }
                this.$emit('elementUpdate', createElementUpdate(applyingEl));**/
            },
            propogateSpecification(el) {
                this.$emit('specification', el);
            },
            propogateSelect(data) {
                this.$emit('select', data);
            },
            propogateDeselect(data) {
                this.$emit('deselect', data);
            }
        },
        components: { DragArea, ElementPanel }
    }
</script>
<template>
    <div class="stereotypeApplicatorContainer">
        <div style="min-width: 200px">
            Applied Stereotypes
        </div>
        <DragArea :readonly="false" :type="'Stereotype'" @drop="drop">
            <ElementPanel v-for="el in data"
                          :key="el.id"
                          :umlid="el.id"
                          :theme="theme"
                          :slected-elements="selectedElements"
                          @specification="propogateSpecification"
                          @select="propogateSelect"
                          @deselect="propogateDeselect">
            </ElementPanel>
            <ElementPanel v-if="data.length === 0"
                          :umlid="nullID"
                          :theme="theme"
                          :selected-elements="selectedElements">
                <!-- TODO select stereotype functionality-->
            </ElementPanel>
        </DragArea>
    </div>
</template>
<style>
.stereotypeApplicatorContainer {
    display: flex;
    padding-bottom: 10px;
}
</style>
