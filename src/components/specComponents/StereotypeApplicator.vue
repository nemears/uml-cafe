<script>
    export default {
        props: ['umlid'],
        data() {
            return {
                data: [],
            }
        }
    }
</script>
<template>
    <div class="stereotypeApplicatorContainer">
        <div style="min-width: 200px">
            Stereotype Applications
        </div>
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
