<script>
import { Editor } from './diagram/editor';
const EventEmitter = require('events');
import { createElementUpdate } from '../createElementUpdate.js';
import { getUmlDiagramElement, deleteUmlDiagramElement } from './diagram/api/diagramInterchange';
export default {
    data() {
        return {
            emitter : undefined,
            recentDraginfo: undefined,
            dragging: false,
        };
    },
    props: ['umlID'],
    emits: ['specification', 'elementUpdate'],
    inject: ['draginfo', 'elementUpdate'],
    watch : {
        draginfo(newDraginfo) {
            this.recentDraginfo = newDraginfo;
        },
        elementUpdate(newElementUpdate) {
            // send update to diagram via emitter
            this.emitter.emit('elementUpdate', newElementUpdate);
        },
        umlID() {
            this.reloadDiagram();
        },

    },
    async mounted() {
        this.reloadDiagram();        
    },
    methods: {
        specification(event) {
            if (event.currentTarget == this.$refs.diagram) {
                this.$emit('specification', event);
            }
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
                    const umlShape = await getUmlDiagramElement(packagedEl.id, this.$umlWebClient)

                    if (!umlShape.modelElement) {
                        // modelElement for shape has been deleted
                        await deleteUmlDiagramElement(umlShape.id, this.$umlWebClient);
                        continue;
                    }

                    const shape = elementFactory.createShape({
                        x: umlShape.bounds.x,
                        y: umlShape.bounds.y,
                        width: umlShape.bounds.width,
                        height: umlShape.bounds.height,
                        id: packagedEl.id,
                        elementID: umlShape.modelElement.id,
                        name: umlShape.modelElement.name,
                        umlType: umlShape.modelElement.elementType(),
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

                    const umlEdge = await getUmlDiagramElement(packagedEl.id, this.$umlWebClient);
                    
                    if (!umlEdge.modelElement) {
                        // model element has been deleted
                        await deleteUmlDiagramElement(umlEdge.id, this.$umlWebClient);
                        continue;
                    }

                    const source = shapes[umlEdge.source];
                    const target = shapes[umlEdge.target];

                    var relationship = elementFactory.createConnection({
                        waypoints: umlEdge.waypoints,
                        id: packagedEl.id,
                        elementID: umlEdge.modelElement.id,
                        source: source,
                        target: target,
                        umlType: umlEdge.modelElement.elementType()
                    });
                    canvas.addConnection(relationship, root);
                }
            }
            

            const diagramPage = this;
            // handle emits from diagram to update rest of app
            scopedEmitter.on('elementUpdate', (newElementUpdate) => {
                diagramPage.$emit('elementUpdate', newElementUpdate);
            });
            // whenever a shape is added update diagram context
            scopedEmitter.on('shape.added', async () => {
                diagramPage.$emit('elementUpdate', createElementUpdate(await diagramPackage.owningPackage.get()));
            });
            scopedEmitter.on('specification', (event) => {
                diagramPage.$emit('specification', event);
            });
            this.emitter = Object.freeze(scopedEmitter);
        }
    }
}
</script>
<template>
    <div ref="diagram" class="diagramContainer"></div>
</template>
<style>
.diagramContainer {
    flex: 1 1;
}
.palette-icon-lasso-tool {
    background: url('data:image/svg+xml,%3Csvg%0A%20%20%20%20%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20%0A%20%20%20%20%20fill%3D%22none%22%0A%20%20%20%20%20stroke%3D%22%23000%22%0A%20%20%20%20%20stroke-width%3D%221.5%22%0A%20%20%20%20%20width%3D%2246%22%0A%20%20%20%20%20height%3D%2246%22%3E%0A%20%20%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2216%22%20height%3D%2216%22%20stroke-dasharray%3D%225%2C%205%22%20%2F%3E%0A%20%20%3Cline%20x1%3D%2216%22%20y1%3D%2226%22%20x2%3D%2236%22%20y2%3D%2226%22%20stroke%3D%22black%22%20%2F%3E%0A%20%20%3Cline%20x1%3D%2226%22%20y1%3D%2216%22%20x2%3D%2226%22%20y2%3D%2236%22%20stroke%3D%22black%22%20%2F%3E%0A%3C%2Fsvg%3E');
}

.palette-icon-create-class {
    background: url('icons/class.svg');
    background-repeat: no-repeat;
    background-size: 100%;
}

.context-pad-icon-remove {
    background: url('diagram/deleteShapeDark.svg') !important;
}

.context-pad-icon-connect {
    background: url('diagram/createGeneralizationDark.svg') !important;
}

.context-pad-icon-directed-composition {
    background: url('diagram/directedComposition.svg') !important;
}
@import "diagram-js/assets/diagram-js.css"
</style>
