<script>
import { createElementUpdate, createClassDiagram, deleteElementElementUpdate } from '../../umlUtil.js';
import { randomID } from 'uml-client/lib/element';
export default {
    props: [
        'commandStack', 
        'undoStack'
    ],
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
    // watch: {
    //     async commandStack(newCommandStack) {
    //         // redo
    //         const newCommand = newCommandStack[0],
    //         commandName = newCommand.name;
    //         if (newCommand && newCommand.element === this.buttonID && newCommand.redo) {
    //             if (commandName === 'diagramCreate') {
    //                 const head = await this.$umlWebClient.head();
    //                 const diagramID = newCommand.context.diagramID;
    //                 const diagramPackage = await createClassDiagram(diagramID, head, this.$umlWebClient);
    //                 this.$emit('diagram', diagramPackage);
    //                 this.$emit('elementUpdate', createElementUpdate(head));
    //             }
    //         }
    //     },
    //     async undoStack(newUndoStack) {
    //         const undoCommand = newUndoStack[0];
    //         if (undoCommand && undoCommand.element === this.buttonID) {
    //             if (undoCommand.name === 'diagramCreate') {
    //                 const diagramID = undoCommand.context.diagramID;
    //                 const diagramPackage = await this.$umlWebClient.get(diagramID),
    //                 owner = await diagramPackage.owner.get();
    //                 this.$emit('elementUpdate', deleteElementElementUpdate(diagramPackage));
    //                 await this.$umlWebClient.deleteElement(diagramPackage);
    //                 this.$umlWebClient.put(owner);
    //                 this.$emit('elementUpdate', createElementUpdate(owner));
    //             }
    //         }
    //     }
    // },
    methods: {
        async createDiagram () {
            const head = await this.$umlWebClient.head();
            const diagramID = randomID();
            this.$emit('command', {
                name: 'diagramCreate',
                element: head.id,
                redo: false,
                context: {
                    diagramID: diagramID,
                    parentID: head.id,
                }
            });
            const diagramPackage = await createClassDiagram(diagramID, head, this.$umlWebClient);
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
