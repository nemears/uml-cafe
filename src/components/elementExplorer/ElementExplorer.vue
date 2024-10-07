<script>
    import ElementExplorerPanel from './ElementExplorerPanel.vue';
    import FilterSVG from '../../assets/icons/general/filter_symbol.svg';
    import SearchSVG from '../../assets/icons/general/search_symbol.svg';
    import { computed } from 'vue';
    import { NAMED_ELEMENT_ID } from 'uml-client/lib/modelIds';
    import { nullID } from 'uml-client/lib/types/element';
    export default {
        props: [
            'hidden',
            'theme',
            'selectedElements',
            'users',
            'newCommand',
            'newUndo',
            'treeGraph'
        ],
        emits: [
            'command',
            'focus',
            'select',
            'deselect',
            'diagram',
            'dragInfo',
            'elementUpdate'
        ],
        data() {
            return {
                filterSymbol: FilterSVG,
                searchSymbol: SearchSVG,
                isFetching: true,
                headID: undefined,
                treeUpdate: [],
                highlightedNodes: [],
            };
        },
        provide() {
            return {
                treeUpdate: computed(() => this.treeUpdate),
            }
        },
        watch: {
            reload() {
                this.getHeadFromServer();
            },
            newCommand(event) {
                const treeNode = this.treeGraph.get(event.element);
                let currNode = treeNode;
                const stack = [];
                while (currNode) {
                    currNode.expanded = true;
                    stack.unshift(currNode);
                    currNode = currNode.parent;
                }
                for (const stackCurrNode of stack) {
                    this.updateTree(stackCurrNode);
                } 
            },
            newUndo(undoneCommand) {
                // make sure the parent of the element is shown in the element explorer
                const treeNode = this.treeGraph.get(undoneCommand.element);
                let currNode = treeNode;
                // if (currNode) {
                //     currNode = currNode.parent;
                // }
                const stack = [];
                while (currNode) {
                    currNode.expanded = true;
                    stack.unshift(currNode);
                    currNode = currNode.parent;
                }
                for (const stackCurrNode of stack) {
                    this.updateTree(stackCurrNode);
                }
            }
        },
        mounted() {
            this.getHeadFromServer();
        },
        methods: {
            async getHeadFromServer() {
                this.isFetching = true;
                if (this.$umlWebClient.initialized) {
                    const head = await this.$umlWebClient.head();
                    this.headID = head.id;
                    const usersSelecting = [];
                    for (const user of this.users) {
                        if (user.selectedElements.includes(this.headID)) {
                            usersSelecting.unshift(user)
                        }
                    }
                    this.treeUpdate = [{
                        id: this.headID,
                        expanded: false,
                        children: {},
                        childOrder: [],
                        parent: undefined,
                        usersSelecting: usersSelecting,
                    }];
                    this.treeGraph.set(this.headID, this.treeUpdate[0]);
                    this.isFetching = false;
                }
            },
            updateTree(event) {
                const treeNode = this.treeGraph.get(event.id);
                if (!treeNode) {
                    throw Error('bad update emited by element explorer panel not being tracked of by App! ' + event.id);
                }
                const newTreeNode = {
                    id: event.id,
                    expanded: event.expanded,
                    childOrder: [],
                    children: {},
                    parent: treeNode.parent,
                    usersSelecting: treeNode.usersSelecting,
                };
                let it = event.childOrder;
                if (!it) {
                    it = event.children;
                }
                if (!it) {
                    throw Error('Bad state could not find valid children to iterate');
                }
                for (const id of it) {
                    const oldChildNode = treeNode.children[id];
                    if (oldChildNode) {
                        oldChildNode.parent = newTreeNode;
                        newTreeNode.children[id] = oldChildNode;
                        newTreeNode.childOrder.push(id);
                    } else {
                        const childNode = {
                            id: id,
                            expanded: false,
                            children: {},
                            childOrder: [],
                            parent: newTreeNode,
                            usersSelecting: [],
                        };
                        newTreeNode.children[id] = childNode;
                        newTreeNode.childOrder.push(id);
                        for (const user of this.users) {
                            for (const userSelectedID of user.selectedElements) {
                                if (id === userSelectedID) {
                                    childNode.usersSelecting.unshift(user);
                                }
                            }
                        }
                        this.treeGraph.set(id, childNode);
                    }
                }
                if (treeNode.parent) {
                    treeNode.parent.children[event.id] = newTreeNode;
                }

                this.treeGraph.set(event.id, newTreeNode);
                this.treeUpdate = [newTreeNode];
                if (newTreeNode.id === this.headID) {
                    this.rootofTree = newTreeNode;
                }
            },
            async search() {
                const searchVal = this.$refs.searchInput.value;
                if (searchVal.length === 0) {
                    return;
                } 
                                
                // search the model
                const matches = [];
                const queue = [await this.$umlWebClient.get(this.headID)];
                while (queue.length > 0) {
                    const front = queue.shift();
                    if (front.id === searchVal) {
                        matches.push(front);
                    }
                    if (front.is(NAMED_ELEMENT_ID)) {
                        if (front.name === searchVal) {
                            matches.push(front);
                        }
                    }
                    for await (const ownedEl of front.ownedElements) {
                        queue.push(ownedEl);
                    }
                }

                if (matches.length > 0) {
                    const elsToExpand = [];
                    for (const node of this.highlightedNodes) {
                        node.highlight = false;
                        elsToExpand.push(node);
                    }
                    const newHighlightedNodes = [];
                    
                    for (const match of matches) {
                        let treeMatch = this.treeGraph.get(match.id);
                        if (!treeMatch) {
                            let currEl = match;
                            let existingParentNode;
                            const elsToCreate = [];
                            elsToCreate.unshift(currEl);
                            while (!(existingParentNode = this.treeGraph.get(currEl.owner.id()))) {
                                currEl = await currEl.owner.get();
                                elsToCreate.unshift(currEl);
                            }
                            while (elsToCreate.length > 0) {
                                currEl = elsToCreate.shift();
                                const newTreeNode = {
                                    id: currEl.id,
                                    expanded: currEl.id !== match.id,
                                    children: {},
                                    childOrder: [],
                                    parent: existingParentNode,
                                    usersSelecting: [],
                                    highlight: currEl.id === match.id
                                };
                                const owner = await currEl.owner.get();
                                for (const id of owner.ownedElements.ids()) {
                                    let childNode;
                                    if (id === currEl.id) {
                                        childNode = newTreeNode;
                                    } else {
                                        childNode = {
                                            id: id,
                                            expanded: false,
                                            children: {},
                                            childOrder: [],
                                            parent: existingParentNode,
                                            usersSelecting: [],
                                            highlight: false
                                        };
                                    }
                                    if (!existingParentNode.children[id]) {
                                        existingParentNode.children[id] = childNode;
                                        existingParentNode.childOrder.push(id);
                                    }
                                    this.treeGraph.set(id, childNode);
                                }
                                this.treeGraph.set(currEl.id, newTreeNode);
                                existingParentNode = newTreeNode;
                                if (currEl.id === match.id) {
                                    treeMatch = newTreeNode;
                                }
                            }
                        } else {
                            treeMatch.highlight = true;
                        }

                        newHighlightedNodes.push(treeMatch);

                        elsToExpand.push(treeMatch);
                        treeMatch = treeMatch.parent;
                        while (treeMatch) {
                            treeMatch.expanded = true;
                            elsToExpand.unshift(treeMatch);
                            treeMatch = treeMatch.parent;
                        }
                    }
                    this.treeUpdate = elsToExpand;
                    this.highlightedNodes = newHighlightedNodes;
                }
            },
            focusSearchBar() {
                this.$refs.searchInput.select();
            },
            command(cmd) {
                this.$emit('command', cmd);
            },
            focus(data) {
                this.$emit('focus', data);
            },
            select(data) {
                this.$emit('select', data);
            },
            deselect(data) {
                this.$emit('deselect', data);
            },
            diagram(data) {
                this.$emit('diagram', data);
            },
            async dragInfo(info) {
                const draggedElements = [];
                for (const id of this.selectedElements) {
                    if (this.treeGraph.get(id)) {
                        draggedElements.push(await this.$umlWebClient.get(id));
                    } else {
                        // TODO
                        throw Error("dragging can only be handled from element explorer to other windows. Need to implement eventually!")
                    }
                }
                this.$emit('dragInfo', {
                    selectedElements: draggedElements,
                    event: info.event
                });
            },
            elementUpdateHandler(data) {
                this.$emit('elementUpdate', data);
            }
        },
        components: {
            ElementExplorerPanel
        }
    }
</script>
<template>
    <div class="elementExplorer" v-if="!hidden" draggable="false">
        <div style="display:flex;height: 30px;">
            <div style="flex: 2 0;display:flex;border: 2px solid var(--uml-cafe-light-light-1);border-radius: 5px;margin:3px;">
                <div style="flex: 1 0;display:flex;">
                    <input class="searchInput" 
                           :class="{
                                searchInputLight: theme === 'light',
                                searchInputDark: theme === 'dark',
                            }"
                           ref="searchInput"
                           @keyup.enter="search"
                           @focus="focusSearchBar">
                </div>
                <img    v-bind:src="searchSymbol" 
                        style="height:13px;flex: 0 1;margin-right:3px;margin-top:3px;"
                        @click="search"/>
            </div>
            <div style="flex: 0 1;border: 2px solid var(--uml-cafe-light-light-1);border-radius:5px;margin:3px;">
                <img v-bind:src="filterSymbol" style="height:13px;margin-left:3px;margin-right:3px;margin-bottom:1px;"/>
            </div>
        </div>
        <ElementExplorerPanel 
            v-if="!isFetching && headID !== undefined"
            :umlID="headID" 
            :depth="0"
            :selected-elements="selectedElements"
            :tree-graph="treeGraph"
            :theme="theme"
            @focus="focus" 
            @element-update="elementUpdateHandler" 
            @diagram="diagram"
            @draginfo="dragInfo"
            @select="select"
            @deselect="deselect"
            @update-tree="updateTree"
            @command="command"></ElementExplorerPanel>
    </div>
</template>
<style>
.elementExplorer{
	width: 300px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	overflow: auto;
	resize: horizontal; 
}
.searchInput{
    border: none;
    flex: 1 0;
}

.searchInputLight:focus {
    border: none;
    outline:none;
    /*background-color: var(--uml-cafe-light-dark);*/
}
.searchInputDark:focus {
    border: none;
    outline: none;
    background-color: var(--open-uml-selection-dark-1);
}
</style>
