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
      isFetching: true,
      tabs : [
        {
          label: 'Welcome!',
          id: 'VQvHG72Z_FjNQlEeeFEcrX1v6RRy',
          isActive: true,
          type: 'Welcome'
        }
      ],
      specificationTab: ''
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
    },
    specification(el) {
      if (this.tabs.find(tab => tab.id === el.id)) { // no duplicates
        return;
      }
      for (let tab of this.tabs) {
        tab.isActive = false;
      }
      this.tabs.push({
        label: el.name !== undefined && el.name !== '' ? el.name : el.id,
        id: el.id,
        isActive: true,
        type: 'Specification'
      });
      this.specificationTab = el.id;
    }
  }
}
</script>
<template>
  <UmlBanner @new-model-loaded="getHeadFromServer"></UmlBanner>
  <div class="parent">
    <div>
      <div style="height:34px;background-color: #131416;"></div>
      <div class="containmentTree">
          <ContainmentTreePanel v-if="!isFetching && headID !== undefined" :umlID="headID" 
              :depth="0" @specification="specification"></ContainmentTreePanel>
      </div>
    </div>
    <UmlEditor :tabs="tabs" :specificationTab="specificationTab"></UmlEditor>
  </div>
</template>
<style>
.parent {
  flex: 1 1 auto;
  width: 100%;
  display: flex;
  overflow: hidden;
}
.containmentTree{
    flex: 0 1 300px;
    color: azure;
    background-color: #2d3035;
    overflow: scroll;
    white-space:nowrap;
    height: 100%;
    width: 300px;
    resize: horizontal;
}
</style>
