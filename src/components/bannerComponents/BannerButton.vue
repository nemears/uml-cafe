<script>
export default {
    props: ['label','theme'],
    emits: ['buttonClicked'],
    methods: {
        buttonClicked() {
            this.$emit('buttonClicked');
        },
    }
}
</script>
<template>
     <button 
            type="button" 
            class="buttonStyle"
            :class="{
                buttonLight : theme === 'light',
                buttonDark : theme === 'dark',
            }"
            @click="buttonClicked"> {{ label }} </button> 
</template>
<style>
.buttonStyle {
    padding: 10px;
    overflow-y: auto;
    flex: 0 1 auto;
    border: none;
    /* border-color: var(--color-border); */
    background-color: var(--open-uml-selection-dark-1);
    color: var(--vt-c-text-light-1);
}
.buttonLight {
    /* border-color: var(--vt-c-divider-light-1); */
    background-color: var(--uml-cafe-light-light-1);
    color: var(--vt-c-dark-dark);
}
.buttonLight:hover {
    background-color: var(--uml-cafe-light-light-2);
}
.buttonDark {
    border-color: var(--color-border);
    background-color: var(--open-uml-selection-dark-1);
    color: var(--vt-c-text-light-1);
}
.buttonDark:hover {
    background-color: var(--vt-c-dark-soft);
}
</style>
