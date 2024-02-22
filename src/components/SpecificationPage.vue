<script>
import ElementType from './specComponents/ElementType.vue';
import SetData from './specComponents/SetData.vue';
import getImage from '../GetUmlImage.vue';
import SingletonData from './specComponents/SingletonData.vue';
import InputData from './specComponents/InputData.vue';
import EnumerationData from './specComponents/EnumerationData.vue';
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
                        if (newElement.isSubClassOf('namedElement')) {
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
            const reloadSingleton = async (elementTypeData, singleton, singletonName) => {
                const singletonValue = await singleton.get();
                if (singletonValue !== undefined) {
                    elementTypeData[singletonName] = {
                        img: getImage(singletonValue),
                        label: singletonValue.name !== undefined ? singletonValue.name : '',
                        id: singletonValue.id,
                        currentUsers: this.users.filter(user => user.selectedElements.includes(singletonValue.id)),
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
                        label: await assignTabLabel(element),
                        id: element.id,
                        selected: this.selectedElements.includes(element.id),
                        currentUsers: this.users.filter(user => user.selectedElements.includes(element.id)),
                        hover: false,
                    });
                }
                return elementTypeData;
            };

            await reloadSet(this.elementData, el.ownedElements, 'ownedElements');
            reloadSingleton(this.elementData, el.owner, 'owner');
            reloadSet(this.elementData, el.appliedStereotypes, 'appliedStereotypes');
            await reloadSet(this.elementData, el.ownedComments, 'ownedComments');
            // TODO rest of ELEMENT


            if (el.isSubClassOf('namedElement')) {
                this.namedElementData = {
                    name: el.name
                };
                reloadSingleton(this.namedElementData, el.namespace, 'namespace');
                await reloadSet(this.namedElementData, el.clientDependencies, 'clientDependencies');
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

            if (el.isSubClassOf('enumeration')) {
                this.enumerationData = {};
                await reloadSet(this.enumerationData, el.ownedLiterals, 'ownedLiterals');
            } else {
                this.enumerationData = undefined;
            }

            if (el.isSubClassOf('enumerationLiteral')) {
                this.enumerationLiteralData = {};
                await reloadSingleton(this.enumerationLiteralData, el.enumeration, 'enumeration');
            } else {
                this.enumerationLiteralData = undefined;
            }

            if (el.isSubClassOf('literalBool')) {
                this.literalBoolData = {};
                this.literalBoolData.value = el.value;
            } else {
                this.literalBoolData = undefined;
            }

            if (el.isSubClassOf('literalInt')) {
                this.literalIntData = {};
                this.literalIntData.value = el.value;
            } else {
                this.literalIntData = undefined;
            }

            if (el.isSubClassOf('literalReal')) {
                this.literalRealData = {};
                this.literalRealData.value = el.value;
            } else {
                this.literalRealData = undefined;
            }

            if (el.isSubClassOf('literalString')) {
                this.literalStringData = {};
                this.literalStringData.value = el.value;
            } else {
                this.literalStringData = undefined;
            }

            if (el.isSubClassOf('literalUnlimitedNatural')) {
                this.literalUnlimitedNaturalData = {};
                this.literalUnlimitedNaturalData.value = el.value;
            } else {
                this.literalUnlimitedNaturalData = undefined;
            }

            if (el.isSubClassOf('packageableElement')) {
                this.packageableElementData = {};
                reloadSingleton(this.packageableElementData, el.owningPackage, 'owningPackage');
            } else {
                this.packageableElementData = undefined;
            }

            if (el.isSubClassOf('dependency')) {
                this.dependencyData = {};
                await reloadSet(this.dependencyData, el.clients, 'clients');
                await reloadSet(this.dependencyData, el.suppliers, 'suppliers');
            } else {
                this.dependencyData = undefined;
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

            if (el.isSubClassOf('instanceValue')) {
                this.instanceValueData = {};
                await reloadSingleton(this.instanceValueData, el.instance, 'instance');                
            } else {
                this.instanceValueData = undefined;
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
                this.propertyData.aggregation = el.aggregation;
                await reloadSingleton(this.propertyData, el.clazz, 'clazz');
                await reloadSingleton(this.propertyData, el.dataType, 'dataType');
                await reloadSingleton(this.propertyData, el.owningAssociation, 'owningAssociation');
                await reloadSingleton(this.propertyData, el.association, 'association');
                await reloadSingleton(this.propertyData, el.defaultValue, 'defaultValue');
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

            if (el.isSubClassOf('dataType')) {
                this.dataTypeData = {};
                await reloadSet(this.dataTypeData, el.ownedAttributes, 'ownedAttributes');
            } else {
                this.dataTypeData = undefined;
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

            if (el.isSubClassOf('comment')) {
                this.commentData = {
                    body: el.body
                };
                await reloadSet(this.commentData, el.annotatedElements, 'annotatedElements');
            } else {
                this.commentData = undefined;
            }

            if (el.isSubClassOf('interface')) {
                this.interfaceData = {};
                await reloadSet(this.interfaceData, el.ownedAttributes, 'ownedAttributes');
            } else {
                this.interfaceData = undefined;
            }

            if (el.isSubClassOf('signal')) {
                this.signalData = {};
                await reloadSet(this.signalData, el.ownedAttributes, 'ownedAttributes');
            } else {
                this.signalData = undefined;
            }
            if (el.isSubClassOf('feature')) {
                this.featureData = {};
                this.featureData.isStatic = el.isStatic;
                await reloadSingleton(this.featureData, el.featuringClassifier, 'featuringClassifier');
            } else {
                this.featureData = undefined;
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
                        if (newElement.isSubClassOf('namedElement')) {
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
    components: { ElementType, SetData, SingletonData, InputData, EnumerationData, LiteralUnlimitedNaturalData }
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
                    type: 'instanceSpecification'
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
                    type: 'comment',
                 }"
                :creatable="{types:['comment'], set:'ownedComments'}"
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
                        :singleton-data="{setName:'specific', type:'classifier'}"
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
                        :singleton-data="{setName:'general', type:'classifier'}"
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
    <ElementType :element-type="'Typed Element'" :theme="theme" v-if="typedElementData !== undefined">
        <SingletonData  :label="'Type'" 
                        :initial-data="typedElementData.type" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'type',type:'classifier'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
    </ElementType>
    <ElementType :element-type="'Packageable Element'" :theme="theme" v-if="packageableElementData !== undefined">
        <SingletonData  :label="'OwningPackage'" 
                        :initial-data="packageableElementData.owningPackage" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'owningPackage', type:'package'}"
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
                            type: 'instanceSpecification',    
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
	<ElementType :element-type="'Multiplicity Element'" :theme="theme" v-if="multiplicityElementData !== undefined">
        <SingletonData  :label="'Lower Value'" 
                        :createable="{types:['literalInt']}" 
                        :initial-data="multiplicityElementData.lowerValue" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'lowerValue', type:'valueSpecification'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
        <SingletonData  :label="'Upper Value'" 
                        :createable="{types:['literalInt', 'literalUnlimitedNatural']}"
                        :initial-data="multiplicityElementData.upperValue" 
                        :uml-i-d="umlID" 
                        :singleton-data="{setName:'upperValue', type:'valueSpecification'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        ></SingletonData>
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
                    :singleton-data="{ setName: 'featuringClassifier', type: 'classifier' }"
                    :selected-elements="selectedElements"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SingletonData>        
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
                        :singleton-data="{setName:'class', type: 'class'}"
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
                        :singleton-data="{setName:'dataType', type:'dataType'}"
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
                        :singleton-data="{setName:'owningAssociation', type:'assoiation'}"
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
                        :singleton-data="{setName: 'association', type:'association'}"
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
                                            'instanceValue',
                                            'literalBool',
                                            'literalInt',
                                            'literalNull',
                                            'literalReal',
                                            'literalString',
                                            'literalUnlimitedNatural'
                                        ],
                                    }"
                        :initial-data="propertyData.defaultValue"
                        :uml-i-d="umlID"
                        :singleton-data="{setName:'defaultValue', type:'valueSpecification'}"
                        :selected-elements="selectedElements"
                        :theme="theme"
                        @select="propogateSelect"
                        @deselect="propogateDeselect"
                        @specification="propogateSpecification"
                        @element-update="propogateElementUpdate" 
                        ></SingletonData>
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
                                        'class', 
                                        'dataType',
                                        'instanceSpecification',
                                        'instanceValue',
                                        'literalBool',
                                        'literalInt',
                                        'literalNull',
                                        'literalReal',
                                        'literalString',
                                        'literalUnlimitedNatural',
                                        'package',
                                        'primitiveType',
                                    ], 
                                    set: 'packagedElements'
                                }"
                    :set-data="{
                                    setName: 'packagedElements',
                                    readonly: false,
                                    type: 'packageableElement'
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
                                    type:'classifier',
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
                    :creatable="{types:['slot'], set:'slots'}"
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
                            type: 'enumeration'
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
            :singleton-data="{setName: 'owningInstance', type:'instanceSpecification'}"
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
                            'instanceValue',
                            'literalInt', 
                            'literalNull', 
                            'literalReal', 
                            'literalString', 
                            'literalUnlimitedNatural'
                        ], 
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
            :singleton-data="{ setName: 'definingFeature', type: 'property' }"
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
                    :creatable="{types:['generalization'], set: 'generalizations'}"
                    :set-data="{
                        setName: 'generalizations',
                        readonly: false,
                        type: 'generalization',
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
                                    type: 'property',
                                }"
                    :creatable="{
                                    types: [
                                                'property'
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
                                    type: 'enumerationLiteral'
                                }"
                    :creatable="{
                                    types: [ 'enumerationLiteral' ],
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
                                    type: 'property'
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
                                    type: 'property'
                                }"
                    :creatable="{
                                    types: [
                                        'property'
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
                                    type: 'property'
                                }"
                    :creatable="{
                                    types: [
                                        'property'
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
                    :creatable="{types:['property'], set: 'ownedAttributes'}"
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
                                    type: 'element'
                                }"
                    :theme="theme"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate"
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SetData>
    </ElementType>
    <ElementType :element-type="'Feature'" v-if="featureData !== undefined">
        <InputData  :label="'isStatic'" 
                    :input-type="'checkbox'"
                    :initial-data="featureData.isStatic"
                    :umlid="umlID"
                    :type="'isStatic'" 
                    @element-update="propogateElementUpdate"
                    ></InputData>
        <SingletonData :label="'Featuring Classifier'"
                    :initial-data="featureData.featuringClassifier"
                    :uml-i-d="umlID"
                    :singleton-data="{ setName: 'featuringClassifier', type: 'classifier' }"
                    :selected-elements="selectedElements"
                    @specification="propogateSpecification"
                    @element-update="propogateElementUpdate" 
                    @select="propogateSelect"
                    @deselect="propogateDeselect"
                    ></SingletonData>        
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
