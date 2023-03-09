<script setup>
import UmlBanner from './components/UmlBanner.vue'
import ContainmentTreePanel from './components/ContainmentTreePanel.vue'
import UmlEditor from './components/UmlEditor.vue'
import UmlClient from 'uml-js/lib/umlClient'
</script>
<script>
// top level vue sets up client
export default {
  data() {
    return {
      headID: '',
      isFetching: true
    }
  },
  mounted() {
    this.getHeadFromServer();
  },
  methods: {
    async getHeadFromServer() {
      this.isFetching = true;
      const client = new UmlClient(this.$sessionName);
      const head = await client.head();
      this.headID = head.id;
      this.isFetching = false;
    }
  }
}
</script>
<template>
  <UmlBanner @new-model-loaded="getHeadFromServer"></UmlBanner>
  <div class="parent">
    <div class="containmentTree">
        <ContainmentTreePanel v-if="!isFetching && headID !== undefined" :umlID="headID" 
            :depth="0"></ContainmentTreePanel>
    </div>
    <UmlEditor></UmlEditor>
  </div>
</template>
<style>
.parent {
  height: 100%;
}
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
