<script setup>
import UmlBanner from './components/UmlBanner.vue'
import ContainmentTreePanel from './components/ContainmentTreePanel.vue'
import UmlEditor from './components/UmlEditor.vue'
import getImage from './GetUmlImage.vue'
import classDiagramImage from './components/icons/class_diagram.svg';
import { nullID } from 'uml-client/lib/element.js'
import { computed } from 'vue'
</script>
<script>
// top level vue sets up client
export default {
	data() {
		return {
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
			specificationTab: '',
			recentDataChange: {
				data: []
			},
			recentDraginfo: {
				id: nullID(),
				element: 'element',
			},
			diagramShapes : {},
            elementUpdate: {
                newElement: null,
                oldElement: null,
            }
		}
	},
	provide() {
		return {
			dataChange: computed(() => this.recentDataChange),
			draginfo: computed(() => this.recentDraginfo),
            elementUpdate: computed(() => this.elementUpdate),
		}
	},
	mounted() {
		this.getHeadFromServer();

		this.$umlWebClient.onUpdate = async (element, oldElement) => {

            // this is remaking dataChange (making it simpler)
            this.elementUpdate = {
                newElement: element,
                oldElement: oldElement,
            };

			// TODO this will become more complicated
			const owner = await element.owner.get();
			if (owner !== undefined) {
				this.recentDataChange = {
					data: [
						{
							id: owner.id,
							type: 'add',
							set: 'packagedElements',
							el: element.id
						},
					]
				};
			}
		}
	},
	methods: {
		async getHeadFromServer() {
			this.isFetching = true;
			const head = await this.$umlWebClient.head();
			this.headID = head.id;
			this.isFetching = false;
		},
		specification(el) {
			if (this.tabs.find(tab => tab.id === el.id)) { // no duplicates
				this.specificationTab = el.id;
				return;
			}
			for (let tab of this.tabs) {
				tab.isActive = false;
			}
			this.tabs.push({
				label: el.name !== undefined && el.name !== '' ? el.name : '< >',
				id: el.id,
				isActive: true,
				type: 'Specification',
				img: getImage(el)
			});
			this.specificationTab = el.id;
		},
		dataChange(dataChange) {
			this.recentDataChange = dataChange;
			for (let data of dataChange.data) {
				if (data.type === 'shape') {
					if (this.diagramShapes[data.id] === undefined) {
						this.diagramShapes[data.id] = [];
					}
					this.diagramShapes[data.id].push(data.shape);
				} else if (data.type === 'delete') {
					data.shapes = this.diagramShapes[data.id];

					const deletShapesFromModel = async () => {
						for (const shape of data.shapes) {
							const shapeEl = await this.$umlWebClient.get(shape);
							const diagramEl = await shapeEl.owningPackage.get();
							this.$umlWebClient.deleteElement(shapeEl);
							this.$umlWebClient.put(diagramEl);
						}
						
						delete this.diagramShapes[data.id];
					};
					if (data.shapes) {
						deletShapesFromModel();
					} else {
						for (const shapes in this.diagramShapes) {
							for (const shape in this.diagramShapes[shapes]) {
								if (shape === data.id) {
									this.diagramShapes[shapes].splice(shapes.indexOf(shape), 1);
								}
								if (shapes.length === 0) {
									delete this.diagramShapes[shapes];
								}
							}
						}
					}
				}
			}
		},
		diagram(diagramClass) {
			if (this.tabs.find(tab => tab.id === diagramClass.id)) { // no duplicates
				this.specificationTab = diagramClass.id;
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
				this.specificationTab = '0';
			} else {
				this.specificationTab = diagramClass.id;
			}
		},
		dragInfo(draginfo) {
			this.recentDraginfo = draginfo;
		},
		closeTab(id) {
			if (this.specificationTab === id) {
				this.specificationTab = this.tabs[this.tabs.length - 1].id;
			}
		}
	}
}
</script>
<template>
	<div style="display: flex;flex-direction: column;height:100vh;overflow: hidden;">
		<UmlBanner @new-model-loaded="getHeadFromServer"></UmlBanner>
		<div class="parent">
			<div class="leftBar">
				<div style="flex:0 0 34px;background-color: var(--vt-c-black);order:0;"></div>
				<div class="containmentTree">
					<ContainmentTreePanel 
							v-if="!isFetching && headID !== undefined" 
							:umlID="headID" 
							:depth="0" 
							:data-change="recentDataChange" 
							@specification="specification" 
							@data-change="dataChange" 
							@diagram="diagram"
							@draginfo="dragInfo"></ContainmentTreePanel>
				</div>
			</div>
			<UmlEditor  :tabs="tabs" 
						:specificationTab="specificationTab" 
						@specification="specification" 
						@data-change="dataChange"
						@close-tab="closeTab"></UmlEditor>
		</div>
	</div>
</template>
<style>
.parent {
	flex: 1 0 ;
	width: 100%;
	display: flex;
	overflow: hidden;
}
.containmentTree{
	order: 1;
	overflow: auto;
	flex-grow: 1;
	resize: horizontal; /* TODO make pretty horizontal resize */
	width: 300px;
}
.leftBar {
	display: flex;
	flex-direction: column;
	overflow: visible;
}
</style>
