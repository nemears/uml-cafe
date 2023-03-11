<script>
import UmlWebClient from 'uml-js/lib/umlClient';

export default {
    props: ['label', 'initialData'],
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
        }
    },
    methods: {
        async specification(id) {
            const client = new UmlWebClient(this.$sessionName);
            this.$emit('specification', await client.get(id));
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