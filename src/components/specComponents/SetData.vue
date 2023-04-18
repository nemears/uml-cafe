<script>
import getImage from '../../GetUmlImage.vue';

export default {
    props: ['label', 'initialData', 'umlid', 'subsets'],
    inject: ['dataChange'],
    emits: ['specification'],
    data() {
        return {
            data: []
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
                    this.subsets.includes(data.set)
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
        }
    }
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
            <div class="setElement" v-if="data.length === 0"></div>
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
    background-color: #222427;
    min-height: 24px;
    display: flex;
}
.setElement:hover {
    background-color: #292c30;
}
</style>