<script setup>
import UmlBanner from './components/UmlBanner.vue';
import ElementExplorer from './components/elementExplorer/ElementExplorer.vue';
import SpecificationPage from './components/SpecificationPage.vue';
import WelcomePage from './components/WelcomePage.vue';
import DiagramPage from './components/DiagramPage.vue';
import getImage from './GetUmlImage.vue';
import classDiagramImage from './assets/icons/general/class_diagram.svg';
import { computed } from 'vue';
import { assignTabLabel } from './umlUtil';
import TabContainer from './components/TabContainer.vue';
import { nullID } from 'uml-client/lib/types/element';
import { ELEMENT_ID } from 'uml-client/lib/modelIds';
</script>
<script>
export default {
	data() {
		return {
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
			users: [],
			userSelected: undefined,
			userDeselected: undefined,
            commandStack: [],
            undoStack: [],
            latestCommand: undefined,
            commandUndo: undefined,
            theme: 'light',
            manager: this.$umlWebClient.id,
            reload: 0,
            elementExplorerCommand: undefined,
            elementExplorerUndo: undefined,
            treeGraph: new Map()
		}
	},
	provide() {
		return {
			draginfo: computed(() => this.recentDraginfo),
            elementUpdate: computed(() => this.elementUpdate),
			userSelected: computed(() => this.userSelected),
			userDeselected: computed(() => this.userDeselected),
            latestCommand: computed(() => this.latestCommand),
            commandUndo: computed(() => this.commandUndo),
            theme: computed(() => this.theme),
            reload: computed(() => this.reload)
		}
	},
	mounted() {
        if (!this.$umlWebClient.initialized) {
            return;
        }
		this.userUpdate();

		this.$umlWebClient.updateHandlers.push(async (element, oldElement) => {
            this.elementUpdate = {
                updatedElements: [
                    {
                        newElement: element,
                        oldElement: oldElement,
                    }
                ]
            };
		});
		this.$umlWebClient.onClient = (client) => {
			this.users.push({
				id: client.id,
				color: this.getColor(client.color),
				selectedElements: [],
                user: client.user,
			});
		}

        document.addEventListener('keypress', this.keypress);

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
		async focus(data) {
            if (data.el) {
                const el = data.el;
                this.focusTab = {
                    label: await assignTabLabel(el),
                    id: el.id,
                    isActive: true,
                    type: 'Specification',
                    img: getImage(el),
                    manager: data.manager,
                };
                if (data.manager) {
                    this.manager = data.manager;
                } else {
                    this.manager = this.$umlWebClient.id;
                }
            }
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
        async elementUpdateHandler(newElementUpdate) {
			for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                // only run element if it is a kernel type
                if (newElement && newElement.is(ELEMENT_ID)) {
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
		
		dragInfo(info) {
			this.recentDraginfo = info;
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
                if (tab.manager) {
                    this.manager = tab.manager;
                } else {
                    this.manager = this.$umlWebClient.id;
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
        command(event) {
            if (event.undo) {
                // TODO do some handling
                this.undo();
            } else {
                this.commandStack.unshift(event);
                this.undoStack = [];
                if (event.element !== this.specificationTab) {
                    if (event.name === 'elementExplorerCreate' || event.name === 'diagramCreate' || event.name === 'elementExplorerRename') {
                        this.elementExplorerCommand = event;
                        // const treeNode = this.treeGraph.get(event.element);
                        // let currNode = treeNode;
                        // const stack = [];
                        // while (currNode) {
                        //     currNode.expanded = true;
                        //     stack.unshift(currNode);
                        //     currNode = currNode.parent;
                        // }
                        // for (const stackCurrNode of stack) {
                        //     this.updateTree(stackCurrNode);
                        // }
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
                        this.elementExplorerUndo = undoneCommand;
                        // // make sure the parent of the element is shown in the element explorer
                        // const treeNode = this.treeGraph.get(undoneCommand.context.element);
                        // let currNode = treeNode;
                        // if (currNode) {
                        //     currNode = currNode.parent;
                        // }
                        // const stack = [];
                        // while (currNode) {
                        //     currNode.expanded = true;
                        //     stack.unshift(currNode);
                        //     currNode = currNode.parent;
                        // }
                        // for (const stackCurrNode of stack) {
                        //     this.updateTree(stackCurrNode);
                        // }
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
                if (redoCommand.name === 'elementExplorerCreate' || redoCommand.name === 'diagramCreate' || redoCommand.name === 'elementExplorerRename') {
                    this.elementExplorerCommand = redoCommand;
                }

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
        changeTheme(theme) {
            this.theme = theme;
        },
        reloadModel() {
            this.reload = this.reload + 1;
        }
	}
}
</script>
<template>
	<div style="display: flex;flex-direction: column;height:100vh;overflow: hidden;">
		<UmlBanner 
			:users="users"
            :theme="theme"
			@new-model-loaded="reloadModel"
            @user-update="userUpdate"
			@diagram="diagram" 
			@element-update="elementUpdateHandler"
            @command="command"
            @theme="changeTheme"></UmlBanner>
		<div    class="backgroundPanel" 
                :class="{
                    backgroundPanelDark : theme === 'dark', 
                    backgroundPanelLight : theme === 'light'
                    }">
			<div    class="elementExplorerHeaderExpanded" 
                    :class="elementExplorerHide ? 'elementExplorerHeaderCollapsed' : 'elementExplorerHeaderExpanded'">
				<button 
					type="button" 
					class="elementExplorerButton"
                    :class="{
                        elementExplorerButtonLight: theme === 'light',
                        elementExplorerButtonDark: theme === 'dark',
                    }"
					@click="ElementExplorerCollapse">
						{{ elementExplorerButtonTitle }} 
				</button>
				<div v-if="!elementExplorerHide" class="elementExplorerLabel">
					Element Explorer
				</div>
			</div>
            <TabContainer
                :focus-tab="focusTab"
                :theme="theme"
                @tab-selected="updateTab"></TabContainer>
		</div>
            <div    class="parent"
                    :class="{
                        parentLight: theme === 'light',
                        parentDark: theme === 'dark',
                    }">
            <ElementExplorer    :hidden="elementExplorerHide"
                                :theme="theme"
                                :selected-elements="selectedElements"
                                :users="users"
                                :new-command="elementExplorerCommand"
                                :new-undo="elementExplorerUndo"
                                :tree-graph="treeGraph"
                                @focus="focus"
                                @command="command"
                                @select="select"
                                @deselect="deselect"
                                @drag-info="dragInfo"
                                @element-update="elementUpdateHandler">
            </ElementExplorer>
			<div class="editor">
				<WelcomePage v-if="editorType==='Welcome'"></WelcomePage>
				<SpecificationPage v-if="editorType=='Specification'" 
						:uml-i-d="specificationTab" 
                        :selected-elements="selectedElements"
                        :users="users"
                        :theme="theme"
                        :manager="manager"
						@focus="focus" 
						@element-update="elementUpdateHandler"
                        @select="select"
                        @deselect="deselect"
						></SpecificationPage>
				<DiagramPage v-if="editorType=='Diagram'" 
						:uml-i-d="specificationTab" 
                        :command-stack="commandStack"
                        :undo-stack="undoStack"
						@focus="focus"
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
.backgroundPanel {
	flex: 0 1 auto;
	display: flex;
}
.backgroundPanelLight {
    background-color: var(--uml-cafe-light-dark);
    color: var(--vt-c-dark-dark);
}
.backgroundPanelDark {
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
	margin-right: 10px;
    border: none;
}
.elementExplorerButtonLight {
    background-color: var(--uml-cafe-light-light-1);
}
.elementExplorerButtonDark {
    background-color: var(--open-uml-selection-dark-1);
    color: var(--vt-c-text-light-1);
}
.elementExplorerButtonDark:hover {
    background-color: var(--vt-c-dark-soft);
}
.elementExplorerButtonLight:hover {
    background-color: var(--uml-cafe-light-light-2);
}
.parent {
	flex: 1 1 auto;
	display: flex;
	overflow: hidden;
}
.parentLight {
    background-color: var(--vt-c-white-soft);
    color: var(--vt-c-dark-dark);
}
.parentDark {
    background-color: var(--vt-c-dark);
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
