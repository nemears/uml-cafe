<script>
import ElementType from './specComponents/ElementType.vue';
import StringData from './specComponents/StringData.vue';
import SetData from './specComponents/SetData.vue';
import getImage from '../GetUmlImage.vue';
import SingletonData from './specComponents/SingletonData.vue';
import IntegerData from './specComponents/IntegerData.vue';
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
            for (let data of newDataChange.data) {
                if (data.id === this.umlID && data.type === 'name') {
                    this.namedElementData.name = data.value;
                }
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
                await reloadSet(this.namespaceData, el.members, 'members');
                await reloadSet(this.namespaceData, el.ownedMembers, 'ownedMembers');
            } else {
                this.namespaceData = undefined;
            }

            if (el.isSubClassOf('typedElement')) {
                this.typedElementData = {};
                reloadSingleton(this.typedElementData, el.type, 'type');
            } else {
                this.typedElementData = undefined;
            }

            if (el.isSubClassOf('literalInt')) {
                this.literalIntData = {};
                this.literalIntData.value = el.value;
            } else {
                this.literalIntData = undefined;
            }

            if (el.isSubClassOf('packageableElement')) {
                this.packageableElementData = {};
                reloadSingleton(this.packageableElementData, el.owningPackage, 'owningPackage');
            } else {
                this.packageableElementData = undefined;
            }

            if (el.isSubClassOf('package')) {
                this.packageData = {};
                await reloadSet(this.packageData, el.packagedElements, 'packagedElements');
            } else {
                this.packageData = undefined;
            }

            if (el.isSubClassOf('instanceSpecification')) {
		this.instanceSpecificationData = {};
                await reloadSet(this.instanceSpecificationData, el.classifiers, 'classifiers');
		await reloadSet(this.instanceSpecificationData, el.slots, 'slots');
                // TODO specifications
            } else {
                this.instanceSpecificationData = undefined;
            }

            if (el.isSubClassOf('slot')) {
                this.slotData = {};
		await reloadSingleton(this.slotData, el.owningInstance, 'owningInstance');
		await reloadSet(this.slotData, el.values, 'values');
                await reloadSingleton(this.slotData, el.definingFeature, 'definingFeature');
            } else {
                this.slotData = undefined;
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
                await reloadSingleton(this.propertyData, el.clazz, 'clazz');
                await reloadSingleton(this.propertyData, el.dataType, 'dataType');
                await reloadSingleton(this.propertyData, el.owningAssociation, 'owningAssociation');
                await reloadSingleton(this.propertyData, el.association, 'association');
            } else {
                this.propertyData = undefined;
            }

            if (el.isSubClassOf('classifier')) {
                this.classifierData = {};
                await reloadSet(this.classifierData, el.generalizations, 'generalizations');
                await reloadSet(this.classifierData, el.features, 'features');
                await reloadSet(this.classifierData, el.attributes, 'attributes');
            } else {
                this.classifierData = undefined;
            }

            if (el.isSubClassOf('primitiveType')) {
                this.primitiveTypeData = {};
                await reloadSet(this.primitiveTypeData, el.ownedAttributes, 'ownedAttributes');
            } else {
                this.primitiveTypeData = undefined;
            }

            if (el.isSubClassOf('structuredClassifier')) {
                this.structuredClassifierData = {};
                await reloadSet(this.structuredClassifierData, el.ownedAttributes, 'ownedAttributes');
            } else {
                this.structuredClassifierData = undefined;
            }

            if (el.isSubClassOf('class')) {
                this.classData = {};
                await reloadSet(this.classData, el.ownedAttributes, 'ownedAttributes');
            } else {
                this.classData = undefined;
            }

            if (el.isSubClassOf('association')) {
                this.associationData = {};
                await reloadSet(this.associationData, el.memberEnds, 'memberEnds');
                await reloadSet(this.associationData, el.ownedEnds, 'ownedEnds');
                await reloadSet(this.associationData, el.navigableOwnedEnds, 'navigableOwnedEnds');
            } else {
                this.associationData = undefined;
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
    components: { ElementType, StringData, SetData, SingletonData, IntegerData }
}
</script>
<template>
    <div class="mainDiv" v-if="!isFetching">
        <div class="horizontalScroll">
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
                <SingletonData 
                               :label="'Type'" 
                               :inital-data="typedElementData.type" 
                               :uml-i-d="umlID" 
                               :singleton-data="{setName:'type',validTypes:['classifier']}" 
                               @specification="propogateSpecification"></SingletonData>
            </ElementType>
            <ElementType :element-type="'Literal Int'" v-if="literalIntData !== undefined">
                <IntegerData :label="'Value'" :initial-data="literalIntData.value" :umlid="umlID" :type="'value'"></IntegerData>
            </ElementType>
            <ElementType :element-type="'Multiplicity Element'" v-if="multiplicityElementData !== undefined">
                <SingletonData :label="'Lower Value'" :createable="{types:['literalInt'], set:'lowerValue'}" :inital-data="multiplicityElementData.lowerValue" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
                <SingletonData :label="'Upper Value'" :createable="{types:['literalInt', 'literalUnlimitedNatural'], set:'upperValue'}" :inital-data="multiplicityElementData.upperValue" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
            </ElementType>
            <ElementType :element-type="'Property'" v-if="propertyData !== undefined">
                <SingletonData :label="'Class'" :inital-data="propertyData.clazz" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
                <SingletonData :label="'DataType'" :inital-data="propertyData.dataType" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
                <SingletonData :label="'Owning Association'" :inital-data="propertyData.owningAssociation" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
                <SingletonData :label="'Association'" :inital-data="propertyData.association" :uml-i-d="umlID" @specification="propogateSpecification"></SingletonData>
            </ElementType>
            <ElementType :element-type="'Namespace'" v-if="namespaceData !== undefined">
                <SetData :label="'Members'" :initial-data="namespaceData.members" :umlid="umlID" :subsets="['ownedAttributes', 'packagedElements']"
                        @specification="propogateSpecification"></SetData>
                <SetData :label="'Owned Members'" :initial-data="namespaceData.ownedMembers" :umlid="umlID" :subsets="['ownedAttributes', 'packagedElements']"
                            @specification="propogateSpecification"></SetData>
            </ElementType>
            <ElementType :element-type="'Packageable Element'" v-if="packageableElementData !== undefined">
                <SingletonData :label="'OwningPackage'" 
                               :inital-data="packageableElementData.owningPackage" 
                               :uml-i-d="umlID" 
                               @specification="propogateSpecification"></SingletonData>
            </ElementType>
            <ElementType :element-type="'Package'" v-if="packageData !== undefined">
                <SetData    :label="'Packaged Elements'" 
                            :initial-data="packageData.packagedElements" 
                            :umlid="umlID" 
                            :subsets="['packagedElements']"
                            :creatable="{types:['class', 'package'], set:'packagedElements'}" 
                            @specification="propogateSpecification"
                            @data-change="propogateDataChange"></SetData>
            </ElementType>
            <ElementType :element-type="'Instance Specification'" v-if="instanceSpecificationData !== undefined">
                <SetData   :label="'Classifiers'"
                           :initial-data="instanceSpecificationData.classifiers"
                           :umlid="umlID"
                           :subsets="[]"
                           :set-data="{setName:'classifiers',validTypes:['classifier']}"
                           @specification="propogateSpecification"
                           @data-change="propogateDataChange"></SetData>
		<SetData   :label="'Slots'"
                           :initial-data="instanceSpecificationData.slots"
                           :umlid="umlID"
                           :subsets="[]"
                           :creatable="{types:['slot'], set:'slots'}"
                           @specification="propogateSpecification"
                           @data-change="propogateDataChange"></SetData>

            </ElementType>
            <ElementType :element-type="'Slot'" v-if="slotData !== undefined">
                <SingletonData
                           :label="'Owning Instance'"
                           :inital-data="slotData.owningInstance"
                           :uml-i-d="umlID" 
                           @specification="propogateSpecification"
                           @data-change="propogateDataChange"></SingletonData>
                <SetData   :label="'Values'"
                           :initial-data="slotData.values"
                           :umlid="umlID"
                           :subsets="[]"
                           :creatable="{types:['literalInt', 'literalNull', 'literalReal', 'literalString', 'literalUnlimitedNatural'], set:'values'}"
                           @specification="propogateSpecification"
                           @data-change="propogateDataChange"></SetData>
                <SingletonData
                           :label="'Defining Feature'"
                           :inital-data="slotData.definingFeature"
                           :uml-i-d="umlID"
                           :singleton-data="{ setName: 'definingFeature', validTypes: ['property'] }"
                           @specification="propogateSpecification"
                           @data-change="propogateDataChange"></SingletonData>
            </ElementType>
            <ElementType :elementType="'Classifier'" v-if="classifierData !== undefined">
                <SetData    :label="'Generalizations'" 
                            :initial-data="classifierData.generalizations" 
                            :umlid="umlID" 
                            :subsets="['generalizations']" 
                            :creatable="{types:['generalization'], set: 'generalizations'}"
                            @specification="propogateSpecification"
                            @data-change="propogateDataChange"></SetData>
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
            <ElementType :element-type="'Association'" v-if="associationData !== undefined">
                <SetData :label="'Member Ends'" :initial-data="associationData.memberEnds" :umlid="umlID" :subsets="['ownedEnds', 'navigableOwnedEnds']"
                            @specification="propogateSpecification"></SetData>
                <SetData :label="'Owned Ends'" :initial-data="associationData.ownedEnds" :umlid="umlID" :subsets="['navigableOwnedEnds']"
                            @specification="propogateSpecification"></SetData>
                <SetData :label="'Navigable Owned Ends'" :initial-data="associationData.navigableOwnedEnds" :umlid="umlID"
                            @specification="propogateSpecification"></SetData>
            </ElementType>
            <ElementType :elementType="'Class'" v-if="classData !== undefined">
                <SetData    :label="'Owned Attributes'" 
                            :initial-data="classData.ownedAttributes" 
                            :umlid="umlID" 
                            :subsets="['ownedAttributes']"
                            :creatable="{types:['property'], set: 'ownedAttributes'}"
                            @specification="propogateSpecification"
                            @data-change="propogateDataChange"></SetData>
            </ElementType>
      </div> 
  </div>
</template>
<style>
.mainDiv {
    border: solid #525258;
    border-width: 2px;
    padding: 10px;
    margin:auto;
    height: 80vh;
    width: 69vw;
    overflow-y: auto;
}
.horizontalScroll{
    overflow-x: auto;
    width: 1000px;
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
