<script>
export default {
    props: ['elementType', 'theme'],
    data() {
        return {
            expanded: true
        }
    }
}
</script>
<template>
    <div :class="{
        elementTypeDarkDiv : theme === 'dark',
        elementTypeLightDiv : theme === 'light',
    }">
        <div @click="expanded = !expanded" class="elementTypeLabel">
            {{  elementType }}
        </div>
        <div class="elementTypeData" v-if="expanded">
            <slot></slot>
        </div>
    </div>
</template>
<style>
.elementTypeDarkDiv .elementTypeLightDiv {
    display: block;
    padding: 10px;
}
.elementTypeDarkDiv:hover {
    background-color: var(--uml-cafe-dark-mute);
}
.elementTypeLightDiv:hover {
    background-color: var(--uml-cafe-light-mute);
}
.elementTypeLabel {
    font-size: 30px;
}
.elementTypeData {
    padding-left: 10px;
    font-size: 18px;
}
</style>