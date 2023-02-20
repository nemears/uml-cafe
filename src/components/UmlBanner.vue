<script>
export default {
    props: [
        'client'
    ],
    data() {
        return {
            bannerOptions: [
                'Load from file',
                'Save to file'
            ],
            optionsEnabled: false,
            optionColor: '#3f5375'
        }
    },
    methods: {
        optionToggle() {
            this.optionsEnabled = !this.optionsEnabled;
        }
    }
}
</script>
<template>
    <div class="umlBanner">
        <div class="optionsContainer">
            <div class="optionsButton" @click="optionToggle">
                <svg :fill="optionColor" @mouseover="optionColor='#5c74a1'" 
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
        <div v-for="options in bannerOptions" :key="options" class="optionsOption">
            {{ options }}
        </div>
    </div>
</template>
<style>
.umlBanner {
    flex: 0 1 auto;
    background-color: rgb(79, 155, 255);
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