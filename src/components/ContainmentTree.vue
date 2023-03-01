<script>
import  ContainmentTreePanel from './ContainmentTreePanel.vue'
import UmlClient from 'uml-js/lib/umlClient'
export default {
    data() {
        return {
            isFetching: true,
            headID: undefined
        }
    },
    mounted() {
        this.getHeadFromServer();
    },
    components: { 
        ContainmentTreePanel
    },
    methods: {
        async getHeadFromServer() {
            const client = new UmlClient(this.$sessionName);
            const head = await client.head();
            this.headID = head.id;
            this.isFetching = false;
        }
    }
}
</script>
<template>
    <div class="containmentTree">
        <ContainmentTreePanel v-if="!isFetching && headID !== undefined" :umlID="headID" 
            :depth="0"></ContainmentTreePanel>
    </div>
</template>
<style>
.containmentTree{
    flex: 0 1 300px;
    background-color: #e7ecff;
    overflow: auto;
    white-space:nowrap;
    height: 100%;
    width: 300px;
    resize: horizontal;
}
</style>