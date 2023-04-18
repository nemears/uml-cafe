<script>
import ElementType from './specComponents/ElementType.vue';
import StringData from './specComponents/StringData.vue';
import SetData from './specComponents/SetData.vue';
import getImage from '../GetUmlImage.vue';
import SingletonData from './specComponents/SingletonData.vue';
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
            namedElementData : undefined,
            isFetching: true
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
            this.isFetching = true;
            const el = await this.$umlWebClient.get(this.umlID);
            this.elementType = el.elementType();
            this.elementImage = getImage(el);
            
            // helper lambdas
            const reloadSingleton = async (elementTypeData, singleton, singletonName) => {
                const singletonValue = await singleton.get();
                if (singletonValue !== undefined) {
                    elementTypeData[singletonName] = {
                        img: getImage(singletonValue),
                        label: singletonValue.name !== undefined ? singletonValue.name : '',
                        id: singletonValue.id
                    }
                } else {
                    elementTypeData[singletonName] = undefined;
                }
                return elementTypeData;
            };

            const reloadSet = async (elementTypeData, set, setName) => {
                elementTypeData[setName] = [];
                for await (let element of set) {
                    elementTypeData[setName].push({
                        img: getImage(element),
                        label: element.name !== undefined ? element.name : '',
                        id: element.id
                    });
                }
                return elementTypeData;
            };

            await reloadSet(this.elementData, el.ownedElements, 'ownedElements');
            reloadSingleton(this.elementData, el.owner, 'owner');
            reloadSet(this.elementData, el.appliedStereotypes, 'appliedStereotypes');
            // TODO rest of ELEMENT


            if (el.isSubClassOf('namedElement')) {
                this.namedElementData = {
                    name: el.name
                };
                reloadSingleton(this.namedElementData, el.namespace, 'namespace');
            } else {
                this.namedElementData = undefined;
            }

            if (el.isSubClassOf('relationship')) {
                this.relationshipData = {};
                await reloadSet(this.relationshipData, el.relatedElements, 'relatedElements');
            } else {
                this.relationshipData = undefined;
            }

            if (el.isSubClassOf('directedRelationship')) {
                this.directedRelationshipData = {};
                await reloadSet(this.directedRelationshipData, el.targets, 'targets');
                await reloadSet(this.directedRelationshipData, el.sources, 'sources');
            } else {
                this.directedRelationshipData = undefined;
            }

            if (el.isSubClassOf('generalization')) {
                this.generalizationData = {};
                await reloadSingleton(this.generalizationData, el.specific, 'specific');
                await reloadSingleton(this.generalizationData, el.general, 'general');
            } else {
                this.generalizationData = undefined;
            }

            if (el.isSubClassOf('namespace')) {
                this.namespaceData = {};
                this.namespaceData.members = [];
                for await (let member of el.members) {
                    this.namespaceData.members.push({
                        img: getImage(member),
                        label: member.name !== undefined && member.name !== '' ? member.name : member.id,
                        id: member.id
                    });
                }
                this.namespaceData.ownedMembers = [];
                for await (let member of el.ownedMembers) {
                    this.namespaceData.ownedMembers.push({
                        img: getImage(member),
                        label: member.name !== undefined && member.name !== '' ? member.name : member.id,
                        id: member.id
                    });
                }
            } else {
                this.namespaceData = undefined;
            }

            if (el.isSubClassOf('typedElement')) {
                this.typedElementData = {};
                reloadSingleton(this.typedElementData, el.type, 'type');
            } else {
                this.typedElementData = undefined;
            }

            if (el.isSubClassOf('packageableElement')) {
                this.packageableElementData = {};
                const owningPackage = await el.owningPackage.get();
                if (owningPackage !== undefined) {
                    this.packageableElementData.owningPackage = {
                        img: getImage(owningPackage),
                        label: owningPackage.name !== undefined && owningPackage.name !== '' ? owningPackage.name : owningPackage.id,
                        id: owningPackage.id
                    };
                }
            } else {
                this.packageableElementData = undefined;
            }

            if (el.isSubClassOf('package')) {
                this.packageData = {};
                this.packageData.packagedElements = [];
                for await (let packagedElement of el.packagedElements) {
                    this.packageData.packagedElements.push({
                        img: getImage(packagedElement),
                        label: packagedElement.name !== undefined && packagedElement.name !== '' ? packagedElement.name : packagedElement.id,
                        id: packagedElement.id
                    });
                }
            } else {
                this.packageData = undefined;
            }

            if (el.isSubClassOf('multiplicityElement')) {
                this.multiplicityElementData = {};
                reloadSingleton(this.multiplicityElementData, el.lowerValue, 'lowerValue');
                reloadSingleton(this.multiplicityElementData, el.upperValue, 'upperValue');
            } else {
                this.multiplicityElementData = undefined;
            }

            if (el.isSubClassOf('property')) {
                this.propertyData = {};
                const clazz = await el.clazz.get();
                if (clazz !== undefined) {
                    this.propertyData.clazz = {
                        img: getImage(clazz),
                        label: clazz.name !== undefined && clazz.name !== '' ? clazz.name : clazz.id,
                        id: clazz.id
                    }
                }
            } else {
                this.propertyData = undefined;
            }

            if (el.isSubClassOf('classifier')) {
                this.classifierData = {};
                await reloadSet(this.classifierData, el.generalizations, 'generalizations');
                this.classifierData.attributes = [];
                for await (let attribute of el.attributes) {
                    this.classifierData.attributes.push({
                        img: getImage(attribute),
                        label: attribute.name !== undefined && attribute.name !== '' ? attribute.name : attribute.id,
                        id: attribute.id
                    })
                }
            } else {
                this.classifierData = undefined;
            }

            if (el.isSubClassOf('primitiveType')) {
                this.primitiveTypeData = {};
                this.primitiveTypeData.ownedAttributes = [];
                for await (let attribute of el.ownedAttributes) {
                    this.primitiveTypeData.attributes.push({
                        img: getImage(attribute),
                        label: attribute.name !== undefined && attribute.name !== '' ? attribute.name : attribute.id,
                        id: attribute.id
                    })
                }
            } else {
                this.primitiveTypeData = undefined;
            }

            if (el.isSubClassOf('structuredClassifier')) {
                this.structuredClassifierData = {};
                this.structuredClassifierData.ownedAttributes = [];
                for await (let attribute of el.ownedAttributes) {
                    this.structuredClassifierData.ownedAttributes.push({
                        img: getImage(attribute),
                        label: attribute.name !== undefined && attribute.name !== '' ? attribute.name : attribute.id,
                        id: attribute.id
                    })
                }
            } else {
                this.structuredClassifierData = undefined;
            }

            if (el.isSubClassOf('class')) {
                this.classData = {};
                this.classData.ownedAttributes = [];
                for await (let attribute of el.ownedAttributes) {
                    this.classData.ownedAttributes.push({
                        img: getImage(attribute),
                        label: attribute.name !== undefined && attribute.name !== '' ? attribute.name : attribute.id,
                        id: attribute.id
                    })
                }
            } else {
                this.classData = undefined;
            }

            this.isFetching = false;
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
    components: { ElementType, StringData, SetData, SingletonData }
}
</script>
<template>
    <div class="mainDiv" v-if="!isFetching">
        <div class="headerDiv">
            <h1>
                Specification of {{ elementType }} {{ elementLabel }}
            </h1>
            <img v-bind:src="elementImage" v-if="elementImage !== undefined" class="headerImage"/>
        </div>
        <ElementType :element-type="'Element'">
            <StringData :label="'ID'" :initial-data="umlID" :read-only="true" :umlid="umlID" :type="'id'" @data-change="propogateDataChange"></StringData>
            <SetData :label="'Owned Elements'" :initial-data="elementData.ownedElements" :umlid="umlID" :subsets="['ownedAttributes', 'packagedElements', 'generalizations']" 
                    @specification="propogateSpecification"></SetData>
            <SingletonData :label="'Owner'" :readonly="true" :inital-data="elementData.owner" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
            <SetData :label="'Applied Stereotypes'" :initial-data="elementData.appliedStereotypes" :umlid="umlID" @specification="propogateSpecification"></SetData>
        </ElementType>
        <ElementType :element-type="'Named Element'" v-if="namedElementData !== undefined">
            <StringData :label="'Name'" :initial-data="namedElementData.name" :read-only="false" :umlid="umlID" :type="'name'" 
            @data-change="propogateDataChange"></StringData>
            <SingletonData :label="'Namespace'" :readonly="true" :inital-data="namedElementData.namespace" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
        </ElementType>
        <ElementType :element-type="'Relationship'" v-if="relationshipData !== undefined">
            <SetData :label="'Related Elements'" :readonly="true" :initial-data="relationshipData.relatedElements" :umlid="umlID" @specification="propogateSpecification" :subsets="['general', 'specific']"></SetData>
        </ElementType>
        <ElementType :element-type="'Directed Relationship'" v-if="directedRelationshipData !== undefined">
            <SetData :label="'Targets'" :readonly="true" :initial-data="directedRelationshipData.targets" :umlid="umlID" @specification="propogateSpecification"></SetData>
            <SetData :label="'Sources'" :readonly="true" :initial-data="directedRelationshipData.sources" :umlid="umlID" @specification="propogateSpecification"></SetData>
        </ElementType>
        <ElementType :element-type="'Generalization'" v-if="generalizationData !== undefined">
            <SingletonData :label="'Specific'" :inital-data="generalizationData.specific" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
            <SingletonData :label="'General'" :inital-data="generalizationData.general" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
        </ElementType>
        <ElementType :element-type="'Typed Element'" v-if="typedElementData !== undefined">
            <SingletonData :label="'Type'" :inital-data="typedElementData.type" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
        </ElementType>
        <ElementType :element-type="'Multiplicity Element'" v-if="multiplicityElementData !== undefined">
            <SingletonData :label="'Lower Value'" :inital-data="multiplicityElementData.lowerValue" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
            <SingletonData :label="'Upper Value'" :inital-data="multiplicityElementData.upperValue" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
        </ElementType>
        <ElementType :element-type="'Property'" v-if="propertyData !== undefined">
            <SingletonData :label="'Class'" :inital-data="propertyData.clazz" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
        </ElementType>
        <ElementType :element-type="'Namespace'" v-if="namespaceData !== undefined">
            <SetData :label="'Members'" :initial-data="namespaceData.members" :umlid="umlID" :subsets="['ownedAttributes', 'packagedElements']"
                    @specification="propogateSpecification"></SetData>
            <SetData :label="'Owned Members'" :initial-data="namespaceData.ownedMembers" :umlid="umlID" :subsets="['ownedAttributes', 'packagedElements']"
                        @specification="propogateSpecification"></SetData>
        </ElementType>
        <ElementType :element-type="'Packageable Element'" v-if="packageableElementData !== undefined">
            <SingletonData :label="'OwningPackage'" :inital-data="packageableElementData.owningPackage" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
        </ElementType>
        <ElementType :element-type="'Package'" v-if="packageData !== undefined">
            <SetData :label="'Packaged Elements'" :initial-data="packageData.packagedElements" :umlid="umlID" :subsets="['packagedElements']"
                    @specification="propogateSpecification"></SetData>
        </ElementType>
        <ElementType :elementType="'Classifier'" v-if="classifierData !== undefined">
            <SetData :label="'Generalizations'" :initial-data="classifierData.generalizations" :umlid="umlID" :subsets="['generalizations']" @specification="propogateSpecification"></SetData>
            <SetData :label="'Attributes'" :initial-data="classifierData.attributes" :umlid="umlID" :subsets="['ownedAttributes']"
                        @specification="propogateSpecification"></SetData>
        </ElementType>
        <ElementType :elementType="'Primitive Type'" v-if="primitiveTypeData !== undefined">
            <SetData :label="'Owned Attributes'" :initial-data="primitiveTypeData.ownedAttributes" :umlid="umlID" :subsets="['ownedAttributes']"
                        @specification="propogateSpecification"></SetData>
        </ElementType>
        <ElementType :elementType="'Structured Classifier'" v-if="structuredClassifierData !== undefined">
            <SetData :label="'Owned Attributes'" :initial-data="structuredClassifierData.ownedAttributes" :umlid="umlID" :subsets="['ownedAttributes']"
                        @specification="propogateSpecification"></SetData>
        </ElementType>
        <ElementType :elementType="'Class'" v-if="classData !== undefined">
            <SetData :label="'Owned Attributes'" :initial-data="classData.ownedAttributes" :umlid="umlID" :subsets="['ownedAttributes']"
                        @specification="propogateSpecification"></SetData>
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
    height: 90vh;
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