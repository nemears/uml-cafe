<script>
import getImage from '../../GetUmlImage.vue';
import CreationPopUp from './CreationPopUp.vue';
export default {
    props: ['label', 'initialData', 'umlid', 'subsets', 'creatable'],
    inject: ['dataChange'],
    emits: ['specification', 'dataChange'],
    data() {
        return {
            data: [],
            createPopUp: false,
        };
    },
    mounted() {
        this.data = this.initialData;
    },
    watch: {
        initialData(newInitialData, oldInitialData) {
            this.data = newInitialData;
        },
        async dataChange(newDataChange, oldDataChange) {
            for (let data of newDataChange.data) {
                if (data.type === 'name') {
                    this.data.forEach(el => {
                        if (el.id === data.id) {
                            if (data.value === '') {
                                el.label = el.id;
                            } else {
                                el.label = data.value;
                            }
                        }
                    });
                } else if (
                    data.type === 'add' && 
                    data.id === this.umlid && 
                    this.subsets &&
                    this.subsets.includes(data.set) &&
                    !this.data.find((el) => el.id === data.el)
                ) {
                    const el = await this.$umlWebClient.get(data.el);
                    this.data.push({
                        id: data.el,
                        label: el.name !== undefined && el.name !== '' ? el.name : '',
                        img: getImage(el)
                    });
                } else if (data.type === 'delete') {
                    const el = this.data.find((data) => {
                        return data.id === data.id;
                    });
                    if (el !== undefined) {
                        this.data.splice(this.data.indexOf(el), 1);
                    }
                }
            }
        }
    },
    methods: {
        async specification(id) {
            this.$emit('specification', await this.$umlWebClient.get(id));
        },
        createElement() {
            this.createPopUp = true;
        },
        closePopUp(element) {
            this.createPopUp = false;
            if (element === undefined) {
                return;
            }
            this.data.push({
                img: getImage(element),
                id: element.id,
                label: element.name !== undefined ? element.name : '' 
            });
            this.$emit('dataChange', {
                data: [
                    {
                        type: 'add',
                        id: this.umlid,
                        el: element.id,
                        set: this.creatable.set
                    }
                ]
            });
        }
    },
    components: { CreationPopUp }
}
</script>
<template>
    <div class="setInputContainer">
        <div class="setLabel">
            {{  label }}
        </div>
        <div>
            <div class="setElement" v-for="el in data" :key="el.id" @dblclick="specification(el.id)">
                <img v-if="el.img !== undefined" :src="el.img"/>
                <div>
                    {{ el.label }}
                </div>
            </div>
            <div class="setElement" v-if="creatable || data.length === 0" @dblclick="createElement">
                <div class="createToolTip" v-if="creatable">
                    double click to create an element
                </div>
                <div class="createButton" v-if="creatable" @click="createElement">
                    +
                </div>
                <CreationPopUp v-if="createPopUp" :types="creatable.types" :set="creatable.set" :umlid="umlid" @closePopUp="closePopUp"></CreationPopUp>
            </div>
        </div>
    </div>
</template>
<style>
.setInputContainer {
    display: flex;
    padding-bottom: 10px;
}
.setLabel {
    min-width: 200px;
}
.setElement {
    width: 700px;
    background-color: var(--open-uml-selection-dark-1);
    min-height: 24px;
    display: flex;
    padding-left: 5px;
}
.setElement:hover {
    background-color: var(--open-uml-selection-dark-2);
}
.createButton {
    margin-left: auto;
    text-align: center;
    border: 1px solid;
    min-width: 25px;
    border-color: var(--vt-c-black-soft);
    background-color: var(--vt-c-white-soft);
    color: var(--vt-c-black-soft);
    -webkit-user-select: none; /* Safari */        
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
}
.createButton:hover {
    background-color: var(--vt-c-off-white);
}
.createToolTip {
    padding-left: 150px;
    -webkit-user-select: none; /* Safari */        
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
}
</style>