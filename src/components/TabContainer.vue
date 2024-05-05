<script>
import { nullID } from 'uml-client/lib/element';
import CloseSymbol from '../assets/icons/general/close_symbol.svg';
import { assignTabLabel } from '../umlUtil';
import { nextTick } from 'vue';

    export default {
        props: ['focusTab','theme'],
        emits: ['tabSelected'],
        inject: ['elementUpdate'],
        data() {
            return {
                tabs: [this.focusTab],
                closeSymbol: CloseSymbol,
                totalTabWidth: 0,
                tabOffset: 0,
                dragOffset: 0,
                scrollInterval: undefined,
            }
        },
        mounted() {
            this.calculateTabBounds(this.tabs[0]);
            this.totalTabWidth += this.tabs[0].bounds.width;
        },
        watch: {
            async focusTab(tab) {
                if (this.focus(tab.id)) {
                    return;
                }
                
                if (this.tabs.length > 0) {
                    const lastTab = this.tabs.slice(-1)[0];
                    lastTab.nextTab = tab;
                    tab.previousTab = lastTab;
                }
                this.tabs.push(tab);
                this.updateTab(tab);

                await nextTick();

                // calculate total width
                this.calculateTabBounds(tab);
                this.totalTabWidth += tab.bounds.width;

                const tabContainerWidth = this.getTabContainerVisibleWidth();
                if (this.totalTabWidth > tabContainerWidth) {
                    this.tabOffset = this.totalTabWidth - tabContainerWidth;
                }
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
            calculateTabBounds(tab) {
                const tabDiv = this.$refs[tab.id][0];
                const tabBounds = tabDiv.getBoundingClientRect();
                tab.bounds = {
                    x: tabBounds.left,
                    y: tabBounds.top,
                    width: tabDiv.clientWidth,
                    height: tabDiv.clientHeight,
                };
                if (!tab.dragOffset) {
                    tab.dragOffset = 0;
                }
                if (!tab.swapOffset) {
                    tab.swapOffset = 0;
                }
            },
            updateTab(tab) {
                this.$emit('tabSelected', tab);
                tab.isActive = true;
            },
            getTabContainerVisibleWidth() {
                return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) - this.$refs.tabContainer.getBoundingClientRect().left;
            },
            focus(id) {
                let ret = false;
                let focusedTabOffset = 0;
                for (let tab of this.tabs) {
                    if (tab.id === id) {
                        this.updateTab(tab);
                        // make sure tab is within view!
                        if (this.tabOffset > focusedTabOffset) {
                            this.tabOffset = focusedTabOffset;
                        }
                        const tabContainerWidth = this.getTabContainerVisibleWidth();
                        if (focusedTabOffset > tabContainerWidth + this.tabOffset) {
                            this.tabOffset = focusedTabOffset - tabContainerWidth + this.$refs[tab.id][0].clientWidth;
                        }
                        ret = true;
                    } else {
                        if (tab.isActive) {
                            if (tab.type === 'diagram') {
                                document.addEventListener('keydown', this.keypress)
                            }
                        }
                        tab.isActive = false;
                        focusedTabOffset += this.$refs[tab.id][0].clientWidth;
                    }
                }
                return ret;
            },
            async remove(id) {
                const tabIndex = this.tabs.findIndex(tab => tab.id === id);
                const tab = this.tabs[tabIndex];
                const tabDiv = this.$refs[tab.id][0];
                this.totalTabWidth -= tabDiv.clientWidth;
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
            },
            scrollTabs(event) {
                const tabContainerWidth = this.getTabContainerVisibleWidth();
                if (this.totalTabWidth > tabContainerWidth && this.tabOffset >= 0 && tabContainerWidth + this.tabOffset <= this.totalTabWidth) {
                    const oldOffset = this.tabOffset;
                    const scrollValue = event.deltaY;
                    this.tabOffset += scrollValue;
                    if (this.tabOffset < 0) {
                        this.tabOffset = 0;
                    }
                    if (tabContainerWidth + this.tabOffset > this.totalTabWidth) {
                        this.tabOffset = this.totalTabWidth - tabContainerWidth;
                    }
                    return this.tabOffset - oldOffset;
                }
                return 0;
            },
            tabTransform(tab) {
                let val = this.tabOffset;
                if (tab.dragOffset) {
                    val += tab.dragOffset;
                }
                return 'translateX(' + (val * -1) + 'px)';
            },
            startDrag(event, tab) {
                tab.dragging = true;
                tab.clickX = event.x;
                tab.relativeOffset = 0;
                tab.tabsState = [...this.tabs];
            },
            async checkTabForSwap(tab) {
                // detect if we passed another tab and swap position
                if (tab.previousTab) {
                    if (tab.dragOffset - tab.swapOffset > tab.previousTab.bounds.width) {
                        tab.swapping = true;

                        tab.dragOffset = tab.swapOffset + tab.previousTab.bounds.width;
                        tab.swapOffset = tab.dragOffset;

                        const previousTab = tab.previousTab;

                        // adjust neighboring tab offset to make it look right
                        previousTab.dragOffset -= tab.bounds.width

                        // swap
                        const prevPrev = previousTab.previousTab;
                        previousTab.nextTab = tab.nextTab;
                        previousTab.previousTab = tab;
                        if (tab.nextTab) {
                            tab.nextTab.previousTab = previousTab;
                        }
                        tab.nextTab = previousTab;
                        tab.previousTab = prevPrev;
                        if (prevPrev) {
                            prevPrev.nextTab = tab;
                        }

                        const index = tab.tabsState.findIndex(curr => curr.id === tab.id);
                        tab.tabsState.splice(index, 1);
                        tab.tabsState.splice(index - 1, 0, tab);

                        this.dragOffset = 0;

                        await nextTick();

                        this.calculateTabBounds(tab);
                        this.calculateTabBounds(tab.nextTab);

                        tab.swapping = false;
                        return;
                    }
                }
                if (tab.nextTab) {
                    if (-1 * (tab.dragOffset - tab.swapOffset) > tab.nextTab.bounds.width) {
                        tab.swapping = true;

                        tab.dragOffset = tab.swapOffset - tab.nextTab.bounds.width;
                        tab.swapOffset = tab.dragOffset;

                        const nextTab = tab.nextTab;

                        // adjust neighboring tab offset to make it look right
                        nextTab.dragOffset += tab.bounds.width

                        // swap
                        const nextNext = nextTab.nextTab;
                        nextTab.previousTab = tab.previousTab;
                        nextTab.nextTab = tab;
                        if (tab.previousTab) {
                            tab.previousTab.nextTab = nextTab;
                        }
                        tab.previousTab = nextTab;
                        tab.nextTab = nextNext;
                        if (nextNext) {
                            nextNext.previousTab = tab;
                        }

                        const index = tab.tabsState.findIndex(curr => curr.id === tab.id);
                        tab.tabsState.splice(index, 1);
                        tab.tabsState.splice(index + 1, 0, tab);

                        this.dragOffset = 0;

                        await nextTick();

                        this.calculateTabBounds(tab);
                        this.calculateTabBounds(tab.previousTab);

                        tab.swapping = false;
                        return;
                    }
                }
            },
            async mousemove(event, tab) {
                if (tab.dragging && !tab.swapping) {
                    if (!tab.bounds) {
                        throw Error('Bad state!, tab must have bounds before being moved!');
                    }

                    // TODO trigger scroll if necessary
                    const containerX = this.$refs.tabContainer.getBoundingClientRect().left;
                    const containerWidth = this.getTabContainerVisibleWidth();
                    if (event.x < containerX + 25) {
                        if (this.scrollInterval) {
                            return;
                        }
                        // scroll left
                        const me = this;
                        this.scrollInterval = setInterval(() => {
                            const scrollVal = this.scrollTabs({ deltaY: -7 });
                            tab.dragOffset -= scrollVal;
                            tab.clickX -= scrollVal;
                            me.checkTabForSwap(tab);
                        }, 50);
                        return;
                    } else if (event.x > containerX + containerWidth - 25) {
                        if (this.scrollInterval) {
                            return;
                        }
                        const me = this;
                        this.scrollInterval = setInterval(() => {
                            const scrollVal = this.scrollTabs({ deltaY: 7 });
                            tab.dragOffset -= scrollVal;
                            tab.clickX -= scrollVal;
                            me.checkTabForSwap(tab);
                        }, 50);
                        return;
                    } else if (this.scrollInterval) {
                        clearInterval(this.scrollInterval);
                        this.scrollInterval = undefined;
                        return;
                    }

                    tab.dragOffset = tab.clickX - event.x;
                    this.dragOffset = tab.dragOffset;

                    await this.checkTabForSwap(tab);
                }
            },
            endDrag(tab) {
                if (tab.dragging) {
                    tab.dragging = false;
                    tab.swapOffset = 0;
                    delete tab.clickPoint;
                    this.dragOffset = 0;
                    for (const currTab of tab.tabsState) {
                        currTab.dragOffset = 0;
                    }
                    this.tabs = tab.tabsState;
                    delete tab.tabsState;
                    if (this.scrollInterval) {
                        clearInterval(this.scrollInterval);
                        this.scrollInterval = undefined;
                    }
                }
            }
        }
    }
</script>
<template>
    <div 
    class="tabContainer"
    ref="tabContainer"
    @wheel="scrollTabs">
        <div v-for="tab in tabs" 
            :key="tab.id" 
            class="tab" 
            :class="{
                activeTab: tab.isActive,
                activeTabLight : tab.isActive && theme === 'light',
                activeTabDark : tab.isActive && theme === 'dark',
                tabDark: !tab.isActive && theme === 'dark',
                tabLight: !tab.isActive && theme === 'light',
            }"
            :style="{transform: tabTransform(tab),'z-index': tab.dragging ? 1 : 0}"
            @click="focus(tab.id)"
            @mousedown="startDrag($event, tab)"
            @mousemove="mousemove($event, tab)"
            @mouseup="endDrag(tab)"
            @mouseleave="endDrag(tab)"
            :ref="tab.id">
            <img v-bind:src="tab.img" v-if="tab.img !== undefined" class="tabImage"/>
            <div style="float:left;padding:5px;">{{ tab.label }}</div>
            <img v-bind:src="closeSymbol" @click.stop="remove(tab.id)" style="padding:5px"/>
        </div>
    </div>
</template>
<style>
.tabContainer {
	overflow: hidden;
	flex: 1 0 auto;
	display: flex;
}
.tab {
	display: flex;
	align-items:center;
	float: left;
	-webkit-user-select: none; /* Safari */        
	-moz-user-select: none; /* Firefox */
	-ms-user-select: none; /* IE10+/Edge */
	user-select: none; /* Standard */
}
.tabDark {
    background-color: var(--vt-c-black-mute);
}
.tabDark:hover {
	background-color: var(--vt-c-dark-soft);
}
.tabLight {
    background-color: var(--uml-cafe-light-dark-2);
}
.tabLight:hover {
    background-color: var(--uml-cafe-light-dark-1);
}
.tabImage {
	padding-left: 5px;
    user-drag: none;
    -webkit-user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
}
.activeTab {
	vertical-align: middle;
	float: left;
}
.activeTabDark {
    background-color: #2d3035;
}
.activeTabDark:hover {
    background-color: #383c46;
}
.activeTabLight {
    background-color: var(--vt-c-white-soft);
}
.activeTabLight:hover {
    background-color: var(--vt-c-white-mute);
}
</style>