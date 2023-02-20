<script>
import  ContainmentTreePanel from './ContainmentTreePanel.vue'
export default {
    props: ['client'],
    data() {
        return {
            isFetching: true,
            head: undefined
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
            this.head = await this.client.head();
            this.isFetching = false;
        }
    }
}
</script>
<template>
    <div class="containmentTree">
        <ContainmentTreePanel v-if="!isFetching" :client="client" :el="head" :depth="0"></ContainmentTreePanel>
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
}
</style>