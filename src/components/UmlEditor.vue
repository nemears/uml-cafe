<script>
import CloseSymbol from './icons/close_symbol.svg';
export default {
    props: [
        'tabs'
    ],
    data() {
        return {
            closeSymbol: CloseSymbol,
            focusedTab: ''
        }
    },
    mounted() {
        if (this.tabs.length > 0) {
            this.focusedTab = this.tabs[0].id;
        }
    },
    methods: {
        remove(id) {
            this.tabs.splice(this.tabs.findIndex(tab => tab.id === id), 1);
        },
        focus(id) {
            for (let tab of this.tabs) {
                if (tab.id === id) {
                    tab.isActive = true;
                } else {
                    tab.isActive = false;
                } 
            }
        }
    }
}
</script>
<template>
    <div class="umlEditor">
        <div class="tabContainer">
            <div v-for="tab in tabs" :key="tab.id" class="tab" :class="tab.isActive ? 'activeTab' : 'tab'" @click="focus(tab.id)">
                <div style="float:left;padding:5px;">{{ tab.label }}</div>
                <img v-bind:src="closeSymbol" @click.stop="remove(tab.id)" style="padding:5px"/>
            </div>
        </div>
        <div class="activeEditor"></div>
    </div>
</template>
<style>
    .umlEditor {
        flex: 1 1 auto;
        display: block;
    }
    .tabContainer {
        float: left;
        width: 100%;
        background-color: #131416;
    }
    .tab {
        display: flex;
        align-items:center;
        color: azure;
        float: left;
        background-color: #464952;
    }
    .activeTab {
        vertical-align: middle;
        float: left;
        background-color: #2d3035;
    }
    .activeTab:hover {
        background-color: #383c46;
    }
    .tab:hover {
        background-color: rgb(89, 94, 109);
    }
    .activeEditor {
        background-color: #2d3035;
        height: 100%;
        clear:both;
    }
</style>