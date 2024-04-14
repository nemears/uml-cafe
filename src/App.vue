<script setup>
import UmlBanner from './components/UmlBanner.vue';
import ElementExplorer from './components/ElementExplorer.vue';
import SpecificationPage from './components/SpecificationPage.vue';
import WelcomePage from './components/WelcomePage.vue';
import DiagramPage from './components/DiagramPage.vue';
import getImage from './GetUmlImage.vue';
import classDiagramImage from './assets/icons/general/class_diagram.svg';
import { computed } from 'vue';
import { assignTabLabel } from './umlUtil';
import TabContainer from './components/TabContainer.vue';
import { nullID } from 'uml-client/lib/element';
</script>
<script>
export default {
	data() {
		return {
			headID: '',
			isFetching: true,
			focusTab: {
                label: 'Welcome!',
                id: 'VQvHG72Z_FjNQlEeeFEcrX1v6RRy',
                isActive: true,
                type: 'Welcome'
            },
			specificationTab: 'VQvHG72Z_FjNQlEeeFEcrX1v6RRy',
			recentDraginfo: {
				selectedElements: [],
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
            commandStack: [],
            undoStack: [],
            latestCommand: undefined,
            commandUndo: undefined,
		}
	},
	provide() {
		return {
			draginfo: computed(() => this.recentDraginfo),
            elementUpdate: computed(() => this.elementUpdate),
            treeUpdate: computed(() => this.treeUpdate),
			userSelected: computed(() => this.userSelected),
			userDeselected: computed(() => this.userDeselected),
            latestCommand: computed(() => this.latestCommand),
            commandUndo: computed(() => this.commandUndo)
		}
	},
	mounted() {
        if (!this.$umlWebClient.initialized) {
            return;
        }
		this.userUpdate();

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
				color: this.getColor(client.color),
				selectedElements: [],
                user: client.user,
			});
		}

        document.addEventListener('keypress', this.keypress);

		this.getHeadFromServer();

		this.$umlWebClient.onDropClient = (clientID) => {
			const userIndex = this.users.findIndex(user => user.id === clientID);
			this.userDeselected = {
				elements: this.users[userIndex].selectedElements,
				color: this.users[userIndex].color
			};
			this.users.splice(userIndex, 1);
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
					elements: [event.id],
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
        keypress(event) {
            if (event.key == 'z' && event.ctrlKey) { // ctrl-z
                this.undo();
            } else if (event.key == 'y' && event.ctrlKey) {
                this.redo();
            }
        },
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
            this.focusTab = {
				label: await assignTabLabel(el),
				id: el.id,
				isActive: true,
				type: 'Specification',
				img: getImage(el)
			};
		},
        async elementUpdateHandler(newElementUpdate) {
			for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                if (newElement) {
                    // helper function
                    const createTreeNode = (treeNode, id) => {
                        const newTreeNode = {
                            id: id,
                            childOrder: [],
                            children: {},
                            expanded: false,
                            parent: treeNode,
							usersSelecting: [],
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
            document.removeEventListener('keydown', this.keypress);
            this.focusTab = {
				label: diagramClass.name !== undefined && diagramClass.name !== '' ? diagramClass.name : diagramClass.id,
				id: diagramClass.id,
				isActive: true,
				type: 'Diagram',
				img: classDiagramImage
			};
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
			this.recentDraginfo = {
				selectedElements: draggedElements,
				event: info.event
			};
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
		updateTab(tab) {
            if (tab.id === nullID()) {
                this.specificationTab = undefined;
                this.editorType = undefined;
            } else {
                this.specificationTab = tab.id;
                this.editorType = tab.type;
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
                this.selectedElements = [...this.selectedElements];
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
                    this.selectedElements = [...this.selectedElements];
                }
            } else if (event.modifier === 'shift') {
				const shiftDeselect = (id) => {
                    const index = this.selectedElements.indexOf(id); 
                    if (index === -1) {
                        console.warn('bad el given to deselect');
                    } else {
                        this.selectedElements.splice(index, 1);
                        this.$umlWebClient.deselect(id);
                    }
                };
                this.shiftClickAction(event, shiftDeselect);
				shiftDeselect(this.selectedElements[this.selectedElements.length - 1]);
                // this.selectedElements.pop();
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
            this.treeUpdate = newTreeNode;
            if (newTreeNode.id === this.headID) {
                this.rootofTree = newTreeNode;
            }
        },
        command(event) {
            if (event.undo) {
                // TODO do some handling
                this.undo();
            } else {
                this.commandStack.unshift(event);
                this.undoStack = [];
                if (event.element !== this.specificationTab) {
                    if (event.name === 'elementExplorerCreate' || event.name === 'diagramCreate' || event.name === 'elementExplorerRename') {
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
                    }
                }
                this.latestCommand = event;
            }
        },
        undo() {
            if (this.commandStack.length > 0) {
                const undoneCommand = this.commandStack.shift();
                this.undoStack.unshift(undoneCommand);
                if (undoneCommand !== this.specificationTab) {
                    if (undoneCommand.name === 'elementExplorerCreate' || undoneCommand.name === 'diagramCreate' || undoneCommand.name === 'elementExplorerRename') {
                        // make sure the parent of the element is shown in the element explorer
                        const treeNode = this.treeGraph.get(undoneCommand.context.element);
                        let currNode = treeNode;
                        if (currNode) {
                            currNode = currNode.parent;
                        }
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
                }
                this.commandUndo = undoneCommand;
            }
        },
        redo() {
            if (this.undoStack.length > 0) {
                const redoCommand = Object.assign({}, this.undoStack.shift()); // shallow copy to trigger change
                redoCommand.redo = true;
                this.commandStack.unshift(redoCommand);
                this.latestCommand = redoCommand;
            }
        },
        getColor(color) {
            switch (color) {
                case 'Red':
                    return 'var(--uml-cafe-red-user)';
                case 'Blue':
                    return 'var(--uml-cafe-blue-user)';
                case 'Green':
                    return 'var(--uml-cafe-green-user)';
                case 'Yellow':
                    return 'var(--uml-cafe-yellow-user)';
                case 'Orange':
                    return 'var(--uml-cafe-orange-user)';
                case 'Magenta':
                    return 'var(--uml-cafe-magenta-user)';
                case 'Lime':
                    return 'var(--uml-cafe-lime-user)';
                case 'Cyan':
                    return 'var(--uml-cafe-cyan-user)';
                default:
                    throw Error('Bad color given to getColor!');
            }
        },
        userUpdate() {
            // set up users and their colors
            const userList = [];
            
            // add ourselves as a user
            userList.push({
                id: this.$umlWebClient.id,
                color: this.getColor(this.$umlWebClient.color),
                selectedElements: [],
                user: this.$umlWebClient.user,
            });

            // add other users as well
            this.$umlWebClient.otherClients.forEach((client, id) => {
                userList.push({
                    id: id,
                    color: this.getColor(client.color),
                    selectedElements: Array.from(client.selectedElements), //hopefully ?
                    user: client.user,
                });
            });

            this.users = userList;
        },
	}
}
</script>
<template>
	<div style="display: flex;flex-direction: column;height:100vh;overflow: hidden;">
		<UmlBanner 
			:users="users"
			@new-model-loaded="getHeadFromServer"
            @user-update="userUpdate"
			@diagram="diagram" 
			@element-update="elementUpdateHandler"
            @command="command"></UmlBanner>
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
            <TabContainer
                :focus-tab="focusTab"
                @tab-selected="updateTab"></TabContainer>
		</div>
		<div class="parent">
			<div class="elementExplorer" v-if="!elementExplorerHide" draggable="false">
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
                    @update-tree="updateTree"
                    @command="command"></ElementExplorer>
			</div>
			<div class="editor">
				<WelcomePage v-if="editorType==='Welcome'"></WelcomePage>
				<SpecificationPage v-if="editorType=='Specification'" 
						:uml-i-d="specificationTab" 
                        :selected-elements="selectedElements"
                        :users="users"
						@specification="specification" 
						@element-update="elementUpdateHandler"
                        @select="select"
                        @deselect="deselect"
						></SpecificationPage>
				<DiagramPage v-if="editorType=='Diagram'" 
						:uml-i-d="specificationTab" 
                        :command-stack="commandStack"
                        :undo-stack="undoStack"
						@specification="specification"
						@element-update="elementUpdateHandler"
                        @command="command"
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
	flex: 0 0 300px;
}
.elementExplorerHeaderCollapsed {
	display: flex;
	flex: 0 0 auto;
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