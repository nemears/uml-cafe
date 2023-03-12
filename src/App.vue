<script setup>
import UmlBanner from './components/UmlBanner.vue'
import ContainmentTreePanel from './components/ContainmentTreePanel.vue'
import UmlEditor from './components/UmlEditor.vue'
import UmlClient from 'uml-js/lib/umlClient'
import getImage from './GetUmlImage.vue'
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
			recentDataChange: {}
		}
	},
	provide() {
		return {
			dataChange: computed(() => this.recentDataChange)
		}
	},
	mounted() {
		this.getHeadFromServer();
	},
	methods: {
		async getHeadFromServer() {
			this.isFetching = true;
			const client = new UmlClient(this.$sessionName);
			const head = await client.head();
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
				label: el.name !== undefined && el.name !== '' ? el.name : el.id,
				id: el.id,
				isActive: true,
				type: 'Specification',
				img: getImage(el)
			});
			this.specificationTab = el.id;
		},
		dataChange(dataChange) {
			this.recentDataChange = dataChange;
		}
	}
}
</script>
<template>
	<UmlBanner @new-model-loaded="getHeadFromServer"></UmlBanner>
	<div class="parent">
		<div>
			<div style="height:34px;background-color: var(--vt-c-black);"></div>
			<div class="containmentTree">
				<ContainmentTreePanel v-if="!isFetching && headID !== undefined" :umlID="headID" 
					:depth="0" :data-change="recentDataChange" @specification="specification" @data-change="dataChange"></ContainmentTreePanel>
			</div>
			<div class="bottomBar"></div>
		</div>
		<UmlEditor :tabs="tabs" :specificationTab="specificationTab" @specification="specification" @data-change="dataChange"></UmlEditor>
	</div>
</template>
<style>
.parent {
	flex: 1 1 auto;
	width: 100%;
	display: flex;
}
.containmentTree{
    flex: 0 1 300px;
    overflow: auto;
    width: 300px;
	height: 800px;
}
.bottomBar {
	background-color: var(--vt-c-black);;
	height: 100%;
}
</style>
