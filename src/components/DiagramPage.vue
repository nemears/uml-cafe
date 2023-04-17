<script>
import { Editor } from './diagram/editor';
const EventEmitter = require('events');
export default {
    data() {
        return {
            emitter : undefined
        };
    },
    props: ['umlID'],
    emits: ['dataChange'],
    inject: ['dataChange'],
    watch : {
        dataChange(newDataChange, oldDataChange) {
            if (newDataChange.type === 'name') {
                this.emitter.emit('rename', newDataChange);
            }
        }
    },
    async mounted() {
        const scopedEmitter = new EventEmitter();
        const diagramPackage = await this.$umlWebClient.get(this.umlID);
        const diagram = new Editor({
            container: this.$refs.diagram,
            umlWebClient: this.$umlWebClient,
            emitter: scopedEmitter,
            context: await diagramPackage.owningPackage.get(),
            diagramElement: diagramPackage
        });
        const canvas = diagram.get('canvas');
        const elementFactory = diagram.get('elementFactory');

        // add root
        var root = elementFactory.createRoot();

        canvas.setRootElement(root);

        // TODO set up diagram with shapes

        // draw all shapes
        for await (let packagedEl of diagramPackage.packagedElements) {
            if (!packagedEl.isSubClassOf('instanceSpecification')) {
                continue;
            }
            if (!packagedEl.classifiers.contains('&7qxHqMCh5Cwd3&s053vQD&xPsAK')) {
                continue;
            }
            // draw shape
            let pointInstance = undefined;
            let widthValue = undefined;
            let heightValue = undefined;
            let elementID = undefined;
            for await (let slot of packagedEl.slots) {
                if (slot.definingFeature.id() === 'bHizRf2FLBphg0iYSQsXnbn_BJ2c') {
                    pointInstance = await (await slot.values.front()).instance.get();
                } else if (slot.definingFeature.id() === 'MbxzX87yGS4s8kl&FehOVttIWs2q') {
                    widthValue = (await slot.values.front()).value;
                } else if (slot.definingFeature.id() === 'pmvMVFeRTg6QF87n8ey97MIyopwb') {
                    heightValue = (await slot.values.front()).value;
                } else if (slot.definingFeature.id() === '5aQ4hcDk32eSc3R&84uIyACddmu0') {
                    elementID = (await slot.values.front()).value;
                }
            }

            let xValue = undefined;
            let yValue = undefined;
            for await (let slot of pointInstance.slots) {
                if (slot.definingFeature.id() === 'TL9YRNP&uSq5O&ZX0BNUqSl3uHTO') {
                    xValue = (await slot.values.front()).value;
                } else if (slot.definingFeature.id() === 'WQEwSh2OYmb1Yj2Hu5Fdk_S6qFP5') {
                    yValue = (await slot.values.front()).value;
                }
            }

            const elShapeIsRepresenting = await this.$umlWebClient.get(elementID);
            const name = elShapeIsRepresenting.name ? elShapeIsRepresenting.name : '';

            const shape = elementFactory.createShape({
                x: xValue,
                y: yValue,
                width: widthValue,
                height: heightValue,
                elementID: elementID,
                shapeID: packagedEl.id,
                name: name,
                umlType: elShapeIsRepresenting.elementType(),
                newUMLElement: false
            });
            canvas.addShape(shape);
        }

        const diagramPage = this;
        // handle emits from diagram to update rest of app
        scopedEmitter.on('shape.added', function(event) {
            diagramPage.$emit('dataChange', {
                            id: diagramPackage.owningPackage.id(),
                            type: 'add',
                            set: 'packagedElements',
                            el: event.element.elementID
                        });
        });
        this.emitter = Object.freeze(scopedEmitter);
    },
    methods: {
        onDrop(event, list) {
            console.log('dropped on diagram');
            // TODO draw element on diagram
        }
    }
}
</script>
<template>
    <div ref="diagram" class="diagramContainer" 
        @drop="onDrop($event, 1)"
        @dragover.prevent
        @dragenter.prevent></div>
</template>
<style>
.diagramContainer {
    height: 90vh;
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