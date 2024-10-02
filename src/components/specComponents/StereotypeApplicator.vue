<script>
    import { generate } from 'uml-client/lib/generate';
    import { nullID } from 'uml-client/lib/types/element';
    import DragArea from './DragArea.vue';
    import ElementPanel from './ElementPanel.vue';
    import { createElementUpdate } from '../../umlUtil.js';
    export default {
        props: ['initialData', 'umlid', 'theme', 'selectedElements'],
        emits: ['elementUpdate', 'specification'],
        data() {
            return {
                data: [],
                nullID: nullID()
            }
        },
        async mounted() {
            for (const id of this.initialData) {
                const el = await this.$umlWebClient.get(id);
                this.data.push({
                    id: el.classifiers.ids().front()
                });
            }
        },
        methods: {
            async drop(dragInfo) {
                const applyingEl = await this.$umlWebClient.get(this.umlid);
                let elStereotyped = applyingEl;
                for (const stereotype of dragInfo.selectedElements) {
                    elStereotyped = await this.$umlCafeModule.metaClient.apply(elStereotyped, stereotype);
                    this.data.push({
                        id: stereotype.id,
                    });
                }
                this.$umlWebClient.put(applyingEl);
                await this.$umlCafeModule.metaClient.put(elStereotyped);
                this.$emit('elementUpdate', createElementUpdate(applyingEl));
            },
            async contextMenu(data) {
                const evt = data.evt;
                const el = data.el;
                let items = [];
                let element = await this.$umlWebClient.get(el.id);
                items.push({
                    label: 'Specification',
                    onClick: () => {
                        this.$emit('specification', element);
                    }
                });
                items.push({
                    label: 'Remove Stereotype',
                    disabled: this.$umlWebClient.readonly,
                    onClick: async () => {
                        const me = await this.$umlWebClient.get(this.umlid);
                        let stereotypeInstance;
                        for await (const inst of me.appliedStereotypes) {
                            if (inst.classifiers.contains(element)) {
                                stereotypeInstance = inst;
                                break;
                            }
                        }
                        await this.$umlCafeModule.metaClient.remove(me, stereotypeInstance);
                        this.$emit('elementUpdate', createElementUpdate(me));
                        const newData = [];
                        for await (const inst of me.appliedStereotypes) {
                            newData.push({ id: inst.classifiers.ids().front() });
                        }
                        this.data = newData;
                    }
                });

                //show our menu
                this.$contextmenu({
                    x: evt.x,
                    y: evt.y,
                    items: items,
                    theme: 'flat'
                });
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
                          @deselect="propogateDeselect"
                          @menu="contextMenu">
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
