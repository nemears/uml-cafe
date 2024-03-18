<script>
import { createElementUpdate, createUmlClassDiagram } from '../../umlUtil.js';
import { randomID } from 'uml-client/lib/element';
export default {
    emits: [
        'elementUpdate', 
        'diagram', 
        'command'
    ],
    data() {
        return {
            buttonID: randomID(),
            isMounted: false
        }
    },
    mounted() {
        this.isMounted = true;
    },
    methods: {
        async createDiagram () {
            const head = await this.$umlWebClient.head();
            const diagramID = randomID();
            const diagramPackage = await createUmlClassDiagram(diagramID, head, this.$umlWebClient);
            this.$emit('command', {
                name: 'diagramCreate',
                element: head.id,
                redo: false,
                context: {
                    diagramID: diagramID,
                    parentID: head.id,
                }
            });
            this.$emit('diagram', diagramPackage);
            this.$emit('elementUpdate', createElementUpdate(head));
        }
    }
}
</script>
<template>
     <button type="button" class="createDiagramButton" @click="createDiagram">Create New Diagram</button> 
</template>
<style>
.freezeBackGround {
    position: absolute;
    height: 100vh;
    width: 100vw;
    /* opacity: 0.8; */
    background-color: rgba(45, 48, 53, 0.5);
    z-index: 5;
}
.selectionWindow {
    max-height: 80vh;
    width: 50vw;
    left: 25vw;
    top: 10vh;
    z-index: 5;
    background-color: var(--vt-c-black);
    border: solid 2px;
    border-color: var(--vt-c-dark-soft);
    padding: 5px;
    display: flex;
    flex-direction: column;
}
.popUpHeader {
    padding: 10px;
    flex: 0 1 auto;
}
.createDiagramButton {
    padding: 10px;
    overflow-y: auto;
    flex: 0 1 auto;
    border-color: var(--color-border);
    background-color: var(--open-uml-selection-dark-1);
    color: var(--vt-c-text-light-1);
}
.createDiagramButton:hover {
    background-color: var(--vt-c-dark-soft);
}
</style>
