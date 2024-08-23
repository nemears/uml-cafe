<script>
import ElementType from './specComponents/ElementType.vue';
import SetData from './specComponents/SetData.vue';
import getImage from '../GetUmlImage.vue';
import SingletonData from './specComponents/SingletonData.vue';
import InputData from './specComponents/InputData.vue';
import EnumerationData from './specComponents/EnumerationData.vue';
import MultiplicitySelector from './specComponents/MultiplicitySelector.vue';
import { assignTabLabel } from '../umlUtil';
import LiteralUnlimitedNaturalData from './specComponents/LiteralUnlimitedNaturalData.vue';
export default {
    props: [
        'umlID', 
        'selectedElements',
        'users',
        'theme',
    ],
    emits: [
        'specification', 
        'elementUpdate',
        'select',
        'deselect',
    ],
    inject: ['elementUpdate'],
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
        umlID() {
            this.reloadSpec();
        },
        elementUpdate(newElementUpdate) {
            for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                // const oldElement = newElementUpdate.oldElement;
                if (newElement) {
                    if (newElement.id === this.umlID) {
                        if (newElement.is('NamedElement')) {
                            if (newElement.name !== this.namedElementData.name) {
                                this.namedElementData.name = newElement.name;
                            }
                        }
                    }
                } 
            }
            
        },
    },
    methods: {
        async reloadSpec() {
            this.isFetching = true;
            const el = await this.$umlWebClient.get(this.umlID);
            this.elementType = el.elementType();
            this.elementImage = getImage(el);
            
            // helper lambdas
            const reloadSingleton = (elementTypeData, singleton, singletonName) => {
                elementTypeData[singletonName] = singleton.id();
                return elementTypeData;
            };

            const reloadSet = (elementTypeData, set, setName) => {
                elementTypeData[setName] = [];
                for (const elID of set.ids()) {
                    elementTypeData[setName].push({
                        id: elID
                    });
                }
                return elementTypeData;
            };

            reloadSet(this.elementData, el.ownedElements, 'ownedElements');
            reloadSingleton(this.elementData, el.owner, 'owner');
            reloadSet(this.elementData, el.appliedStereotypes, 'appliedStereotypes');
            reloadSet(this.elementData, el.ownedComments, 'ownedComments');
            // TODO rest of ELEMENT

            if (el.is('NamedElement')) {
                this.namedElementData = {
                    name: el.name
                };
                reloadSingleton(this.namedElementData, el.namespace, 'namespace');
                reloadSet(this.namedElementData, el.clientDependencies, 'clientDependencies');
            } else {
                this.namedElementData = undefined;
            }

            if (el.is('RedefinableElement')) {
                this.redefinableElementData = {};
                this.redefinableElementData.isLeaf = el.isLeaf;
                reloadSet(this.redefinableElementData, el.redefinedElements, 'redefinedElements');
                reloadSet(this.redefinableElementData, el.redefinitionContexts, 'redefinitionContexts');
            } else {
                this.redefinableElementData = undefined;
            }

            if (el.is('Relationship')) {
                this.relationshipData = {};
                reloadSet(this.relationshipData, el.relatedElements, 'relatedElements');
            } else {
                this.relationshipData = undefined;
            }

            if (el.is('DirectedRelationship')) {
                this.directedRelationshipData = {};
                reloadSet(this.directedRelationshipData, el.targets, 'targets');
                reloadSet(this.directedRelationshipData, el.sources, 'sources');
            } else {
                this.directedRelationshipData = undefined;
            }

            if (el.is('Generalization')) {
                this.generalizationData = {};
                reloadSingleton(this.generalizationData, el.specific, 'specific');
                reloadSingleton(this.generalizationData, el.general, 'general');
            } else {
                this.generalizationData = undefined;
            }

            if (el.is('Namespace')) {
                this.namespaceData = {};
                reloadSet(this.namespaceData, el.members, 'members');
                reloadSet(this.namespaceData, el.ownedMembers, 'ownedMembers');
            } else {
                this.namespaceData = undefined;
            }

            if (el.is('TypedElement')) {
                this.typedElementData = {};
                reloadSingleton(this.typedElementData, el.type, 'type');
            } else {
                this.typedElementData = undefined;
            }

            if (el.is('Enumeration')) {
                this.enumerationData = {};
                reloadSet(this.enumerationData, el.ownedLiterals, 'ownedLiterals');
            } else {
                this.enumerationData = undefined;
            }

            if (el.is('EnumerationLiteral')) {
                this.enumerationLiteralData = {};
                reloadSingleton(this.enumerationLiteralData, el.enumeration, 'enumeration');
            } else {
                this.enumerationLiteralData = undefined;
            }

            if (el.is('LiteralBool')) {
                this.literalBoolData = {};
                this.literalBoolData.value = el.value;
            } else {
                this.literalBoolData = undefined;
            }

            if (el.is('LiteralInt')) {
                this.literalIntData = {};
                this.literalIntData.value = el.value;
            } else {
                this.literalIntData = undefined;
            }

            if (el.is('LiteralReal')) {
                this.literalRealData = {};
                this.literalRealData.value = el.value;
            } else {
                this.literalRealData = undefined;
            }

            if (el.is('LiteralString')) {
                this.literalStringData = {};
                this.literalStringData.value = el.value;
            } else {
                this.literalStringData = undefined;
            }

            if (el.is('LiteralUnlimitedNatural')) {
                this.literalUnlimitedNaturalData = {};
                this.literalUnlimitedNaturalData.value = el.value;
            } else {
                this.literalUnlimitedNaturalData = undefined;
            }

            if (el.is('PackageableElement')) {
                this.packageableElementData = {};
                reloadSingleton(this.packageableElementData, el.owningPackage, 'owningPackage');
            } else {
                this.packageableElementData = undefined;
            }

            if (el.is('Dependency')) {
                this.dependencyData = {};
                reloadSet(this.dependencyData, el.clients, 'clients');
                reloadSet(this.dependencyData, el.suppliers, 'suppliers');
            } else {
                this.dependencyData = undefined;
            }

            if (el.is('Package')) {
                this.packageData = {};
                reloadSet(this.packageData, el.packagedElements, 'packagedElements');
            } else {
                this.packageData = undefined;
            }

            if (el.is('InstanceSpecification')) {
                this.instanceSpecificationData = {};
                reloadSet(this.instanceSpecificationData, el.classifiers, 'classifiers');
                reloadSet(this.instanceSpecificationData, el.slots, 'slots');
                // TODO specifications
            } else {
                this.instanceSpecificationData = undefined;
            }

            if (el.is('InstanceValue')) {
                this.instanceValueData = {};
                reloadSingleton(this.instanceValueData, el.instance, 'instance');                
            } else {
                this.instanceValueData = undefined;
            }

            if (el.is('Slot')) {
                this.slotData = {};
                reloadSingleton(this.slotData, el.owningInstance, 'owningInstance');
                reloadSet(this.slotData, el.values, 'values');
                reloadSingleton(this.slotData, el.definingFeature, 'definingFeature');
            } else {
                this.slotData = undefined;
            }

            if (el.is('MultiplicityElement')) {
                this.multiplicityElementData = {};
                this.multiplicityElementData.isOrdered = el.isOrdered;
                this.multiplicityElementData.isUnique = el.isUnique;
                reloadSingleton(this.multiplicityElementData, el.lowerValue, 'lowerValue');
                reloadSingleton(this.multiplicityElementData, el.upperValue, 'upperValue');
            } else {
                this.multiplicityElementData = undefined;
            }

            if (el.is('Property')) {
                this.propertyData = {};
                this.propertyData.aggregation = el.aggregation;
                reloadSingleton(this.propertyData, el.clazz, 'clazz');
                reloadSingleton(this.propertyData, el.dataType, 'dataType');
                reloadSingleton(this.propertyData, el.owningAssociation, 'owningAssociation');
                reloadSingleton(this.propertyData, el.association, 'association');
                reloadSingleton(this.propertyData, el.defaultValue, 'defaultValue');
                reloadSet(this.propertyData, el.subsettedProperties, 'subsettedProperties');
                reloadSet(this.propertyData, el.redefinedProperties, 'redefinedProperties');
            } else {
                this.propertyData = undefined;
            }

            if (el.is('Classifier')) {
                this.classifierData = {};
                reloadSet(this.classifierData, el.generalizations, 'generalizations');
                reloadSet(this.classifierData, el.features, 'features');
                reloadSet(this.classifierData, el.attributes, 'attributes');
            } else {
                this.classifierData = undefined;
            }

            if (el.is('DataType')) {
                this.dataTypeData = {};
                reloadSet(this.dataTypeData, el.ownedAttributes, 'ownedAttributes');
            } else {
                this.dataTypeData = undefined;
            }

            if (el.is('StructuredClassifier')) {
                this.structuredClassifierData = {};
                reloadSet(this.structuredClassifierData, el.ownedAttributes, 'ownedAttributes');
            } else {
                this.structuredClassifierData = undefined;
            }

            if (el.is('Class')) {
                this.classData = {};
                reloadSet(this.classData, el.ownedAttributes, 'ownedAttributes');
            } else {
                this.classData = undefined;
            }

            if (el.is('Association')) {
                this.associationData = {};
                reloadSet(this.associationData, el.memberEnds, 'memberEnds');
                reloadSet(this.associationData, el.ownedEnds, 'ownedEnds');
                reloadSet(this.associationData, el.navigableOwnedEnds, 'navigableOwnedEnds');
            } else {
                this.associationData = undefined;
            }

            if (el.is('Comment')) {
                this.commentData = {
                    body: el.body
                };
                reloadSet(this.commentData, el.annotatedElements, 'annotatedElements');
            } else {
                this.commentData = undefined;
            }

            if (el.is('Interface')) {
                this.interfaceData = {};
                reloadSet(this.interfaceData, el.ownedAttributes, 'ownedAttributes');
            } else {
                this.interfaceData = undefined;
            }

            if (el.is('Signal')) {
                this.signalData = {};
                reloadSet(this.signalData, el.ownedAttributes, 'ownedAttributes');
            } else {
                this.signalData = undefined;
            }
            if (el.is('Feature')) {
                this.featureData = {};
                this.featureData.isStatic = el.isStatic;
                reloadSingleton(this.featureData, el.featuringClassifier, 'featuringClassifier');
            } else {
                this.featureData = undefined;
            }

            if (el.is('StructuralFeature')) {
                this.structuralFeatureData = {};
                this.structuralFeatureData.isReadOnly = el.isReadOnly;
            } else {
                this.structuralFeatureData = undefined;
            }

            this.isFetching = false;
        },
        propogateSpecification(spec) {
            this.$emit('specification', spec);
        },
        propogateElementUpdate(newElementUpdate) {
            for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                if (newElement) {
                    if (newElement.id === this.umlID) {
                        if (newElement.is('NamedElement')) {
                            if (this.namedElementData.name !== newElement.name) {
                                this.namedElementData.name = newElement.name;
                            }
                        } 
                    }
                    
                } 
            }
            
            this.$emit('elementUpdate', newElementUpdate);
        },
        propogateSelect(newSelect) {
            this.$emit('select', newSelect);
        },
        propogateDeselect(newDeselect) {
            this.$emit('deselect', newDeselect);
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
    components: { ElementType, SetData, SingletonData, InputData, EnumerationData, LiteralUnlimitedNaturalData, MultiplicitySelector }
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
	<ElementType    :element-type="'Element'"
                    :theme="theme">
        <InputData  :label="'ID'" 
                    :input-type="'string'" 
                    :initial-data="umlID" 
                    :read-only="true" 
                    :umlid="umlID" 
                    :type="'id'"
                    :theme="theme"
                    @element-update="propogateElementUpdate"
                    ></InputData>
        <SetData    :label="'Owned Elements'" 
                    :initial-data="elementData.ownedElements" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    :subsets="['ownedAttributes', 'packagedElements', 'generalizations']" 
                    :set-data="{
                        readonly: true,
                        setName: 'ownedElements'
                    }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
        <SingletonData  :label="'Owner'" 
                        :readonly="true" 
                        :initial-data="elementData.owner" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'owner', readonly: true}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
        <SetData :label="'Applied Stereotypes'" 
                 :initial-data="elementData.appliedStereotypes" 
                 :umlid="umlID" 
                 :selected-elements="selectedElements"
                 :theme="theme"
                 @specification="propogateSpecification"
                 @select="propogateSelect"
                 @deselect="propogateDeselect"
                 :set-data="{
                    readonly: false,
                    setName: 'appliedStereotypes',
                    type: 'InstanceSpecification'
                 }"
                 @element-update="propogateElementUpdate"
                 ></SetData>
        <SetData :label="'Owned Comments'" 
                 :initial-data="elementData.ownedComments" 
                 :umlid="umlID" 
                 :selected-elements="selectedElements"
                 :theme="theme"
                 @specification="propogateSpecification"
                 @select="propogateSelect"
                 @deselect="propogateDeselect"
                 :set-data="{
                    readonly: false,
                    setName: 'ownedComments',
                    type: 'Comment',
                 }"
                :creatable="{types:['Comment'], set:'ownedComments'}"
                 @element-update="propogateElementUpdate"
                 ></SetData>
	</ElementType>
	<ElementType :element-type="'Named Element'" :theme="theme" v-if="namedElementData !== undefined">
        <InputData  :label="'Name'" 
                    :initial-data="namedElementData.name" 
                    :input-type="'string'" 
                    :read-only="false" 
                    :umlid="umlID" 
                    :type="'name'" 
                    :theme="theme"
                    @element-update="propogateElementUpdate"
                    ></InputData>
        <SingletonData  :label="'Namespace'" 
                        :readonly="true" 
                        :initial-data="namedElementData.namespace" 
                        :uml-i-d="umlID"
                        :singleton-data="{setName:'namespace', readonly: true}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
        <SetData    :label="'Client Dependencies'" 
                    :initial-data="namedElementData.clientDependencies" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements" 
                    :set-data="{
                        readonly: true,
                        setName: 'clientDependencies'
                    }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>                        
	</ElementType>
    <ElementType :element-type="'RedefinableElement'" :theme="theme" v-if="redefinableElementData !== undefined">
        <!-- TODO isLeaf -->
        <SetData    :label="'Redefined Elements'"
                    :initial-data="redefinableElementData.redefinedElements"
                    :umlid="umlID"
                    :selected-elements="selectedElements"
                    :theme="theme"
                    :set-data="{
                        readonly: true,
                        setName: 'redefinedElements'
                    }"
                    @specification="propogateSpecification" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    @element-update="propogateElementUpdate"
                    ></SetData>
        <SetData    :label="'Redefinition Contexts'"
                    :initial-data="redefinableElementData.redefinitionContexts"
                    :umlid="umlID"
                    :selected-elements="selectedElements"
                    :theme="theme"
                    :set-data="{
                        readonly: true,
                        setName: 'redefinitionContexts'
                    }"
                    @specification="propogateSpecification" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    @element-update="propogateElementUpdate"
                    ></SetData>
    </ElementType>
	<ElementType :element-type="'Relationship'" :theme="theme" v-if="relationshipData !== undefined">
        <SetData    :label="'Related Elements'" 
                    :initial-data="relationshipData.relatedElements" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    @specification="propogateSpecification" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    :subsets="['general', 'specific']"
                    :set-data="{
                                    readonly: true,
                                    setName: 'relatedElements'
                                }"
                    :theme="theme"
                    @element-update="propogateElementUpdate"  
                    ></SetData>
	</ElementType>
	<ElementType :element-type="'Directed Relationship'" :theme="theme" v-if="directedRelationshipData !== undefined">
        <SetData    :label="'Targets'" 
                    :initial-data="directedRelationshipData.targets" 
                    :umlid="umlID"
                    :selected-elements="selectedElements"
                    :set-data="{
                                    setName: 'targets',
                                    readonly: true
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
        <SetData    :label="'Sources'" 
                    :initial-data="directedRelationshipData.sources" 
                    :umlid="umlID"
                    :selected-elements="selectedElements"
                    :set-data="{
                                    readonly: true,
                                    setName: 'sources'
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
	</ElementType>
	<ElementType :element-type="'Generalization'" :theme="theme" v-if="generalizationData !== undefined">
        <SingletonData  :label="'Specific'" 
                        :initial-data="generalizationData.specific" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'specific', type:'Classifier'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
        <SingletonData  :label="'General'" 
                        :initial-data="generalizationData.general" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'general', type:'Classifier'}"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        ></SingletonData>
    </ElementType>
    <ElementType :element-type="'Dependency'" :theme="theme" v-if="dependencyData !== undefined">
        <SetData  :label="'Clients'" 
                        :initial-data="dependencyData.clients" 
                        :umlid="umlID" 
                        :set-data="{
                                    readonly: false,
                                    setName: 'clients'
                                    }"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SetData>
        <SetData  :label="'Suppliers'" 
                        :initial-data="dependencyData.suppliers" 
                        :umlid="umlID" 
                        :set-data="{
                                    readonly: false,
                                    setName: 'suppliers'
                                    }"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SetData>
    </ElementType>
    <ElementType :element-type="'Feature'" theme="theme" v-if="featureData !== undefined">
        <InputData  :label="'isStatic'" 
                    :input-type="'checkbox'"
                    :initial-data="featureData.isStatic"
                    :umlid="umlID"
                    :type="'isStatic'" 
                    :theme="theme"
                    @element-update="propogateElementUpdate"
                    ></InputData>
        <SingletonData :label="'Featuring Classifier'"
                    :initial-data="featureData.featuringClassifier"
                    :uml-i-d="umlID"
                    :singleton-data="{ setName: 'featuringClassifier', type: 'Classifier' }"
                    :selected-elements="selectedElements"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SingletonData>        
    </ElementType>
    <ElementType :element-type="'Typed Element'" :theme="theme" v-if="typedElementData !== undefined">
        <SingletonData  :label="'Type'" 
                        :initial-data="typedElementData.type" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'type',type:'Classifier'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
    </ElementType>
    <ElementType :element-type="'Multiplicity Element'" :theme="theme" v-if="multiplicityElementData !== undefined">
        <MultiplicitySelector   :umlid="umlID" 
                                :theme="theme" 
                                @element-update="propogateElementUpdate"></MultiplicitySelector>
       <InputData  :label="'isOrdered'" 
                   :input-type="'checkbox'"
                   :initial-data="multiplicityElementData.isOrdered"
                   :umlid="umlID"
                   :type="'isOrdered'" 
                   :theme="theme"
                   @element-update="propogateElementUpdate"
                   ></InputData>
        <InputData  :label="'isUnique'" 
                    :input-type="'checkbox'"
                    :initial-data="multiplicityElementData.isUnique"
                    :umlid="umlID"
                    :type="'isUnique'" 
                    :theme="theme"
                    @element-update="propogateElementUpdate"
                    ></InputData>
        <SingletonData  :label="'Lower Value'" 
                        :createable="{types:['LiteralInt']}" 
                        :initial-data="multiplicityElementData.lowerValue" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'lowerValue', type:'ValueSpecification'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
        <SingletonData  :label="'Upper Value'" 
                        :createable="{types:['LiteralInt', 'LiteralUnlimitedNatural']}"
                        :initial-data="multiplicityElementData.upperValue" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'upperValue', type:'ValueSpecification'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
	</ElementType>
    <ElementType element-type="Structural Feature" :theme="theme" v-if="structuralFeatureData !== undefined">
        <InputData  :label="'isReadOnly'" 
                    :input-type="'checkbox'"
                    :initial-data="structuralFeatureData.isReadOnly"
                    :umlid="umlID"
                    :type="'isReadOnly'" 
                    :theme="theme"
                    @element-update="propogateElementUpdate"
                    ></InputData>
    </ElementType>
 <ElementType :element-type="'Packageable Element'" :theme="theme" v-if="packageableElementData !== undefined">
        <SingletonData  :label="'OwningPackage'" 
                        :initial-data="packageableElementData.owningPackage" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'owningPackage', type:'Package'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
	</ElementType>
    <ElementType :element-type="'Instance Value'" :theme="theme" v-if="instanceValueData">
        <SingletonData  :label="'Instance'"
                        :initial-data="instanceValueData.instance"
                        :uml-i-d="umlID"
                        :singleton-data="{
                            setName: 'instance',
                            type: 'InstanceSpecification',    
                        }" 
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
    </ElementType>
    <ElementType :element-type="'Literal Bool'" :theme="theme" v-if="literalBoolData !== undefined">
        <InputData  :label="'Value'"
                    :input-type="'checkbox'"
                    :initial-data="literalBoolData.value"
                    :umlid="umlID"
                    :type="'value'"
                    :theme="theme"
                    @element-update="propogateElementUpdate">
        </InputData>
    </ElementType>
	<ElementType :element-type="'Literal Int'" :theme="theme" v-if="literalIntData !== undefined">
        <InputData 
                    :label="'Value'"
                    :input-type="'number'"
                    :initial-data="literalIntData.value"
                    :umlid="umlID"
                    :type="'value'"
                    :theme="theme"
                    @element-update="propogateElementUpdate"></InputData>
	</ElementType>
    <ElementType :element-type="'Literal Real'" :theme="theme" v-if="literalRealData">
        <InputData  :label="'Value'"
                    :input-type="'number'"
                    :initial-data="literalRealData.value"
                    :umlid="umlID"
                    :type="'value'"
                    :theme="theme"
                    @element-update="propogateElementUpdate"></InputData>
    </ElementType>
    <ElementType :element-type="'Literal String'" :theme="theme" v-if="literalStringData">
        <InputData  :label="'Value'"
                    :input-type="'string'"
                    :initial-data="literalStringData.value"
                    :umlid="umlID"
                    :type="'value'"
                    :theme="theme"
                    @element-update="propogateElementUpdate"></InputData>
    </ElementType>
    <ElementType :element-type="'Literal Unlimited Natural'" :theme="theme" v-if="literalUnlimitedNaturalData">
        <LiteralUnlimitedNaturalData 
            :initial-data="literalUnlimitedNaturalData.value" 
            :umlid="umlID" 
            @element-update="propogateElementUpdate"></LiteralUnlimitedNaturalData>
    </ElementType>
	<ElementType :element-type="'Property'" :theme="theme" v-if="propertyData !== undefined">
        <EnumerationData    :label="'Aggregation'"
                            :initial-value="propertyData.aggregation"
                            :enum-name="'aggregation'"
                            :enum-values="[
                                        {
                                            name: 'none',
                                            label: 'None',
                                        },
                                        {
                                            name: 'shared',
                                            label: 'Shared'
                                        },
                                        {
                                            name: 'composite',
                                            label: 'Composite'
                                        }
                                    ]"
                            :uml-i-d="umlID"
                            :theme="theme"></EnumerationData>
        <SingletonData  :label="'Class'" 
                        :initial-data="propertyData.clazz" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'class', type: 'Class'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
        <SingletonData  :label="'DataType'" 
                        :initial-data="propertyData.dataType" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'dataType', type:'DataType'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
        <SingletonData  :label="'Owning Association'" 
                        :initial-data="propertyData.owningAssociation" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'owningAssociation', type:'Assoiation'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
        <SingletonData  :label="'Association'" 
                        :initial-data="propertyData.association" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName: 'association', type:'Association'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
        <SingletonData  :label="'Default Value'"
                        :createable="
                                    {
                                        types: [
                                            'InstanceValue',
                                            'LiteralBool',
                                            'LiteralInt',
                                            'LiteralNull',
                                            'LiteralReal',
                                            'LiteralString',
                                            'LiteralUnlimitedNatural'
                                        ],
                                    }"
                        :initial-data="propertyData.defaultValue"
                        :uml-i-d="umlID"
                        :singleton-data="{setName:'defaultValue', type:'ValueSpecification'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate" 
                        ></SingletonData>
        <SetData    :label="'Subsetted Properties'" 
                    :initial-data="propertyData.subsettedProperties" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    :set-data="{
                        readonly: false,
                        setName: 'subsettedProperties',
                        type: 'Property',
                    }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"              
                    ></SetData>
        <SetData    :label="'Redefined Properties'" 
                    :initial-data="propertyData.redefinedProperties" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    :set-data="{
                        readonly: false,
                        setName: 'redefinedProperties',
                        type: 'Property',
                    }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"          
                    ></SetData>
        
	</ElementType>
	<ElementType :element-type="'Namespace'" :theme="theme" v-if="namespaceData !== undefined">
        <SetData    :label="'Members'" 
                    :initial-data="namespaceData.members" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    :subsets="['ownedAttributes', 'packagedElements']"
                    :set-data="{
                        readonly: true,
                        setName: 'members'
                    }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"              
                    ></SetData>
        <SetData    :label="'Owned Members'" 
                    :initial-data="namespaceData.ownedMembers" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    :subsets="['ownedAttributes', 'packagedElements']"
                    :set-data="{
                                    setName: 'ownedMembers',
                                    readonly: true
                                }"
                    :theme="theme"
                    @element-update="propogateElementUpdate" 
                    @specification="propogateSpecification"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"></SetData>
	</ElementType>
    <ElementType :element-type="'Package'" :theme="theme" v-if="packageData !== undefined">
        <SetData    :label="'Packaged Elements'" 
                    :initial-data="packageData.packagedElements" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    :subsets="['packagedElements']"
                    :creatable="{
                                    types: [
                                        'Class', 
                                        'DataType',
                                        'InstanceSpecification',
                                        'InstanceValue',
                                        'LiteralBool',
                                        'LiteralInt',
                                        'LiteralNull',
                                        'LiteralReal',
                                        'LiteralString',
                                        'LiteralUnlimitedNatural',
                                        'Package',
                                        'PrimitiveType',
                                    ], 
                                    set: 'packagedElements'
                                }"
                    :set-data="{
                                    setName: 'packagedElements',
                                    readonly: false,
                                    type: 'PackageableElement'
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
	</ElementType>
	<ElementType :element-type="'Instance Specification'" :theme="theme" v-if="instanceSpecificationData !== undefined">
        <SetData    :label="'Classifiers'"
                    :initial-data="instanceSpecificationData.classifiers"
                    :umlid="umlID"
                    :selected-elements="selectedElements"
                    :subsets="[]"
                    :set-data="{
                                    setName: 'classifiers',
                                    type:'Classifier',
                                    readonly: false
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
        <SetData    :label="'Slots'"
                    :initial-data="instanceSpecificationData.slots"
                    :umlid="umlID"
                    :selected-elements="selectedElements"
                    :subsets="[]"
                    :creatable="{types:['Slot'], set:'slots'}"
                    :set-data="{
                                    setName: 'slots',
                                    readonly: false,
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
	</ElementType>
    <ElementType :element-type="'Enumeration Literal'" :theme="theme" v-if="enumerationLiteralData">
        <SingletonData  :label="'Enumeration'"
                        :initial-data="enumerationLiteralData.enumeration"
                        :uml-i-d="umlID"
                        :singleton-data="{
                            setName: 'enumeration',
                            type: 'Enumeration'
                        }"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
    </ElementType>
	<ElementType :element-type="'Slot'" :theme="theme" v-if="slotData !== undefined">
        <SingletonData
            :label="'Owning Instance'"
            :initial-data="slotData.owningInstance"
            :uml-i-d="umlID" 
            :singleton-data="{setName: 'owningInstance', type:'InstanceSpecification'}"
            :selected-elements="selectedElements"
            :theme="theme"
            @specification="propogateSpecification"
            @element-update="propogateElementUpdate"
            @select="propogateSelect"
            @deselect="propogateDeselect"
            ></SingletonData>
        <SetData    :label="'Values'"
                    :initial-data="slotData.values"
                    :umlid="umlID"
                    :selected-elements="selectedElements"
                    :subsets="[]"
                    :creatable="{
                        types:[
                            'InstanceValue',
                            'LiteralBool',
                            'LiteralInt', 
                            'LiteralNull', 
                            'LiteralReal', 
                            'LiteralString', 
                            'LiteralUnlimitedNatural'
                        ],
                        set: 'values'
                    }"
                    :set-data="{
                                    setName: 'values',
                                    readonly: false
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
        <SingletonData
            :label="'Defining Feature'"
            :initial-data="slotData.definingFeature"
            :uml-i-d="umlID"
            :singleton-data="{ setName: 'definingFeature', type: 'Property' }"
            :selected-elements="selectedElements"
            :theme="theme"
            @specification="propogateSpecification"
            @element-update="propogateElementUpdate" 
            @select="propogateSelect"
            @deselect="propogateDeselect"
            ></SingletonData>
	</ElementType>
	<ElementType :elementType="'Classifier'" :theme="theme" v-if="classifierData !== undefined">
        <SetData    :label="'Generalizations'" 
                    :initial-data="classifierData.generalizations" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    :subsets="['generalizations']" 
                    :creatable="{types:['Generalization'], set: 'generalizations'}"
                    :set-data="{
                        setName: 'generalizations',
                        readonly: false,
                        type: 'Generalization',
                    }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
        <SetData    :label="'Attributes'" 
                    :initial-data="classifierData.attributes" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    :subsets="['ownedAttributes']"
                    :set-data="{
                                    setName: 'attributes',
                                    readonly: true
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
	</ElementType>
    <ElementType :elementType="'DataType'" :theme="theme" v-if="dataTypeData">
        <SetData    :label="'Owned Attributes'"
                    :initial-data="dataTypeData.ownedAttributes"
                    :umlid="umlID"
                    :selected-elements="selectedElements"
                    :subsets="['ownedAttributes']"
                    :set-data="{
                                    setName: 'ownedAttributes',
                                    readonly: false,
                                    type: 'Property',
                                }"
                    :creatable="{
                                    types: [
                                                'Property'
                                            ],
                                    set: 'ownedAttributes'
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
    </ElementType>
    <ElementType :elementType="'Enumeration'" :theme="theme" v-if="enumerationData">
        <SetData    :label="'Owned Literals'"
                    :initial-data="enumerationData.ownedLiterals"
                    :umlid="umlID"
                    :selected-elements="selectedElements"
                    :subsets="['ownedLiterals']"
                    :set-data="{
                                    setName: 'ownedLiterals',
                                    readonly: false,
                                    type: 'EnumerationLiteral'
                                }"
                    :creatable="{
                                    types: [ 'EnumerationLiteral' ],
                                    set: 'ownedLiterals'
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
    </ElementType>
	<ElementType :elementType="'Structured Classifier'" :theme="theme" v-if="structuredClassifierData !== undefined">
        <SetData    :label="'Owned Attributes'" 
                    :initial-data="structuredClassifierData.ownedAttributes" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    :subsets="['ownedAttributes']"
                    :set-data="{
                                    setName: 'ownedAttributes',
                                    readonly: true
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
	</ElementType>
	<ElementType :element-type="'Association'" :theme="theme" v-if="associationData !== undefined">
        <SetData    :label="'Member Ends'" 
                    :initial-data="associationData.memberEnds" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    :subsets="['ownedEnds', 'navigableOwnedEnds']"
                    :set-data="{
                                    setName: 'memberEnds',
                                    readonly: false,
                                    type: 'Property'
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
        <SetData    :label="'Owned Ends'" 
                    :initial-data="associationData.ownedEnds" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    :subsets="['navigableOwnedEnds']"
                    :set-data="{
                                    setName: 'ownedEnds',
                                    readonly: false,
                                    type: 'Property'
                                }"
                    :creatable="{
                                    types: [
                                        'Property'
                                    ],
                                    set: 'ownedEnds'
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
        <SetData    :label="'Navigable Owned Ends'" 
                    :initial-data="associationData.navigableOwnedEnds" 
                    :umlid="umlID"
                    :selected-elements="selectedElements"
                    :set-data="{
                                    setName: 'navigableOwnedEnds',
                                    readonly: false,
                                    type: 'Property'
                                }"
                    :creatable="{
                                    types: [
                                        'Property'
                                    ],
                                    set: 'navigableOwnedEnds'
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
	</ElementType>
	<ElementType :elementType="'Class'" :theme="theme" v-if="classData !== undefined">
        <SetData    :label="'Owned Attributes'" 
                    :initial-data="classData.ownedAttributes" 
                    :umlid="umlID" 
                    :selected-elements="selectedElements"
                    :subsets="['ownedAttributes']"
                    :creatable="{types:['Property'], set: 'ownedAttributes'}"
                    :set-data="{
                                    setName: 'ownedAttributes',
                                    readonly: false
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
	</ElementType>
    <ElementType :element-type="'Comment'" :theme="theme" v-if="commentData !== undefined">
        <InputData  :label="'Body'" 
                    :initial-data="commentData.body" 
                    :input-type="'string'" 
                    :read-only="false" 
                    :umlid="umlID" 
                    :type="'body'"
                    :theme="theme"
                    @element-update="propogateElementUpdate"
                    ></InputData>
        <SetData    :label="'Annotated Elements'" 
                    :initial-data="commentData.annotatedElements" 
                    :umlid="umlID"
                    :selected-elements="selectedElements"
                    :set-data="{
                                    setName: 'annotatedElements',
                                    readonly: false,
                                    type: 'Element'
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
    </ElementType>
    </div> 
</div>
</template>
<style>
.mainDiv {
    padding: 10px;
    flex: 1 1 69vw;
    /* border: solid #525258; */
    border-width: 2px;
    overflow: auto;
}
.horizontalScroll{
    width: 1000px;
    margin: auto;
}
.headerDiv {
    display: flex;
    padding: 10px;
}
.headerImage {
    height: 50px;
    width: 50px;
    padding-left: 10px;
}
</style>
