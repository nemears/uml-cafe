<script>
import closeSVG from '../../assets/icons/general/close_symbol.svg';
export default {
    props: ['label', 'toggle', 'theme'],
    data() {
        return {
            closeSVG: closeSVG,
            isMounted: false
        }
    },
    mounted() {
        this.isMounted = true;
    },
    computed: {
        closeButtonStyle() {
            return {
                float: "right",
                "z-index": 1,
                'pointer-events': 'all'
            };
        }
    }
}
</script>
<template>
    <div class="freezeBackGround">
        <div    class="selectionWindow"
                :class="{
                    selectionDark : theme === 'dark',
                    selectionLight : theme === 'light',
                }">
            <div class="popUpHeader">
                <div :style="closeButtonStyle" @click.stop="toggle">
                    <img v-bind:src="closeSVG"/>
                </div>
                <h1>
                    {{ label }}
                </h1>
            </div>
            <div class="popUpDisplayBox">
                <slot></slot>
            </div>
        </div>
    </div>
</template>
<style>
.freezeBackGround {
    position: absolute;
    height: 100vh;
    width: 100vw;
    /* opacity: 0.8; */
    background-color: rgba(45, 48, 53, 0.5);
    z-index: 5;
}
.selectionWindow {
    max-height: 80vh;
    width: 50vw;
    left: 25vw;
    top: 10vh;
    z-index: 5;
    background-color: var(--vt-c-black);
    border: solid 2px;
    border-color: var(--vt-c-dark-soft);
    padding: 5px;
    display: flex;
    flex-direction: column;
}
.selectionDark {
    background-color: var(--vt-c-black);
    border-color: var(--vt-c-dark-soft);
}
.selectionLight {
    background-color: var(--uml-cafe-light-dark);
    border-color: var(--vt-c-divider-light-1);
    color: var(--vt-c-dark-dark);
}
.popUpHeader {
    padding: 10px;
    flex: 0 1 auto;
}
.popUpDisplayBox {
    padding: 10px;
    overflow-y: auto;
    flex: 1 1 auto;
}
</style>
