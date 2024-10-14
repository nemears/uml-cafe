<script>
    export default {
        props: [
            'type', 
            'readonly', 
            'size',
            'composition'
        ],
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
            async drop() {
                this.drag = false;
                if (this.badDrag) {
                    return;
                }

                const oldOwners = [];
                const oldOwnersData = [];
                for (const element of this.recentDragInfo.selectedElements) {
                    if (element.owner.has()) {
                        const oldOwner = await element.owner.get();
                        oldOwners.push(oldOwner);
                        const visited = new Set();
                        let compositeSet;
                        if (this.composition === 'composite') {
                            // see what composite set to keep track of incase of undo
                            const queue = [oldOwner.typeInfo];
                            while (queue.length > 0 && !compositeSet) {
                                const front = queue.shift();
                                if (visited.has(front)) {
                                    continue;
                                }
                                visited.add(front);
                                for (const setPair of front.sets) {
                                    const set = setPair[1];
                                    if (set.composition === 'composite' && set.contains(element) && !set.subSetContains(element.id)) {
                                        compositeSet = set.definingFeature;
                                        break;
                                    }
                                }
                                for (const base of front.base) {
                                    queue.push(base);
                                }
                            }
                        }

                        oldOwnersData.push(
                            {
                                element: element.id,
                                owner: oldOwner.id,
                                compositeSet: compositeSet
                            }
                        );
                    }
                }
                this.recentDragInfo.oldOwners = oldOwnersData;
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
