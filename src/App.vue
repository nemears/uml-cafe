<script setup>
import UmlBanner from './components/UmlBanner.vue'
import ContainmentTree from './components/ContainmentTree.vue'
import UmlEditor from './components/UmlEditor.vue'
</script>
<script>
// top level vue sets up client
export default {
  data() {
    return {
      // client: client
    }
  }
}
</script>
<template>
  <UmlBanner></UmlBanner>
  <div class="parent">
    <ContainmentTree></ContainmentTree>
    <UmlEditor></UmlEditor>
  </div>
</template>
<style>
.parent {
  height: 100%;
}
</style>
