<script>
import UmlWebClient from 'uml-js/lib/umlClient';

export default {
    props: ['umlID'],
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
            for await(let ownedElement of el.ownedElements) {

            }
            // TODO check if named element
            this.namedElementData = {
                name: el.name
            };
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
    }
}
</script>
<template>
    <div class="mainDiv">
        <h1>
            Specification of {{ elementType }} {{ elementLabel }}
        </h1>
        <div class="elementTypeDiv">
            <div>
                <h3>
                    Element properties:
                </h3>
            </div>
            <div>
                <div>
                    ID : {{ umlID }}
                </div>
            </div>
        </div>
    </div>
</template>
<style>
.mainDiv {
    border: solid #525258;
    border-width: 2px;
    padding: 10px;
}
.elementTypeDiv {
    border: solid #525258;
    border-width: 2px;
    padding: 10px;
}
</style>