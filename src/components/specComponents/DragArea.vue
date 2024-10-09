<script>
    export default {
        props: ['type', 'readonly', 'size'],
        emits: ['drop'],
        inject: ['draginfo'],
        data() {
            return {
                drag: false,
                badDrag: false,
                dragCounter: 0,
                recentDragInfo: undefined
            }
        },
        watch: {
            draginfo(newDragInfo) {
                this.recentDragInfo = newDragInfo;
            }
        },
        methods: {
            dragenter(event) {
                event.preventDefault();
                this.dragCounter++;
                this.drag = true;
                this.badDrag = this.readonly || this.$umlWebClient.readonly;
                if (!this.badDrag) {
                    if (this.size && this.recentDragInfo.selectedElements.length > this.size) {
                        this.badDrag = true;
                        return;
                    }
                    for (const el of this.recentDragInfo.selectedElements) {
                        if (!el.is(this.type)) {
                            this.badDrag = true;
                            break;
                        }
                    }
                }
            },
            dragleave() {
                this.dragCounter--;
                if (this.dragCounter === 0) {
                    this.drag = false;
                }
            },
            drop() {
                this.drag = false;
                if (this.badDrag) {
                    return;
                }
                this.$emit('drop', this.recentDragInfo);
            },
            
        }
    }
</script>
<template>
     <div   :class="drag ? badDrag ? 'badDrag' : 'dragElement' : 'noDrag'"
            style="flex: 1 0;"
            @dragenter="dragenter"
            @dragleave="dragleave"
            @drop="drop($event)"
            @dragover.prevent>
        <slot>
        </slot>
    </div>
</template>
<style>
.noDrag {
    border: none;
}
.dragElement {
    border: 1px solid;
    border-color: var(--uml-cafe-selected-hover);
}
.badDrag {
    border: 1px solid;
    border-color: var(--uml-cafe-selected-error);
}
</style>
