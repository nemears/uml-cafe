<script>
import UmlWebClient from 'uml-js/lib/umlClient';
import ElementType from './specComponents/ElementType.vue';
import StringData from './specComponents/StringData.vue';
import SetData from './specComponents/SetData.vue';
import getImage from '../GetUmlImage.vue';
export default {
    props: ['umlID'],
    emits: ['specification', 'dataChange'],
    inject: ['dataChange'],
    data() {
        return {
            elementType: '',
            elementImage: undefined,
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
        },
        dataChange(newDataChange, oldDataChange) {
            if (newDataChange.id === this.umlID && newDataChange.type === 'name') {
                this.namedElementData.name = newDataChange.value;
            }
        }
    },
    methods: {
        async reloadSpec() {
            const client = new UmlWebClient(this.$sessionName);
            const el = await client.get(this.umlID);
            this.elementType = el.elementType();
            this.elementImage = getImage(el);
            this.elementData.ownedElements = [];
            for await(let ownedElement of el.ownedElements) {
                this.elementData.ownedElements.push({
                    img: getImage(ownedElement),
                    label: ownedElement.name !== undefined && ownedElement.name !== '' ? ownedElement.name : ownedElement.id,
                    id: ownedElement.id
                })
            }
            const owner = await el.owner.get();
            if (owner !== undefined) {
                this.elementData.owner = {
                    img: getImage(owner),
                    label: owner.name !== undefined && owner.name !== '' ? owner.name : owner.id,
                    id: owner.id
                }
            }
            // TODO rest of ELEMENT


            if (el.isSubClassOf('namedElement')) {
                this.namedElementData = {
                    name: el.name
                };
            }
        },
        propogateSpecification(spec) {
            this.$emit('specification', spec);
        },
        propogateDataChange(dataChange) {
            if (dataChange.type === 'name') {
                this.namedElementData.name = dataChange.value;
            }
            this.$emit('dataChange', dataChange);
        }
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
        <div class="headerDiv">
            <h1>
                Specification of {{ elementType }} {{ elementLabel }}
            </h1>
            <img v-bind:src="elementImage" v-if="elementImage !== undefined" class="headerImage"/>
        </div>
        <ElementType :element-type="'Element'">
            <StringData :label="'ID'" :initial-data="umlID" :read-only="true" :umlid="umlID" :type="'id'" @data-change="propogateDataChange"></StringData>
            <SetData :label="'Owned Elements'" :initial-data="elementData.ownedElements" :umlid="umlID" :subsets="['ownedAttributes', 'packagedElements']" @specification="propogateSpecification"></SetData>
        </ElementType>
        <ElementType :element-type="'Named Element'" v-if="namedElementData !== undefined">
            <StringData :label="'Name'" :initial-data="namedElementData.name" :read-only="false" :umlid="umlID" :type="'name'" 
            @data-change="propogateDataChange"></StringData>
        </ElementType>
    </div>
</template>
<style>
.mainDiv {
    border: solid #525258;
    border-width: 2px;
    padding: 10px;
    margin:auto;
    width: 1000px;
    overflow: auto;
}
.headerDiv {
    display: flex;
}
.headerImage {
    height: 50px;
    width: 50px;
    padding-left: 10px;
}
</style>