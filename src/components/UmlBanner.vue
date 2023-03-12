<script>
import UmlWebClient from 'uml-js/lib/umlClient';

export default {
    data() {
        return {
            optionsEnabled: false,
            optionColor: '#2d3035',
            downloadRef: '#',
            downloadDownload: ''
        }
    },
    emits: ['newModelLoaded'],
    methods: {
        optionToggle() {
            this.optionsEnabled = !this.optionsEnabled;
        },
        loadFromFile() {
            this.$refs.loadFromFileFileInput.click();
        },
        async loadFromFileInput(event) {
            let file = event.target.files[0];
            let reader = new FileReader();
            let fileAsStr = await new Promise((res, rej) => {
                reader.onload = () => {
                    res(reader.result);
                };
                reader.onerror = () => {
                    rej(reader.error);
                };
                reader.readAsText(file);
            });
            const client = new UmlWebClient(this.$sessionName)
            client.load(fileAsStr);

            // TODO update containment tree and close tabs of specs and diagrams
            await new Promise( res => {
                setTimeout(() => {
                    this.$emit('newModelLoaded');
                    this.optionsEnabled = false;
                    res()
                }, '1 second');
            });
        },
        async saveToFile(event) {
            const client = new UmlWebClient(this.$sessionName);
            let fileContent = await client.save();
            let myFile = new Blob([fileContent], {type: 'text/plain'});
            window.URL = window.URL || window.webkitURL;
            this.downloadRef = window.URL.createObjectURL(myFile);
            this.downloadDownload = 'model.yml';
            setTimeout(() => {
                this.$refs.saveA.click();
                this.optionsEnabled = false;
            }, '500 milliseconds');
        }
    }
}
</script>
<template>
    <div class="umlBanner">
        <div class="optionsContainer">
            <div class="optionsButton" @click="optionToggle">
                <svg :fill="optionColor" @mouseover="optionColor='#131416'" 
                    @mouseleave="optionColor='#3f5375'" version="1.1" id="Capa_1" 
                    xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                    width="20px" height="20px" viewBox="0 0 124 124" xml:space="preserve">
                    <g>
                        <path d="M112,6H12C5.4,6,0,11.4,0,18s5.4,12,12,12h100c6.6,0,12-5.4,12-12S118.6,6,112,6z"/>
                        <path d="M112,50H12C5.4,50,0,55.4,0,62c0,6.6,5.4,12,12,12h100c6.6,0,12-5.4,12-12C124,55.4,118.6,50,112,50z"/>
                        <path d="M112,94H12c-6.6,0-12,5.4-12,12s5.4,12,12,12h100c6.6,0,12-5.4,12-12S118.6,94,112,94z"/>
                    </g>
                </svg>
            </div>
        </div>
    </div>
    <div class="dropdown" v-if="optionsEnabled">
        <div class="optionsOption" @click="loadFromFile">
            <input ref="loadFromFileFileInput" type="file" style="position: absolute; top: -100px;" @change="loadFromFileInput" >
            Load from file
        </div>
        <div class="optionsOption" @click="saveToFile">
            Save to file
        </div>
        <a :href="downloadRef" :download="downloadDownload" ref="saveA" style="display: none;"></a>
    </div>
</template>
<style>
.umlBanner {
    flex: 0 1 auto;
    background-color: var(--vt-c-black);;
}
.optionsContainer {
    padding: 5px 5px 5px 5px;
    float: right;
}
.optionsOption {
    padding: 5px 5px 5px 5px;
    /* background-color: #d8dee8; */
    font-family: system-ui;
    position: relative;
}
.optionsOption:hover {
    background-color: #DEF;
}
.dropdown {
    /* display: none; */
    z-index: 1000;
    top: 30px;
    right: 0px;
    position: absolute;
    overflow: hidden;
    border: 1px solid #CCC;
    white-space: nowrap;
    font-family: system-ui;
    background: #FFF;
    color: #333;
    border-radius: 5px;
    padding: 0;
}
</style>