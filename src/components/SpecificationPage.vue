<script>
import ElementType from './specComponents/ElementType.vue';
import SetData from './specComponents/SetData.vue';
import getImage from '../GetUmlImage.vue';
import SingletonData from './specComponents/SingletonData.vue';
import InputData from './specComponents/InputData.vue';
import EnumerationData from './specComponents/EnumerationData.vue';
import MultiplicitySelector from './specComponents/MultiplicitySelector.vue';
import LiteralUnlimitedNaturalData from './specComponents/LiteralUnlimitedNaturalData.vue';
import StereotypeApplicator from './specComponents/StereotypeApplicator.vue';
import { 
    ELEMENT_ID, 
    ELEMENT_APPLIED_STEREOTYPES_ID, 
    INSTANCE_SPECIFICATION_ID, 
    MULTIPLICITY_ELEMENT_ID, 
    NAMED_ELEMENT_ID,
    KERNEL_TYPES
} from 'uml-client/lib/modelIds';
import { randomID } from 'uml-client/lib/types/element';

export default {
    props: [
        'umlID', 
        'selectedElements',
        'users',
        'theme',
    ],
    emits: [
        'focus', 
        'elementUpdate',
        'select',
        'deselect',
    ],
    inject: ['elementUpdate'],
    data() {
        return {
            elementType: '',
            elementImage: undefined,
            types: [],
            isFetching: true,
            filters: [
                {
                    name: 'uml',
                    enabled: true
                } 
            ]
        }
    },
    mounted() {
        this.filters = [{
            name: 'uml',
            enabled: true
        }];
        this.reloadSpec();
    },
    watch: {
        umlID() {
            this.filters = [{
                name: 'uml',
                enabled: true
            }];
            this.reloadSpec();
        },
        elementUpdate(newElementUpdate) {
            for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                // const oldElement = newElementUpdate.oldElement;
                if (newElement) {
                    if (newElement.id === this.umlID) {
                        for (const type of this.types) {
                            for (const specialData of type.specialData) {
                                const typeInfoSpecialData = newElement.typeInfo.getSpecialData(specialData.name);
                                if (typeInfoSpecialData) {
                                    const newValue = typeInfoSpecialData.getData();
                                    if (newValue !== specialData.val) {
                                        specialData.val = newValue;
                                    }
                                }
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
            this.types = [];
            const umlEl = await this.$umlWebClient.get(this.umlID);
            if (this.filters.length === 1){
                if (umlEl.is(INSTANCE_SPECIFICATION_ID) || umlEl.appliedStereotypes.size() > 0) {
                    this.filters[0].enabled = false;
                    this.filters.push({
                        name: 'meta',
                        enabled: false
                    });
                    this.filters.push({
                        name: 'all',
                        enabled: true
                    });
                }
            }
            
            const visited = new Map();
            let populateKernelTypes = true;
            const fillData = async (el, typeInfo) => {
                const visitedMatch = visited.get(typeInfo.id);
                if (visitedMatch) {
                    return visitedMatch;
                }
                // visit children first for dfs visit
                for (const base of typeInfo.base) {
                    if (!populateKernelTypes) {
                        if (KERNEL_TYPES.has(base.id)) {
                            continue;
                        }
                    }
                    await fillData(el, base);
                }
                const typeToFill = {
                    name: typeInfo.name,
                    id: typeInfo.id,
                    manager: populateKernelTypes ? this.$umlWebClient.id : this.$umlCafeModule.metaClient.id,
                    specialData: [],
                    sets: []
                }
                for (const specialDataPair of typeInfo.specialData) {
                    // TODO
                    const specialData = specialDataPair[1];
                    const specialDataData = {
                        name: specialDataPair[0],
                        type: specialData.type,
                        val: specialData.getData(),
                        readonly: false
                    };
                    if (specialData.type === 'enumeration') {
                        const enumValues = [];
                        for (const enumVal of specialData.vals) {
                            enumValues.push({
                                name: enumVal,
                                label: enumVal
                            });
                        }
                        specialDataData.enumVals = enumValues;
                        
                        // enums will hide default with getData
                        // if val is empty set it to default
                        if (specialDataData.val === '') {
                            specialDataData.val = el[specialDataData.name];
                        }
                    }
                    typeToFill.specialData.push(specialDataData);
                }
                for (const setPair of typeInfo.sets) {
                    const set = setPair[1];
                    const setData = {
                        name: set.name,
                        id: set.definingFeature,
                        setType: set.setType(),
                        readonly: set.readonly,
                        definingFeature: set.definingFeature,
                        composition: set.composition,
                        type: (await this.$umlWebClient.get(set.definingFeature)).type.id(),
                    };
                    if (set.setType() === 'set') {
                        setData.data = [];
                        for (const dataID of set.ids()) {
                            setData.data.push(dataID);
                        }
                    } else if (set.setType() === 'singleton') {
                        setData.data = undefined;
                        if (set.has()) {
                            setData.data = set.id();
                        }
                    }
                    typeToFill.sets.push(setData);
                }
                this.types.push(typeToFill);
                visited.set(typeInfo.id, typeToFill);
                return typeToFill;
            }
            let umlFilter;
            let metaFilter;
            let allFilter;
            for (const filter of this.filters) {
                if (filter.name === 'uml') {
                    umlFilter = filter;
                } else if (filter.name === 'meta') {
                    metaFilter = filter;
                } else if (filter.name === 'all') {
                    allFilter = filter;
                }
            }
            if (umlFilter.enabled || (allFilter && allFilter.enabled)) {
                const el = umlEl;
                this.elementType = el.elementType();
                this.elementImage = getImage(el);
              

                // base element doesn't have a typeInfo, but
                // we will add it as a proxy element type to 
                // hold the id property
                this.types.push({
                    name: 'BaseElement',
                    id: randomID(),
                    manager: this.$umlWebClient.id,
                    sets: [],
                    specialData : [
                        {
                            name: 'ID',
                            type: 'string',
                            val: el.id,
                            readonly: true
                        }
                    ]
                });

                await fillData(el, el.typeInfo);

                // special handling
                const elementData = visited.get(ELEMENT_ID)
                if (elementData) {
                    for (const setData of elementData.sets) {
                        if (setData.id === ELEMENT_APPLIED_STEREOTYPES_ID) {
                            setData.setType = 'stereotypes';
                            break;
                        }
                    }
                }

                const multiplicityData = visited.get(MULTIPLICITY_ELEMENT_ID);
                if (multiplicityData) {
                    const multiplicityQuickSelectData = {
                        name: 'multiplicity quick select',
                        type: 'multiplicity'
                    }
                    multiplicityData.specialData.push(multiplicityQuickSelectData);
                } 
            } 
            if (metaFilter && (metaFilter.enabled || allFilter.enabled)) {
                populateKernelTypes = false;
                try {
                    const metaEl = await this.$umlCafeModule.metaClient.get(this.umlID);
                    this.elementType = metaEl.elementType();
                    await fillData(metaEl, metaEl.typeInfo);
                } catch (exception) {
                    this.filters.pop();
                    this.filters.pop();
                    this.filters[0].enabled = true;
                }
            }

            this.isFetching = false;
        },
        propogateFocus(spec) {
            this.$emit('focus', spec);
        },
        propogateElementUpdate(newElementUpdate) {
            // TODO update generally
            for (const update of newElementUpdate.updatedElements) {
                const newElement = update.newElement;
                if (newElement) {
                    if (newElement.id === this.umlID) {
                        // if (newElement.is('NamedElement')) {
                        //     if (this.namedElementData.name !== newElement.name) {
                        //         this.namedElementData.name = newElement.name;
                        //     }
                        // } 
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
        },
        toggle(filter) {
            for (const currFilter of this.filters) {
                currFilter.enabled = false;
            }
            filter.enabled = true;
            this.reloadSpec();
        }
    },
    computed: {
        elementLabel() {
            for (const type of this.types) {
                if (type.id === NAMED_ELEMENT_ID) {
                    for (const specialData of type.specialData) {
                        if (specialData.name === 'name') {
                            if (specialData.val !== "") {
                                return specialData.val;
                            }
                            break;
                        }
                    }
                    break;
                }
            }
            if (this.namedElementData !== undefined && this.namedElementData.name !== '') {
                return this.namedElementData.name;
            } else {
                return this.umlID;
            }
        },
    },
    components: { 
        ElementType, 
        SetData, 
        SingletonData, 
        InputData, 
        EnumerationData, 
        LiteralUnlimitedNaturalData, 
        MultiplicitySelector, 
        StereotypeApplicator 
    }
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
        <div style="color: gray;">
            Filters:
        </div>
        <div style="display:flex;margin-bottom:15px;">
            <div    v-for="elFilter in filters"
                    :key="elFilter.name"
                    class="infoToggle"
                    :class="{ toggled : elFilter.enabled}"
                    @click="toggle(elFilter)">
                {{ elFilter.name }}
            </div>
        </div>
        <ElementType    v-for="elType in types"
                        :key="elType"
                        :element-type="elType.name"
                        :theme="theme">
            <div    v-for="specialData in elType.specialData"
                    :key="specialData">
                <InputData  v-if="specialData.type === 'string' || specialData.type === 'number' || specialData.type === 'bool'"
                            :label="specialData.name"
                            :type="specialData.name"
                            :read-only="specialData.readonly"
                            :input-type="specialData.type === 'bool' ? 'checkbox' : specialData.type"
                            :initial-data="specialData.val"
                            :umlid="umlID"
                            :theme="theme"
                            :manager="elType.manager"
                            @element-update="propogateElementUpdate">
                </InputData>
                <EnumerationData    v-if="specialData.type === 'enumeration'"
                                    :label="specialData.name"
                                    :initial-value="specialData.val"
                                    :uml-i-d="umlID"
                                    :enum-name="specialData.name"
                                    :enum-values="specialData.enumVals"
                                    :theme="theme">
                </EnumerationData>
                <MultiplicitySelector   v-if="specialData.type === 'multiplicity'"
                                        :umlid="umlID"
                                        :theme="theme"
                                        @element-update="propogateElementUpdate"/>
                <LiteralUnlimitedNaturalData    v-if="specialData.type === 'unlimitedNatural'"
                                                :umlid="umlID"
                                                :initial-data="specialData.val"
                                                :theme="theme"
                                                @element-update="propogateElementUpdate">
                </LiteralUnlimitedNaturalData>
            </div>
            <div    v-for="set in elType.sets"
                    :key="set.definingFeature">
                <SetData    v-if="set.setType === 'set'"
                            :set-data="set"
                            :initial-data="set.data"
                            :umlid="umlID"
                            :selected-elements="selectedElements"
                            :theme="theme"
                            @focus="propogateFocus"
                            @element-update="propogateElementUpdate"
                            @select="propogateSelect"
                            @deselect="propogateDeselect">
                </SetData>
                <SingletonData  v-if="set.setType === 'singleton'"
                                :singleton-data="set"
                                :initial-data="set.data"
                                :uml-i-d="umlID"
                                :selected-elements="selectedElements"
                                :theme="theme"
                                @focus="propogateFocus"
                                @element-update="propogateElementUpdate"
                                @select="propogateSelect"
                                @deselect="propogateDeselect">
                </SingletonData>
                <StereotypeApplicator   v-if="set.setType === 'stereotypes'"
                                        :umlid="umlID" 
                                        :initial-data="set.data"
                                        :theme="theme" 
                                        :selected-elements="selectedElements"
                                        @focus="propogateFocus"
                                        @element-update="propogateElementUpdate"
                                        @select="propogateSelect"
                                        @deselect="propogateDeselect">
                </StereotypeApplicator>
            </div>
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
.infoToggle {
    padding-left: 10px;
    padding-right: 10px;
    border-radius: 5px;
    user-select: none;
}
.toggled {
    background-color: var(--uml-cafe-selected);
    color: azure;
}
</style>
