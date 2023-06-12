<script>
import hamburgerSVG from './icons/hamburger.svg';
import hamburgerHoverSVG from './icons/hamburger_hover.svg';
import classSVG from './icons/class.svg'
const packageJSON = require('../../package.json');
import PopUp from './bannerComponents/PopUp.vue';

export default {
    data() {
        return {
            optionsEnabled: false,
            optionColor: "#2d3035",
            downloadRef: "#",
            downloadDownload: "",
            hamburgerHover: false,
            hamburgerSVG: hamburgerSVG,
            hamburgerHoverSVG: hamburgerHoverSVG,
            version: packageJSON.version,
            websiteImage: classSVG,
            loginEnabled: false,
            signupEnabled: false,
            signUpErrorMessage: undefined,
            loginErrorMessage: undefined,
            user: undefined
        };
    },
    emits: ["newModelLoaded"],
    methods: {
        optionToggle() {
            this.optionsEnabled = !this.optionsEnabled;
            this.loginEnabled = false;
            this.signupEnabled = false;
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
            await new Promise(res => {
                setTimeout(() => {
                    this.$emit("newModelLoaded");
                    this.optionsEnabled = false;
                    res();
                }, "1 second");
            });
        },
        async saveToFile(event) {
            let fileContent = await this.$umlWebClient.save();
            let myFile = new Blob([fileContent], { type: "text/plain" });
            window.URL = window.URL || window.webkitURL;
            this.downloadRef = window.URL.createObjectURL(myFile);
            this.downloadDownload = "model.yml";
            setTimeout(() => {
                this.$refs.saveA.click();
                this.optionsEnabled = false;
            }, "500 milliseconds");
        },
        toggleHamburgerHover() {
            this.hamburgerHover = !this.hamburgerHover;
        },
        toggleLogin() {
            this.optionsEnabled = false;
            this.loginEnabled = !this.loginEnabled;
            this.loginErrorMessage = undefined;
        },
        async login() {
            const user = this.$refs.logInUserInput.value;
            const password = this.$refs.logInPasswordInput.value;
            let successfulLogin = true;
            this.$umlWebClient.login(user, password).catch((err) => {
                this.$umlWebClient.login("0", undefined);
                this.loginErrorMessage = err;
                successfulLogin = false;
            }).then(() => {
                if (successfulLogin) {
                    this.user = this.$umlWebClient.user;
                    this.loginEnabled = false;
                }
            });
        },
        toggleSignup() {
            this.optionsEnabled = false;
            this.signupEnabled = !this.signupEnabled;
            this.signUpErrorMessage = undefined
        },
        signup() {
            const user = this.$refs.signUpUserInput.value;
            const password = this.$refs.signUpPasswordInput.value;
            const password2 = this.$refs.signUpPasswordInput2.value;
            // check if passwords match
            if (password !== password2) {
                // show error to user
                this.signUpErrorMessage = 'passwords do not match!'
                return;
            }

            if (password.length < 4) {
                this.signUpErrorMessage = 'password is too short';
                return;
            }

            if (user.length === 0 || user === 'sessions' || user === '0') {
                this.signUpErrorMessage = 'invalid username!';
                return;
            } 

            this.$umlWebClient.signUp(user, password).catch((e) => {
                this.signUpErrorMessage = e;
                return;
            }).then(() => {
                this.user = this.$umlWebClient.user;
            });
        }
    },
    computed: {
        gapStyle() {
            return {
                width: '10px'
            }
        }
    },
    components: { PopUp }
}
</script>
<template>
    <div class="umlBanner">
        <div class="titleContainer">
            <img v-bind:src="websiteImage"/>
            open-uml v{{ version }}
            <div :style="gapStyle"></div>
            <div v-if="user !== undefined">
                Logged in as {{ user }}
            </div>
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
        <div class="optionsOption" @click="toggleLogin">
            Log In
        </div>
        <div class="optionsOption" @click="toggleSignup">
            Sign Up
        </div>
        <a :href="downloadRef" :download="downloadDownload" ref="saveA" style="display: none;"></a>
    </div>
    <PopUp :header="'Log In'" :toggle="toggleLogin" v-if="loginEnabled" @keydown.enter="login">
        <form>
            <label for="'logInUserInput'">username: </label>
            <input type="text" id="'logInUserInput'" name="'logInUserInput'" ref="logInUserInput">
            <br>
            <label for="'logInPasswordInput'">password: </label>
            <input type="password" id="'logInPasswordInput'" name="'logInPasswordInput'" ref="logInPasswordInput">
            <br>
            <div style="vertical-align:middle;">
                <div v-if="loginErrorMessage !== undefined" class="signUpError">
                    {{ loginErrorMessage }}
                </div>
                <input type="button" value="Log In" @click="login">
            </div>
        </form>
    </PopUp>
    <PopUp :header="'Sign Up'" :toggle="toggleSignup" v-if="signupEnabled" @keydown.enter="signup">
        <form>
            <label for="'signUpUserInput'">username: </label>
            <input type="text" id="'signUpUserInput'" name="'signUpUserInput'" ref="signUpUserInput">
            <br>
            <label for="'signUpPasswordInput'">password: </label>
            <input type="password" id="'signUpPasswordInput'" name="'signUpPasswordInput'" ref="signUpPasswordInput">
            <br>
            <label for="'signUpPasswordInput2'">password: </label>
            <input type="password" id="'signUpPasswordInput2'" name="'signUpPasswordInput2'" ref="signUpPasswordInput2">
            <br>
            <div style="vertical-align:middle;">
                <div v-if="signUpErrorMessage !== undefined" class="signUpError">
                    {{ signUpErrorMessage }}
                </div>
                <input type="button" value="Sign Up" @click="signup">
            </div>
        </form>
    </PopUp>
</template>
<style>
.umlBanner {
    flex: 0 1 auto;
    background-color: var(--vt-c-black);
    max-height: 10vh;
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
.signUpError {
    background-color: #ff4343;
    padding-left: 5px;
    padding-right: 5px;
    margin-top: 5px;
    margin-left: 5px;
    z-index: 2;
    float: right;
}
</style>
