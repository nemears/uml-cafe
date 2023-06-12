<script>
import closeSVG from '../icons/close_symbol.svg';
export default {
    props : ['header', 'toggle'],
    data() {
        return {
            closeSVG : closeSVG
        }
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
    <div class="popUpArea">
        <div>
            <div :style="closeButtonStyle" @click.stop="toggle">
                <img v-bind:src="closeSVG"/>
            </div>
            <h2>
                {{ header }}
            </h2>
        </div>
        <slot></slot>
    </div>
</template>
<style>
.popUpArea {
    overflow: auto;
    position: absolute;
    right: 25px;
    top: 25px;
    z-index: 1;
    background-color: var(--vt-c-black);
    display: block;
    padding: 5px;
    border: solid var(--vt-c-dark-soft);
    border-radius: 10px;
}
</style>