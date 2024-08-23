<script>
    import { generate } from 'uml-client/lib/generate';
    import DragArea from './DragArea.vue';
    import getImage from '../../GetUmlImage.vue';
    import { createElementUpdate } from '../../umlUtil.js';
    export default {
        props: ['umlid'],
        data() {
            return {
                data: [],
            }
        },
        methods: {
            async drop(dragInfo) {
                const applyingEl = await this.$umlWebClient.get(this.umlid);
                for (const stereotype of dragInfo.selectedElements) {
                    const profile = await stereotype.profle.get();
                    const profileModule = await generate(profile, this.$umlWebClient); // TODO expensive
                    const profileManager = profileModule[profile.name + 'Manager'];
                    await profileManager.apply(applyingEl, stereotype);
                    this.data.push({
                        id: stereotype.id,
                        img: getImage(stereotype)
                    });
                }
                this.$emit('elementUpdate', createElementUpdate(applyingEl));
                // throw Error('TODO');
            }
        },
        components: { DragArea }
    }
</script>
<template>
    <div class="stereotypeApplicatorContainer">
        <div style="min-width: 200px">
            Stereotype Applications
        </div>
        <DragArea :readonly="false" :type="Stereotype" @drop="drop">
            <div
                v-for="el in data"
                :key="el.id">
                <img v-if="el.img !== undefined" :src="el.img"/>
                <div>
                    {{ el.label }}
                </div>
            </div>
        </DragArea>
        <div>
        </div>
    </div>
</template>
<style>
.stereotypeApplicatorContainer {
    display: flex;
    padding-bottom: 10px;
}
</style>
