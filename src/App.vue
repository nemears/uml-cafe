<script setup>
import UmlBanner from './components/UmlBanner.vue';
import ElementExplorer from './components/ElementExplorer.vue';
import SpecificationPage from './components/SpecificationPage.vue';
import WelcomePage from './components/WelcomePage.vue';
import DiagramPage from './components/DiagramPage.vue';
import CloseSymbol from './components/icons/close_symbol.svg';
import getImage from './GetUmlImage.vue';
import classDiagramImage from './components/icons/class_diagram.svg';
import { nullID } from 'uml-client/lib/element.js';
import { computed } from 'vue';
import { assignTabLabel } from './umlUtil';
</script>
<script>
export default {
	data() {
		return {
			closeSymbol: CloseSymbol,
			headID: '',
			isFetching: true,
			tabs : [
				{
					label: 'Welcome!',
					id: 'VQvHG72Z_FjNQlEeeFEcrX1v6RRy',
					isActive: true,
					type: 'Welcome'
				}
			],
			specificationTab: 'VQvHG72Z_FjNQlEeeFEcrX1v6RRy',
			recentDraginfo: {
				id: nullID(),
				element: 'element',
			},
            elementUpdate: [],
            autosaving: false,
			elementExplorerHide: false,
			elementExplorerButtonTitle: 'Collapse',
			editorType: 'Welcome',
            selectedElements: [],
            treeUpdate: undefined,
            treeGraph: new Map(),
			users: [],
			userSelected: undefined,
			userDeselected: undefined,
		}
	},
	provide() {
		return {
			draginfo: computed(() => this.recentDraginfo),
            elementUpdate: computed(() => this.elementUpdate),
            treeUpdate: computed(() => this.treeUpdate),
			userSelected: computed(() => this.userSelected),
			userDeselected: computed(() => this.userDeselected),
		}
	},
	mounted() {
		// add ourselves as a user
		const userList = [];
		userList.push({
			id: this.$umlWebClient.id,
			color: 'var(--uml-cafe-selected)', // user is always blue
			selectedElements: [],
		});
		const colorMap = new Map();
		colorMap.set('Red', 'var(--uml-cafe-red-user)');
		colorMap.set('Blue', 'var(--uml-cafe-blue-user)');
		colorMap.set('Green', 'var(--uml-cafe-green-user)');
		colorMap.set('Yellow', 'var(--uml-cafe-yellow-user)');
		colorMap.set('Magenta', 'var(--uml-cafe-magenta-user)');
		colorMap.set('Orange', 'var(--uml-cafe-orange-user)');
		colorMap.set('Cyan', 'var(--uml-cafe-cyan-user)');
		colorMap.set('Lime', 'var(--uml-cafe-lime-user)');

		// add other users as well
		this.$umlWebClient.otherClients.forEach((client, id) => {
			userList.push({
				id: id,
				color: colorMap.get(client.color),
				selectedElements: Array.from(client.selectedElements), //hopefully ?
			});
		});

		this.$umlWebClient.onUpdate = async (element, oldElement) => {
            this.elementUpdate = {
                updatedElements: [
                    {
                        newElement: element,
                        oldElement: oldElement,
                    }
                ]
            };
		}
		this.$umlWebClient.onClient = (client) => {
			this.users.push({
				id: client.id,
				color: colorMap.get(client.color),
				selectedElements: [],
			});
		}

		this.users = userList;

		this.getHeadFromServer();

		this.$umlWebClient.onDropClient = (clientID) => {
			this.users.splice(this.users.findIndex(user => user.id === clientID), 1);
		}

		// handle other users selecting elements
		this.$umlWebClient.onSelect = (event) => {
			const user = this.users.find(el => el.id === event.client);
			if (!user) {
				throw Error("bad state, not tracking client that selection was made by!");
			}
			if (!user.selectedElements.includes(event.id)) {
				user.selectedElements.push(event.id);
				const treeNode = this.treeGraph.get(event.id);
				if (treeNode) {
					treeNode.usersSelecting.unshift(user);
				}
				this.userSelected = {
					id: event.id,
					color: user.color
				}
			}
		}

		this.$umlWebClient.onDeselect = (event) => {
			const user = this.users.find(el => el.id === event.client);
			if (!user) {
				throw Error("bad state, not tracking client that selection was made by!");
			}
			const index = user.selectedElements.indexOf(event.id);
			if (index >= 0) {
				user.selectedElements.splice(index, 1);
				const treeNode = this.treeGraph.get(event.id);
				if (treeNode) {
					const userIndex = treeNode.usersSelecting.findIndex(user => user.id === event.client);
					if (userIndex >= 0) {
						treeNode.usersSelecting.splice(userIndex, 1);
					}
				}
				this.userDeselected = {
					id: event.id,
					color: user.color
				};
			}
		}

        setInterval(() => {
            this.$umlWebClient.save();
            this.autosaving = true;
            setTimeout(() => {
                this.autosaving = false;
            }, 5000);
        }, 180000);
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
                this.treeUpdate = {
                    id: this.headID,
                    expanded: false,
                    children: {},
                    childOrder: [],
                    parent: undefined,
					usersSelecting: usersSelecting,
                };
                this.treeGraph.set(this.headID, this.treeUpdate);
				this.isFetching = false;
			}
		},
		async specification(el) {
			if (this.tabs.find(tab => tab.id === el.id)) { // no duplicates
				this.specificationTab = el.id;
				return;
			}
			for (let tab of this.tabs) {
				tab.isActive = false;
			}
			this.tabs.push({
				label: await assignTabLabel(el),
				id: el.id,
				isActive: true,
				type: 'Specification',
				img: getImage(el)
			});
			this.specificationTab = el.id;
			this.focus(this.specificationTab);
		},
        async elementUpdateHandler(newElementUpdate) {
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

                    // helper function
                    const createTreeNode = (treeNode, id) => {
                        const newTreeNode = {
                            id: id,
                            childOrder: [],
                            children: {},
                            expanded: false,
                            parent: treeNode,
                        };
                        this.treeGraph.set(id, newTreeNode);

                        // just add new owned element to back of children
                        treeNode.childOrder.push(id);
                        treeNode.children[id] = newTreeNode; 
                    }

                    // check to see if there was an element that needs be tracked in the tree
                    const treeNode = this.treeGraph.get(newElement.id);
                    if (treeNode) {
                        // update children
                        // may be a different order we want in the future
                        for (const ownedElementID of newElement.ownedElements.ids()) {
                            if (!treeNode.childOrder.includes(ownedElementID)) {
                                createTreeNode(treeNode, ownedElementID);
                            }
                        }
                    }
                    
                    // check to see if owner is an element that is being tracked
                    if (newElement.owner.has()) {
                        const ownerTreeNode = this.treeGraph.get(newElement.owner.id());
                        if (ownerTreeNode && !ownerTreeNode.childOrder.includes(newElement.id)) {
                            createTreeNode(ownerTreeNode, newElement.id);
                        }
                    }
                } 
            }
            this.elementUpdate = newElementUpdate;
        },
		diagram(diagramClass) {
			if (this.tabs.find(tab => tab.id === diagramClass.id)) { // no duplicates
				this.specificationTab = diagramClass.id;
				this.focus(this.specificationTab);
				return;
			}
			for (let tab of this.tabs) {
				tab.isActive = false;
			}
			this.tabs.push({
				label: diagramClass.name !== undefined && diagramClass.name !== '' ? diagramClass.name : diagramClass.id,
				id: diagramClass.id,
				isActive: true,
				type: 'Diagram',
				img: classDiagramImage
			});
			if (this.specificationTab === diagramClass.id) {
				throw new Error('huuh? App.vue');
			} else {
				this.specificationTab = diagramClass.id;
				this.focus(this.specificationTab);
			}
		},
		dragInfo(draginfo) {
			this.recentDraginfo = draginfo;
		},
		closeTab(id) {
			if (this.specificationTab === id) {
				this.specificationTab = this.tabs[this.tabs.length - 1].id;
			}
		},
		ElementExplorerCollapse() {
			this.elementExplorerHide = !this.elementExplorerHide;
			if (this.elementExplorerHide) {
				this.elementExplorerButtonTitle = 'Expand Element Explorer'
			} else if (!this.elementExplorerHide) {
				this.elementExplorerButtonTitle = 'Collapse'
			}
		},
		updateTab(id) {
            this.specificationTab = id;
			this.focus(id);
        },
		focus(id) {
            for (let tab of this.tabs) {
                if (tab.id === id) {
                    tab.isActive = true;
					this.editorType = tab.type;
                }
                else {
                    tab.isActive = false;
                }
            }
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
					this.editorType = undefined;
					this.specificationTab = undefined;
				}
            }
        },
        shiftClickAction(event, fn) {
            const lastSelectedNode = this.treeGraph.get(this.selectedElements.slice(-1)[0]);
            if (lastSelectedNode) {
                const selectedNode = this.treeGraph.get(event.el);
                const selectedNodeParents = [selectedNode.id];
                let currNode = selectedNode;
                while (currNode.parent) {
                    const parent = currNode.parent;
                    selectedNodeParents.push(parent.id);
                    currNode = parent;
                }
                if (selectedNodeParents.includes(lastSelectedNode)) {
                    // select children until we hit selected node
                    for (const child of lastSelectedNode.childOrder) {
                        if (child === event.el) {
                            break;
                        }
                        if (!this.selectedElements.includes(child)) {
                            this.selectedElements.push(child);
                            // TODO add dfs
                        }
                    }
                } else {
                    let closestParent = undefined;
                    currNode = lastSelectedNode;
                    do {
                        if (selectedNodeParents.includes(currNode.id)) {
                            closestParent = currNode;
                            break;
                        }
                        currNode = currNode.parent;
                    } while (currNode);
                    if (!closestParent) {
                        throw Error('Bad state for shift click select, could not find valid parent between last two elements!');
                    }
                    // dfs search for selectedNode or lastSelectedNode to find direction to select
                    const selectBetween = (topElement, bottomElement) => {
                        let hitBottom = false;
                        let currNode = topElement;
                        if (currNode.expanded && currNode.childOrder.length > 0) {
                            currNode = currNode.children[currNode.childOrder[0]];
                        } else {
                            currNode = currNode.parent.children[currNode.parent.childOrder[currNode.parent.childOrder.indexOf(currNode.id) + 1]];
                        }
                        while (!hitBottom) {
                            for (let i = currNode.parent.childOrder.indexOf(currNode.id); i < currNode.parent.childOrder.length; i++) {
                                // select dfs until we hit bottom element
                                const childNode = currNode.parent.children[currNode.parent.childOrder[i]];
                                if (!childNode) {
                                    throw Error('bad state for shift select');
                                }
                                if (childNode.id === bottomElement.id) {
                                    hitBottom = true;
                                    break;
                                }
                                //fn(childNode.id);
                                const stack = [childNode];
                                while (stack.length > 0) {
                                    const front = stack.shift();
                                    if (front.id === bottomElement.id) {
                                        hitBottom = true;
                                        break;
                                    }
                                    fn(front.id);
                                    if (front.expanded) {
                                        for (const frontChild of [...front.childOrder].reverse()) {
                                            stack.unshift(front.children[frontChild]);
                                        }
                                    }
                                }
                                if (hitBottom) {
                                    break;
                                }
                            }
                            if (!hitBottom) {
                                currNode = currNode.parent;
                                if (!currNode.parent) {
                                    throw Error('bad state for shift select!');
                                }
                                while (currNode.parent.childOrder.indexOf(currNode.id) === currNode.parent.childOrder.length - 1) {
                                    currNode = currNode.parent;
                                }
                                currNode = currNode.parent.children[currNode.parent.childOrder[currNode.parent.childOrder.indexOf(currNode.id) + 1]];
                            }
                        }
                    }; 
                    const stack = [closestParent];
                    while (stack.length > 0) {
                        const front = stack.shift();
                        
                        if (front.id === event.el) {
                            // select from selectedNode "down" until we hit lastSelectedNode
                            selectBetween(selectedNode, lastSelectedNode);
                            break;
                        } else if (front.id === lastSelectedNode.id) {
                            // select from selectedNod "up" until we hit lastSelectedNode
                            selectBetween(lastSelectedNode, selectedNode);
                            break;
                        }
                        if (front.expanded) {
                            for (const child of [...front.childOrder].reverse()) {
                                    stack.unshift(front.children[child]);
                            }
                        }
                    }
                }
                
            }
            fn(event.el);
        },
        select(event) {
            if (event.modifier === 'none') {
                // clear list
                for (const id of this.selectedElements) {
                    this.$umlWebClient.deselect(id);
                }
                this.selectedElements = [event.el];
                this.$umlWebClient.select(event.el);
            } else if (event.modifier === 'shift') {
                this.shiftClickAction(event, (id) => {
                    if (!this.selectedElements.includes(id)) {
                        this.selectedElements.push(id);
                        this.$umlWebClient.select(id);
                    }
                });
                this.selectedElements = [...this.selectedElements];
            } else {
                this.selectedElements.push(event.el);
                this.$umlWebClient.select(event.el);
            }
        },
        deselect(event) {
            if (event.modifier === 'none') {
                for (const id of this.selectedElements) {
                    this.$umlWebClient.deselect(id);
                }
                this.selectedElements = [];
            } else if (event.modifier === 'ctrl') {
                const index = this.selectedElements.indexOf(event.el); 
                if (index === -1) {
                    console.warn('bad el given to deselect');
                } else {
                    this.selectedElements.splice(index, 1);
                    this.$umlWebClient.deselect(event.el);
                }
            } else if (event.modifier === 'shift') {
                this.shiftClickAction(event, (id) => {
                    const index = this.selectedElements.indexOf(id); 
                    if (index === -1) {
                        console.warn('bad el given to deselect');
                    } else {
                        this.selectedElements.splice(index, 1);
                        this.$umlWebClient.deselect(id);
                    }
                });
                this.selectedElements.pop();
                this.selectedElements = [...this.selectedElements];
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
            for (const id of event.children) {
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
            this.treeUpdate = newTreeNode;
            if (newTreeNode.id === this.headID) {
                this.rootofTree = newTreeNode;
            }
        }
	}
}
</script>
<template>
	<div style="display: flex;flex-direction: column;height:100vh;overflow: hidden;">
		<UmlBanner 
			:users="users"
			@new-model-loaded="getHeadFromServer" 
			@diagram="diagram" 
			@element-update="elementUpdateHandler"></UmlBanner>
		<div class="collapseAndTabPanel">
			<div class="elementExplorerHeaderExpanded" :class="elementExplorerHide ? 'elementExplorerHeaderCollapsed' : 'elementExplorerHeaderExpanded'">
				<button 
					type="button" 
					class="elementExplorerButton" 
					@click="ElementExplorerCollapse">
						{{ elementExplorerButtonTitle }} 
				</button>
				<div v-if="!elementExplorerHide" class="elementExplorerLabel">
					Element Explorer
				</div>
			</div>
			<div class="tabContainer">
				<div v-for="tab in tabs" 
					:key="tab.id" 
					class="tab" 
					:class="tab.isActive ? 'activeTab' : 'tab'" 
					@click="updateTab(tab.id)">
					<img v-bind:src="tab.img" v-if="tab.img !== undefined" class="tabImage"/>
					<div style="float:left;padding:5px;">{{ tab.label }}</div>
					<img v-bind:src="closeSymbol" @click.stop="remove(tab.id)" style="padding:5px"/>
				</div>
			</div>
		</div>
		<div class="parent">
			<div class="elementExplorer" v-if="!elementExplorerHide">
				<ElementExplorer 
					v-if="!isFetching && headID !== undefined"
					:umlID="headID" 
					:depth="0"
                    :selected-elements="selectedElements"
                    :tree-graph="treeGraph"
					@specification="specification" 
					@element-update="elementUpdateHandler" 
					@diagram="diagram"
					@draginfo="dragInfo"
                    @select="select"
                    @deselect="deselect"
                    @update-tree="updateTree"></ElementExplorer>
			</div>
			<div class="editor">
				<WelcomePage v-if="editorType=='Welcome'"></WelcomePage>
				<SpecificationPage v-if="editorType=='Specification'" 
						:uml-i-d="specificationTab" 
						@specification="specification" 
						@element-update="elementUpdateHandler"
						></SpecificationPage>
				<DiagramPage v-if="editorType=='Diagram'" 
						:uml-i-d="specificationTab" 
						@specification="specification"
						@element-update="elementUpdateHandler"
						></DiagramPage>
			</div>
		</div>
	</div>
    <div class="autosave" v-if="autosaving">
        autosaving ...
    </div>
</template>
<style>

.collapseAndTabPanel {
	flex: 0 1 auto;
	display: flex;
	background-color: var(--vt-c-black)
}
.elementExplorerHeaderExpanded {
	display: flex;
	flex: 0 1 300px;
}
.elementExplorerHeaderCollapsed {
	display: flex;
	flex: 0 1 auto;
}
.elementExplorerLabel {
	padding: 5px 15px 5px 15px;
}
.elementExplorerButton {
	padding: 10px;
    overflow-y: auto;
    flex: 0 1 auto;
    border-color: var(--color-border);
    background-color: var(--open-uml-selection-dark-1);
    color: var(--vt-c-text-light-1);
	margin-right: 10px;
}
.elementExplorerButton:hover {
    background-color: var(--vt-c-dark-soft);
}
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
.parent {
	flex: 1 1 auto;
	display: flex;
	overflow: hidden;
}
.elementExplorer{
	width: 300px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	overflow: auto;
	resize: horizontal; 
}
.editor {
	flex: 1 1 auto;
	height: 100%;
	display: flex;
}
.autosave {
    position: fixed;
    bottom: 0;
    right: 0;
}
</style>
