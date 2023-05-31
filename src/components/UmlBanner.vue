<script>
import hamburgerSVG from './icons/hamburger.svg';
import hamburgerHoverSVG from './icons/hamburger_hover.svg';
import classSVG from './icons/class.svg'
const packageJSON = require('../../package.json');

export default {
    data() {
        return {
            optionsEnabled: false,
            optionColor: '#2d3035',
            downloadRef: '#',
            downloadDownload: '',
            hamburgerHover: false,
            hamburgerSVG: hamburgerSVG,
            hamburgerHoverSVG: hamburgerHoverSVG,
            version: packageJSON.version,
            websiteImage: classSVG,
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
            this.$umlWebClient.load(fileAsStr);

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
            let fileContent = await this.$umlWebClient.save();
            let myFile = new Blob([fileContent], {type: 'text/plain'});
            window.URL = window.URL || window.webkitURL;
            this.downloadRef = window.URL.createObjectURL(myFile);
            this.downloadDownload = 'model.yml';
            setTimeout(() => {
                this.$refs.saveA.click();
                this.optionsEnabled = false;
            }, '500 milliseconds');
        },
        toggleHamburgerHover() {
            this.hamburgerHover = !this.hamburgerHover;
        }
    }
}
</script>
<template>
    <div class="umlBanner">
        <div class="titleContainer">
            <img v-bind:src="websiteImage"/>
            open-uml v{{ version }}
        </div>
        <div class="optionsContainer">
            <div class="optionsButton" @click="optionToggle">
                <img v-bind:src="hamburgerSVG" v-if="!hamburgerHover" @mouseenter="toggleHamburgerHover"/>
                <img v-bind:src="hamburgerHoverSVG" v-if="hamburgerHover" @mouseleave="toggleHamburgerHover"/>
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
.titleContainer {
    vertical-align: middle;
    padding-left: 5px;
    padding-top: 5px;
    padding-bottom: 5px;
    display: flex;
    float: left;
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