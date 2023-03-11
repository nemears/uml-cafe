<script>
import UmlWebClient from 'uml-js/lib/umlClient';
import ElementType from './specComponents/ElementType.vue';
import StringData from './specComponents/StringData.vue';
import SetData from './specComponents/SetData.vue';
export default {
    props: ['umlID'],
    emits: ['specification'],
    data() {
        return {
            elementType: '',
            elementData: {
                ownedElements : [],
                owner : undefined,
                appliedStereotypes: [],
                // etc...
            },
            namedElementData : undefined
        }
    },
    mounted() {
        this.reloadSpec();
    },
    watch: {
        umlID(newID, oldID) {
            this.reloadSpec();
        }
    },
    methods: {
        async reloadSpec() {
            const client = new UmlWebClient(this.$sessionName);
            const el = await client.get(this.umlID);
            this.elementType = el.elementType();
            this.elementData.ownedElements = [];
            for await(let ownedElement of el.ownedElements) {
                this.elementData.ownedElements.push({
                    img: undefined,
                    label: ownedElement.name !== undefined && ownedElement.name !== '' ? ownedElement.name : ownedElement.id,
                    id: ownedElement.id
                })
            }
            // TODO check if named element
            this.namedElementData = {
                name: el.name
            };
        },
        propogateSpecification(spec) {
            this.$emit('specification', spec);
        },
    },
    computed: {
        elementLabel() {
            if (this.namedElementData !== undefined && this.namedElementData.name !== '') {
                return this.namedElementData.name;
            } else {
                return this.umlID;
            }
        },
    },
    components: { ElementType, StringData, SetData }
}
</script>
<template>
    <div class="mainDiv">
        <h1>
            Specification of {{ elementType }} {{ elementLabel }}
        </h1>
        <ElementType :element-type="'Element'">
            <StringData :label="'ID'" :initial-data="umlID" :read-only="true"></StringData>
            <SetData :label="'Owned Elements'" :initial-data="elementData.ownedElements" @specification="propogateSpecification"></SetData>
        </ElementType>
    </div>
</template>
<style>
.mainDiv {
    border: solid #525258;
    border-width: 2px;
    padding: 10px;
    margin:auto;
    width: 1000px
}
</style>