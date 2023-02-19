<script setup>
import UmlBanner from './components/UmlBanner.vue'
import ContainmentTree from './components/ContainmentTree.vue'
import UmlClient from 'uml-js/lib/umlClient'
</script>
<script>
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
  <!-- <header>
    
  </header> -->
  <div class="main">
    <UmlBanner :client="client"></UmlBanner>
    <div class="parent">
      <ContainmentTree :client="client"></ContainmentTree>
      <div id="container"></div>
    </div>
  </div>
</template>

<style scoped>
html,
body,
#canvas,
#canvas > div {
    height: 100%;
    margin: 0;
}
.main {
  height: 100%;
  display: flex;
  flex-flow: column;
}
.parent {
    flex: 1 1 auto;
    width: 100%;
    display: flex;
    overflow: hidden;
    /* resize: both; */
}
#container {
    flex: 1 1 auto;
}
/* header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
    background-color: rgb(63, 97, 136);
  }
} */
</style>
