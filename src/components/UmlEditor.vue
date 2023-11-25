<script>
import CloseSymbol from './icons/close_symbol.svg';
import SpecificationPage from './SpecificationPage.vue';
import WelcomePage from './WelcomePage.vue';
import DiagramPage from './DiagramPage.vue';
export default {
    props: [
        "tabs",
        "specificationTab"
    ],
    inject: ['elementUpdate'],
    emits: ['specification', 'elementUpdate', 'closeTab'],
    data() {
        return {
            closeSymbol: CloseSymbol,
            welcome: false,
            specification: false,
            diagram: false,
            recentTab: ''
        };
    },
    mounted() {
        if (this.tabs.length > 0) {
            switch(this.tabs[0].type) {
                case 'Welcome': {
                    this.welcome = true;
                    break;
                }
                case 'Specification': {
                    this.specification = true;
                    break;
                }
                case 'Diagram': {
                    this.diagram = true;
                    break;
                }
            }
        }
    },
    watch: {
        recentTab(newRecentTab, oldRecentTab) {
            this.focus(newRecentTab);
        },
        specificationTab(newRecentTab, oldRecentTab) {
            this.recentTab = newRecentTab;
        },
        elementUpdate(newElementUpdate) {
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
                    const tab = this.tabs.find(tab => tab.id === newElement.id);
                    if (tab) {
                        if (newElement.isSubClassOf('namedElement')) {
                            if ((!newElement.name || newElement.name === '') && tab.label !== '< >') {
                                tab.label = '< >';
                            } else if (newElement.name !== tab.label) {
                                tab.label = newElement.name;
                            }
                        }
                    } 
                } 
            }
            
        }
    },
    methods: {
        remove(id) {
            const tabIndex = this.tabs.findIndex(tab => tab.id === id);
            const tab = this.tabs[tabIndex];
            this.tabs.splice(tabIndex , 1);
            if (tab.isActive) {
                if (tabIndex === 0) {
                    this.welcome = false;
                    this.specification = false;
                    this.diagram = false;
                }
                this.recentTab = this.tabs[tabIndex - 1].id;
            }
            this.$emit('closeTab', id);
        },
        focus(id) {
            for (let tab of this.tabs) {
                if (tab.id === id) {
                    tab.isActive = true;
                    this.welcome = false;
                    this.specification = false;
                    this.diagram = false;
                    if (tab.type === "Welcome") {
                        this.welcome = true;
                    } else if (tab.type === 'Specification') {
                        this.specification = true;
                    } else if (tab.type === 'Diagram') {
                        this.diagram = true;
                    }
                }
                else {
                    tab.isActive = false;
                }
            }
        },
        updateTab(id) {
            this.recentTab = id;
        },
        propogateSpecification(spec) {
            this.$emit('specification', spec);
        },
        propogateElementUpdate(newElementUpdate) {
            for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                if (newElement) {
                    const tabMatch = this.tabs.find((tab) => tab.id === newElement.id);
                    if (tabMatch) {
                        if (newElement.isSubClassOf('namedElement')) {
                            tabMatch.label = newElement.name;
                        }
                    }
                } 
            }
            

            this.$emit('elementUpdate', newElementUpdate);
        }
    },
    components: { WelcomePage, SpecificationPage, DiagramPage }
}
</script>
<template>
    <div class="umlEditor">
        <div class="tabContainer">
            <div v-for="tab in tabs" :key="tab.id" class="tab" :class="tab.isActive ? 'activeTab' : 'tab'" @click="updateTab(tab.id)">
                <img v-bind:src="tab.img" v-if="tab.img !== undefined" class="tabImage"/>
                <div style="float:left;padding:5px;">{{ tab.label }}</div>
                <img v-bind:src="closeSymbol" @click.stop="remove(tab.id)" style="padding:5px"/>
            </div>
        </div>
        <div class="activeEditor">
            <WelcomePage v-if="welcome"></WelcomePage>
            <SpecificationPage v-if="specification" 
                    :uml-i-d="recentTab" 
                    @specification="propogateSpecification" 
                    @element-update="propogateElementUpdate"
                    ></SpecificationPage>
            <DiagramPage v-if="diagram" 
                    :uml-i-d="recentTab" 
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    ></DiagramPage>
        </div>
    </div>
</template>
<style>
    .umlEditor {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    .tabContainer {
        float: left;
        background-color: var(--vt-c-black);
        float: 0 0 34px;
        overflow: hidden;
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
    .activeEditor {
        background-color: #2d3035;
        /* height: 100%; */
        clear:both;
        padding: 10px;
        flex: 1 1;
        overflow: hidden;
        display: flex;
    }
</style>
