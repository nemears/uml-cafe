<script>
import { Editor } from './diagram/editor';
// import { getLine } from './diagram/providers/relationships/Relationship';
const EventEmitter = require('events');
export default {
    data() {
        return {
            emitter : undefined,
            recentDraginfo: undefined,
        };
    },
    props: ['umlID'],
    emits: ['dataChange'],
    inject: ['dataChange', 'draginfo'],
    watch : {
        dataChange(newDataChange, oldDataChange) {
            for (let data of newDataChange.data) {
                if (data.type === 'name') {
                    this.emitter.emit('rename', data);
                } else if (data.type === 'delete') {
                    this.emitter.emit('removeShape', data);
                }
            }
        },
        draginfo(newDraginfo) {
            this.recentDraginfo = newDraginfo;
        },
        umlID() {
            this.reloadDiagram();
        },

    },
    async mounted() {
        this.reloadDiagram();        
    },
    methods: {
        dragEnter(event, list) {
            console.log('dragent');
            this.emitter.emit('dragenter', {
                draginfo: this.recentDraginfo,
                event: event,
            });
        },
        dragLeave(event, list) {

        },
        onDrop(event, list) {
            console.log('dropped on diagram');
            
        },
        async reloadDiagram() {
            if (this.diagram) {
                this.diagram.destroy()
            }
            const scopedEmitter = new EventEmitter();
            const diagramPackage = await this.$umlWebClient.get(this.umlID);
            this.diagram = new Editor({
                container: this.$refs.diagram,
                umlWebClient: this.$umlWebClient,
                emitter: scopedEmitter,
                context: await diagramPackage.owningPackage.get(),
                diagramElement: diagramPackage
            });
            const canvas = this.diagram.get('canvas');
            const elementFactory = this.diagram.get('elementFactory');
            
            // add root
            var root = elementFactory.createRoot();

            canvas.setRootElement(root);

            // set up diagram from model
            {
                const shapes = {};

                // draw all shapes
                for await (let packagedEl of diagramPackage.packagedElements) {
                    if (!packagedEl.isSubClassOf('instanceSpecification')) {
                        continue;
                    }
                    if (!packagedEl.classifiers.contains('KYV0Pg5b5r4KJ6qCA3_RAU2bWI4g')) {
                        continue;
                    }
                    // draw shape
                    let widthValue = undefined;
                    let heightValue = undefined;
                    let elementID = undefined;
                    let xValue = undefined;
                    let yValue = undefined;
                    for await (let slot of packagedEl.slots) {

                        if (slot.definingFeature.id() === 'KbKmDNU19SWMJwggKTQ9FrzAzozO') {
                            // bounds
                            const boundsInstance = await (await slot.values.front()).instance.get();
                            for await (let boundsSlot of boundsInstance.slots) {
                                if (boundsSlot.definingFeature.id() === 'OaYzOYryv5lrW2YYkujnjL02rSlo') {
                                    // x
                                    xValue = (await boundsSlot.values.front()).value;
                                } else if (boundsSlot.definingFeature.id() === 'RhD_fTVUMc4ceJ4topOlpaFPpoiB') {
                                    yValue = (await boundsSlot.values.front()).value;
                                }else if (boundsSlot.definingFeature.id() === '&TCEXx1uZQsa7g1KPT9ocVwNiwV7') {
                                    widthValue = (await boundsSlot.values.front()).value;
                                } else if (boundsSlot.definingFeature.id() === 'ELF54xP3DUMrFbgteAQkIXONqnlg') {
                                    heightValue = (await boundsSlot.values.front()).value;
                                } 
                            }
                        } else if (slot.definingFeature.id() === 'xnI9Aiz3GaF91K8H7KAPe95oDgyE') {
                            // model element
                            elementID = 
                                (await 
                                    (await 
                                        (await
                                            (await slot.
                                                    values.
                                                    front()
                                            ).
                                            instance.
                                            get()).
                                        slots.
                                        filter(modelElementSlot => modelElementSlot.definingFeature.id() === '3gx55nLEvmzDt2kKK7gYgxsTBD6M'))[0].
                                    values.
                                    front()).
                                value;
                        }
                    }

                    
                    const elShapeIsRepresenting = await this.$umlWebClient.get(elementID);
                    const name = elShapeIsRepresenting.name ? elShapeIsRepresenting.name : '';

                    const shape = elementFactory.createShape({
                        x: xValue,
                        y: yValue,
                        width: widthValue,
                        height: heightValue,
                        id: packagedEl.id,
                        elementID: elementID,
                        shapeID: packagedEl.id,
                        name: name,
                        umlType: elShapeIsRepresenting.elementType(),
                        newUMLElement: false,
                    });
                    canvas.addShape(shape);
                    shapes[packagedEl.id] = shape;
                }

                // draw all connections between shapes
                for await (let packagedEl of diagramPackage.packagedElements) {
                    if (!packagedEl.isSubClassOf('instanceSpecification')) {
                        continue;
                    }
                    if (!packagedEl.classifiers.contains('u2fIGW2nEDfMfVxqDvSmPd5e_wNR')) {
                        continue;
                    }

                    let target = undefined;
                    let source = undefined;
                    let represents = undefined;
                    let waypointsSlot = undefined;
                    for await (let slot of packagedEl.slots) {
                        if (slot.definingFeature.id() === 'R2flL_8p_&Zc7HP07QfAyUI7EtCg') {
                            target = shapes[(await slot.values.front()).instance.id()];
                        } else if (slot.definingFeature.id() === 'Xxh7mjF9IMK0rhyrbSXOGA1_7vVo') {
                            source = shapes[(await slot.values.front()).instance.id()];
                        } else if (slot.definingFeature.id() === 'xnI9Aiz3GaF91K8H7KAPe95oDgyE') {
                            // model element
                            represents = await this.$umlWebClient.get((await (await (await (await slot.values.front()).instance.get()).slots.filter(elInstSlot => elInstSlot.definingFeature.id() === '3gx55nLEvmzDt2kKK7gYgxsTBD6M'))[0].values.front()).value);
                        } else if (slot.definingFeature.id() === 'Zf2K&k0k&jwaAz1GLsTSk7rN742p') {
                            waypointsSlot = slot;
                        }
                    }
                    // waypoints saved to model
                    let waypoints = [];
                    for await (const pointVal of waypointsSlot.values) {
                        const pointInstance = await pointVal.instance.get();
                        let point = {};
                        for await (const slot of pointInstance.slots) {
                            if (slot.definingFeature.id() === '0TTKoNWbe13DJ3ou_1KhyS9sE1iU') {
                                point.x = (await slot.values.front()).value;
                            } else if (slot.definingFeature.id() === 'wecoFZpGF2kLOJ0sBneePO3nB47z') {
                                point.y = (await slot.values.front()).value;
                            }
                        }
                        waypoints.push(point);
                    }

                    var relationship = elementFactory.createConnection({
                        waypoints: waypoints,
                        shapeID: packagedEl.id,
                        elementID: represents.id,
                        source: source,
                        target: target,
                        umlType: represents.elementType()
                    });
                    target.incoming.push(relationship);
                    source.outgoing.push(relationship);
                    canvas.addConnection(relationship, root);
                }
            }
            

            const diagramPage = this;
            // handle emits from diagram to update rest of app
            scopedEmitter.on('shape.added', function(event) {
                diagramPage.$emit('dataChange', {
                    data: [
                        {
                            id: diagramPackage.owningPackage.id(),
                            type: 'add',
                            set: 'packagedElements',
                            el: event.element.elementID
                        },
                        {
                            id: event.element.elementID,
                            type: 'shape',
                            shape: event.element.shapeID, 
                        }
                    ]                
                });
            });
            scopedEmitter.on('generalization.end', (event) => {
                diagramPage.$emit('dataChange', event);
            });
            scopedEmitter.on('directedComposition.end', (event) => {
                    diagramPage.$emit('dataChange', event);
            });
            this.emitter = Object.freeze(scopedEmitter);
        }
    }
}
</script>
<template>
    <div ref="diagram" class="diagramContainer" 
        @drop="onDrop($event, 1)"
        @dragover.prevent
        @dragenter.prevent="dragEnter"
        @dragleave.prevent="dragLeave"></div>
</template>
<style>
.diagramContainer {
    flex: 1 1;
}
.palette-icon-lasso-tool {
    background: url('data:image/svg+xml,%3Csvg%0A%20%20%20%20%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20%0A%20%20%20%20%20fill%3D%22none%22%0A%20%20%20%20%20stroke%3D%22%23000%22%0A%20%20%20%20%20stroke-width%3D%221.5%22%0A%20%20%20%20%20width%3D%2246%22%0A%20%20%20%20%20height%3D%2246%22%3E%0A%20%20%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2216%22%20height%3D%2216%22%20stroke-dasharray%3D%225%2C%205%22%20%2F%3E%0A%20%20%3Cline%20x1%3D%2216%22%20y1%3D%2226%22%20x2%3D%2236%22%20y2%3D%2226%22%20stroke%3D%22black%22%20%2F%3E%0A%20%20%3Cline%20x1%3D%2226%22%20y1%3D%2216%22%20x2%3D%2226%22%20y2%3D%2236%22%20stroke%3D%22black%22%20%2F%3E%0A%3C%2Fsvg%3E');
}

.palette-icon-create-shape {
    background: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22%23000%22%20stroke-width%3D%221.5%22%20width%3D%2246%22%20height%3D%2246%22%3E%3Crect%20x%3D%2210%22%20y%3D%2213%22%20width%3D%2226%22%20height%3D%2220%22%2F%3E%3C%2Fsvg%3E');
}

.palette-icon-create-frame {
    background: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22%23000%22%20stroke-width%3D%221.5%22%20stroke-dasharray%3D%224%22%20width%3D%2246%22%20height%3D%2246%22%3E%3Crect%20x%3D%2210%22%20y%3D%2213%22%20width%3D%2226%22%20height%3D%2220%22%2F%3E%3C%2Fsvg%3E');
}

.context-pad-icon-remove {
    background: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22%23000%22%20stroke-width%3D%221.5%22%20width%3D%2246%22%20height%3D%2246%22%3E%3Cline%20x1%3D%225%22%20y1%3D%225%22%20x2%3D%2215%22%20y2%3D%2215%22%2F%3E%3Cline%20x1%3D%2215%22%20y1%3D%225%22%20x2%3D%225%22%20y2%3D%2215%22%2F%3E%3C%2Fsvg%3E') !important;
}

.context-pad-icon-connect {
    background: url('diagram/createGeneralizationDark.svg') !important;
}

.context-pad-icon-directed-composition {
    background: url('diagram/directedComposition.svg') !important;
}
@import "diagram-js/assets/diagram-js.css"
</style>
