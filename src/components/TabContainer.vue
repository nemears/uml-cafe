<script>
import { nullID } from 'uml-client/lib/element';
import CloseSymbol from '../assets/icons/general/close_symbol.svg';
import { assignTabLabel } from '../umlUtil';

    export default {
        props: ['focusTab'],
        emits: ['tabSelected'],
        inject: ['elementUpdate'],
        data() {
            return {
                tabs: [],
                closeSymbol: CloseSymbol,
            }
        },
        mounted() {
            this.tabs.push(this.focusTab);
        },
        watch: {
            focusTab(tab) {
                if (this.focus(tab.id)) {
                    return;
                }
                this.tabs.push(tab);
                this.updateTab(tab);
            },
            async elementUpdate(newElementUpdate) {
                for (const update of newElementUpdate.updatedElements) {
                    const newElement = update.newElement;
                    const oldElement = update.oldElement;
                    if (!newElement) {
                        // element has been deleted, lets check if it is a tab
                        const tab = this.tabs.find(tab => tab.id === oldElement.id);
                        if (tab) {
                            this.remove(tab.id);
                        }
                    } else {
                        // handle tab labels
                        const tab = this.tabs.find(tab => tab.id === newElement.id);
                        if (tab) {
                            tab.label = await assignTabLabel(newElement);
                        }
                        for (let tab of this.tabs) {
                            if (tab.type === 'Welcome') {
                                continue;
                            }
                            const elTab = await this.$umlWebClient.get(tab.id);
                            if (elTab && elTab.isSubClassOf('comment')) {
                                for await (let el of elTab.annotatedElements) {
                                    if (el.id === newElement.id) {
                                        tab.label = await assignTabLabel(elTab);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        methods: {
            updateTab(tab) {
                this.$emit('tabSelected', tab);
                tab.isActive = true;
            },
            focus(id) {
                let ret = false;
                for (let tab of this.tabs) {
                    if (tab.id === id) {
                        this.updateTab(tab);
                        ret = true;
                    } else {
                        if (tab.isActive) {
                            if (tab.type === 'diagram') {
                                document.addEventListener('keydown', this.keypress)
                            }
                        }
                        tab.isActive = false;
                    }
                }
                return ret;
            },
            remove(id) {
                const tabIndex = this.tabs.findIndex(tab => tab.id === id);
                const tab = this.tabs[tabIndex];
                this.tabs.splice(tabIndex , 1);
                if (tab.isActive) {
                    if (this.tabs.length > 0) {
                        this.specificationTab = this.tabs[tabIndex - 1].id;
                        this.focus(this.specificationTab);
                    } else {
                        this.updateTab({
                            id: nullID()
                        });
                    }
                }
            }
        }
    }
</script>
<template>
    <div class="tabContainer">
        <div v-for="tab in tabs" 
            :key="tab.id" 
            class="tab" 
            :class="tab.isActive ? 'activeTab' : 'tab'" 
            @click="focus(tab.id)">
            <img v-bind:src="tab.img" v-if="tab.img !== undefined" class="tabImage"/>
            <div style="float:left;padding:5px;">{{ tab.label }}</div>
            <img v-bind:src="closeSymbol" @click.stop="remove(tab.id)" style="padding:5px"/>
        </div>
    </div>
</template>
<style>
.tabContainer {
	background-color: var(--vt-c-black);
	overflow: hidden;
	flex: 1 0 auto;
	display: flex;
}
.tab {
	display: flex;
	align-items:center;
	float: left;
	background-color: var(--vt-c-dark-dark);
	-webkit-user-select: none; /* Safari */        
	-moz-user-select: none; /* Firefox */
	-ms-user-select: none; /* IE10+/Edge */
	user-select: none; /* Standard */
}
.tabImage {
	padding-left: 5px;
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
	background-color: var(--vt-c-dark-soft);
}
</style>