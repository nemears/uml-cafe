<script>
import { randomID } from 'uml-js/lib/element'
export default {
    props: [
        'client',
        'el'
    ],
    mounted() {
        this.populateDisplayInfo();
    },
    data() {
        return {
            name: '',
            id: randomID(),
            children: []
        }
    },
    methods: {
        populateDisplayInfo() {
            this.name = this.el.name;
            this.id = this.el.id;
        }
    }
}
</script>
<template>
    <div class="containmentTreeBlock">
        <div class="containmentTreePanel">
            TODO SVG {{ name }}
        </div>
    </div>
</template>
<style>

</style>