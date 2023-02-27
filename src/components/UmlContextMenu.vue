<script>
export default {
    props: ['menu'],
    data() {
        return {

        }
    },
    computed: {
        // get position of context menu
        style() {
            return {
                top: this.menu.top + 'px',
                left: this.menu.left + 'px',
            };
        },
    }
}
</script>
<template>
    <div class="umlContextMenu" :style="style">
        <slot></slot>
    </div>
</template>
<style>
.umlContextMenu {
    z-index: 1000;
    position: fixed;
    overflow: hidden;
    border: 1px solid #CCC;
    white-space: nowrap;
    font-family: system-ui;
    background: #FFF;
    color: #333;
    border-radius: 5px;
    padding: 0;
}
/* .containmentTreeMenuOption {
    padding: 8px 12px;
    cursor: pointer;
    list-style-type: none;
    transition: all .3s ease;
    user-select: none;
}
.containmentTreeMenuOption:hover {
    background-color: #DEF;
} */
</style>