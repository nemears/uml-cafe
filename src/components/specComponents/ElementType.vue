<script>
export default {
    props: ['elementType'],
    data() {
        return {
            expanded: true
        }
    }
}
</script>
<template>
    <div class="elementTypeDiv">
        <div @click="expanded = !expanded" class="elementTypeLabel">
            {{  elementType }}
        </div>
        <div class="elementTypeData" v-if="expanded">
            <slot></slot>
        </div>
    </div>
</template>
<style>
.elementTypeDiv {
    display: block;
    border: solid #525258;
    border-width: 2px;
    padding: 10px;
}
.elementTypeLabel {
    font-size: 30px;
}
.elementTypeData {
    padding-left: 10px;
    font-size: 18px;
}
</style>