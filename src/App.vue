<script setup>
import UmlBanner from './components/UmlBanner.vue';
import ContainmentTreePanel from './components/ContainmentTreePanel.vue';
import UmlEditor from './components/UmlEditor.vue';
import getImage from './GetUmlImage.vue';
import classDiagramImage from './components/icons/class_diagram.svg';
import { nullID } from 'uml-client/lib/element.js';
import { computed } from 'vue';
import { assignTabLabel } from './umlUtil';
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
			recentDraginfo: {
				id: nullID(),
				element: 'element',
			},
            elementUpdate: [],
            autosaving: false,
		}
	},
	provide() {
		return {
			draginfo: computed(() => this.recentDraginfo),
            elementUpdate: computed(() => this.elementUpdate),
		}
	},
	mounted() {
		this.getHeadFromServer();

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

        setInterval(() => {
            this.$umlWebClient.save();
            this.autosaving = true;
            setTimeout(() => {
                this.autosaving = false;
            }, 5000);
            // TODO show message saying autosave
        }, 180000);
	},
	methods: {
		async getHeadFromServer() {
			this.isFetching = true;
			const head = await this.$umlWebClient.head();
			this.headID = head.id;
			this.isFetching = false;
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
		},
        elementUpdateHandler(newElementUpdate) {
            this.elementUpdate = newElementUpdate;
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
		<UmlBanner @new-model-loaded="getHeadFromServer" @diagram="diagram" @element-update="elementUpdateHandler" ></UmlBanner>
		<div class="parent">
			<div class="leftBar">
				<div style="flex:0 0 34px;background-color: var(--vt-c-black);order:0;"></div>
				<div class="containmentTree">
					<ContainmentTreePanel 
							v-if="!isFetching && headID !== undefined" 
							:umlID="headID" 
							:depth="0" 
							@specification="specification" 
                            @element-update="elementUpdateHandler" 
							@diagram="diagram"
							@draginfo="dragInfo"></ContainmentTreePanel>
				</div>
			</div>
			<UmlEditor  :tabs="tabs" 
						:specificationTab="specificationTab" 
						@specification="specification" 
                        @elementUpdate="elementUpdateHandler"
						@close-tab="closeTab"></UmlEditor>
		</div>
	</div>
    <div class="autosave" v-if="autosaving">
        autosaving ...
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
.autosave {
    position: fixed;
    bottom: 0;
    right: 0;
}
</style>
