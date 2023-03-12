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
    padding: 10px;
}
.elementTypeDiv:hover {
    background-color: #34383f;
}
.elementTypeLabel {
    font-size: 30px;
}
.elementTypeData {
    padding-left: 10px;
    font-size: 18px;
}
</style>