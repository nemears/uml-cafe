<script setup>
import UmlBanner from './components/UmlBanner.vue'
import ContainmentTree from './components/ContainmentTree.vue'
import UmlClient from 'uml-js/lib/umlClient'
import UmlEditor from './components/UmlEditor.vue'
</script>
<script>
// top level vue sets up client
// TODO look into vue-router to share stuff
const client = new UmlClient();
export default {
  data() {
    return {
      client: client
    }
  }
}
</script>
<template>
  <UmlBanner :client="client"></UmlBanner>
  <div class="parent">
    <ContainmentTree :client="client"></ContainmentTree>
    <UmlEditor></UmlEditor>
  </div>
</template>
<style>
.parent {
  height: 100%;
}
</style>
