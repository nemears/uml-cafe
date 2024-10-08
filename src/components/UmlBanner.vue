<script>
import hamburgerSVG from '../assets/icons/general/hamburger.svg';
import hamburgerHoverSVG from '../assets/icons/general/hamburger_hover.svg';
import classSVG from '../assets/icons/general/class.svg'
const packageJSON = require('../../package.json');
import FreezeAndPopUp from './bannerComponents/FreezeAndPopUp.vue';
import UserSelector from './bannerComponents/UserSelector.vue';
import BannerButton from './bannerComponents/BannerButton.vue';
import UserBubble from './bannerComponents/UserBubble.vue';
import { getProjectLoginObject, createUmlClassDiagram, createElementUpdate } from '../umlUtil';
import { randomID } from 'uml-client/lib/types/element';
export default {
    props: [
        'users',
        'theme',
    ],
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
            rememberUserEnabled: false,
            logoutEnabled: false,
            signupEnabled: false,
            createProjectEnabled: false,
            projectSettingsEnabled: false,
            signUpErrorMessage: undefined,
            loginErrorMessage: undefined,
            createProjectWarningMessage: undefined,
            projectSettingsWarningMessage: undefined,
            user: undefined,
            editUsers: [],
            viewUsers: [],
            editUsersInit: undefined,
            viewUsersInit: undefined,
            projectExplorerEnabled: false,
            recentProjects: undefined,
            userProjects: undefined,
            isDark: false,
        }
    },
    emits: [
        "newModelLoaded", 
        'elementUpdate', 
        'diagram', 
        'userUpdate',
        'command',
        'theme',
    ],
    mounted() {
        // TODO check if we need to enable login on startup
        if (!this.$umlWebClient.initialized) {
            this.toggleLogin()
        }
        if (this.$umlWebClient.user && this.$umlWebClient.user !== '0') {
            this.user = this.$umlWebClient.user;
        }
    },
    methods: {

        optionToggle() {
            this.optionsEnabled = !this.optionsEnabled;
            this.loginEnabled = false;
            this.signupEnabled = false;
            this.projectExplorerEnabled = false;
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
        async saveToFile() {
            let fileContent = await this.$umlWebClient.dump();
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
        toggleRememberUser() {
            this.rememberUserEnabled = !this.rememberUserEnabled;
        },
        async login() {
            var user, password;
            if (this.logoutEnabled) {
                user = '0';
                password = '';
            } else {
                user = this.$refs.logInUserInput.value;
                password = this.$refs.logInPasswordInput.value;
            }
            if (user.length === 0) {
                this.loginErrorMessage = 'Invalid username';
                return;
            }
            let successfulLogin = true;
            if (this.$umlWebClient.initialized) {
                await this.$umlWebClient.close();
            }
            this.$umlWebClient.login({
                user: user, 
                password: password,
                address: this.$umlWebClient.address,
                project: this.$umlWebClient.project,
                group: this.$umlWebClient.group,
            }).catch((err) => {
                this.$umlWebClient.login({
                    address: this.$umlWebClient.address,
                    project: this.$umlWebClient.project,
                    group: this.$umlWebClient.group,
                });
                this.loginErrorMessage = JSON.parse(err).error.message;
                successfulLogin = false;
            }).then(() => {
                if (successfulLogin) {
                    if (this.logoutEnabled) {
                        this.$umlWebClient.user = undefined;
                        this.logoutEnabled = !this.logoutEnabled;
                    }
                    this.user = this.$umlWebClient.user;
                    this.loginEnabled = false;
                    this.$emit("newModelLoaded");
                    this.$emit('userUpdate');
                    if (this.rememberUserEnabled) {
                        sessionStorage.setItem('user', this.$umlWebClient.user);
                        sessionStorage.setItem('password', password);
                    } else {
                        sessionStorage.removeItem('user');
                        sessionStorage.removeItem('password');
                    }
                }
            });
        },
        toggleSignup() {
            this.optionsEnabled = false;
            this.signupEnabled = !this.signupEnabled;
            this.signUpErrorMessage = undefined
        },
        toggleLogout() {
            this.optionsEnabled = false;
            if (!this.logoutEnabled) {
                this.logoutEnabled = true;
                this.loginErrorMessage = undefined;
                this.login();
            }
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

            if (user.length === 0 || user === 'sessions' || user === '0' || user === 'js' || user === 'css' || user === 'img') {
                this.signUpErrorMessage = 'invalid username!';
                return;
            } 

            this.$umlWebClient.signUp(user, password).catch((e) => {
                this.signUpErrorMessage = e;
                return;
            }).then(() => {
                this.user = this.$umlWebClient.user;
                this.$emit('userUpdate');
                sessionStorage.setItem('user', this.$umlWebClient.user);
                sessionStorage.setItem('password', password);
                this.toggleSignup();
            });
        },
        toggleCreateProject() {
            this.projectExplorerEnabled = false;
            this.createProjectEnabled = !this.createProjectEnabled;
            this.optionsEnabled = false;
            this.createProjectWarningMessage = undefined;
        },
        async toggleProjectExplorer() {
            this.projectExplorerEnabled = !this.projectExplorerEnabled;
            this.optionsEnabled = false;
            if (this.projectExplorerEnabled) {
                const userInfo = await this.$umlWebClient.userInfo();
                this.recentProjects = userInfo.recentProjects;
                this.userProjects = userInfo.userProjects;
                if (userInfo.recentProjects.length == 0) {
                    this.recentProjects = undefined;
                }
                if (userInfo.userProjects.length == 0) {
                    this.userProjects = undefined;
                }
            }
        },
        async openProject(projectName) {
            await this.$umlWebClient.close();
            let beginningOfURL = document.URL;
            if (beginningOfURL.slice(-1) === '/') {
                beginningOfURL = beginningOfURL.slice(0, beginningOfURL.length - 1);
            }
            const beginningOfUrlSplit = beginningOfURL.split('/');
            beginningOfURL = beginningOfUrlSplit[0];
            const projectLoginObject = getProjectLoginObject(projectName, this.$umlWebClient.address)
            window.location.replace(beginningOfURL + '/' + projectLoginObject.group+ '/' + projectLoginObject.project);
        },
        getVisibility() {
            let projectVisibility = this.$refs.visibilitySelect.options[this.$refs.visibilitySelect.selectedIndex].text;
            if (projectVisibility === "Public") {
                projectVisibility = "public";
            } else if (projectVisibility === "Read-Only Public") {
                projectVisibility = "readonly";
            } else if (projectVisibility === "Private") {
                projectVisibility = "private";
            }
            return projectVisibility;
        },
        async createProject() {
            // TODO
            if (!this.$umlWebClient.user || this.$umlWebClient.user === '0') {
                // show error
                this.createProjectWarningMessage = 'must be logged in to create a project!';
                return
            }
            await this.$umlWebClient.close();
            await this.$umlWebClient.login({
                user: this.$umlWebClient.user,
                password: this.$umlWebClient.password,
                address: this.$umlWebClient.address,
                group: this.$umlWebClient.user,
                project: this.$refs.projectIdentifier.value,
                create: true,
            });

            // get visibility
            let projectVisibility = this.getVisibility();

            this.$umlWebClient.updateProjectConfig({
                project: {
                    visibility: projectVisibility,
                    edit: {
                        add: this.editUsers
                    },
                    view: {
                        add: this.viewUsers
                    }
                }
            });

            sessionStorage.setItem('user', this.$umlWebClient.user);
            sessionStorage.setItem('passwordHash', this.$umlWebClient.passwordHash);
            window.location.replace('/' + this.$umlWebClient.user + '/' + this.$refs.projectIdentifier.value);
        },
        closeLoginAndGoToSignUp() {
            this.toggleLogin();
            this.toggleSignup();
        },
        toggleProjectSettings() {
            this.projectSettingsEnabled = !this.projectSettingsEnabled;
            this.optionsEnabled = false;
            this.projectSettingsWarningMessage = undefined;
            if (this.projectSettingsEnabled) {
                // fetch current settings from the server
                this.$umlWebClient.getProjectConfig().catch((err) => {
                    this.projectSettingsWarningMessage = JSON.parse(err.error.message);
                }).then((projectConfig) => {
                    this.$refs.visibilitySelect.value = projectConfig.project.visibility;
                    this.editUsers = projectConfig.project.edit;
                    this.viewUsers = projectConfig.project.view;
                    this.editUsersInit = this.editUsers.slice();
                    this.viewUsersInit = this.viewUsers.slice();
                });
            }
        },
        updateProjectSettings() {
            if (this.$umlWebClient.user != location.pathname.split('/')[1]) {
                this.projectSettingsWarningMessage = 'Cannot update project, not owner!';
                return;
            }
            const projectVisibility = this.getVisibility();
            const removedEditUsers = [];
            const addedEditUsers = [];
            const removedViewUsers = [];
            const addedViewUsers = [];
            for (const initUser of this.editUsersInit) {
                if (!this.editUsers.includes(initUser)) {
                    removedEditUsers.push(initUser);
                }
            }
            for (const user of this.editUsers) {
                if (!this.editUsersInit.includes(user)) {
                    addedEditUsers.push(user);
                }
            }
            for (const initUser of this.viewUsersInit) {
                if (!this.viewUsers.includes(initUser)) {
                    removedViewUsers.push(initUser);
                }
            }
            for (const user of this.viewUsers) {
                if (!this.viewUsersInit.includes(user)) {
                    addedViewUsers.push(user);
                }
            }
            this.$umlWebClient.updateProjectConfig({
                project: {
                    visibility: projectVisibility,
                    edit: {
                        add: addedEditUsers,
                        remove: removedEditUsers
                    },
                    view: {
                        add: addedViewUsers,
                        remove: removedViewUsers
                    }
                }
            }).catch((err) => {
                this.projectSettingsWarningMessage = err.message;
            });
            this.toggleProjectSettings();
        },
        toggleTheme() {
            console.warn('TODO change theme!');
            this.isDark = !this.isDark;
            this.$emit('theme', this.isDark ? 'dark' : 'light');
        },
        async createDiagram () {
            const head = await this.$umlWebClient.head();
            const diagramID = randomID();
            const diagramPackage = await createUmlClassDiagram(diagramID, head, this.$umlWebClient, this.$umlCafeModule);
            this.$emit('command', {
                name: 'diagramCreate',
                element: head.id,
                redo: false,
                context: {
                    diagramID: diagramID,
                    parentID: head.id,
                }
            });
            this.$emit('diagram', diagramPackage);
            this.$emit('elementUpdate', createElementUpdate(head));
        },
        propogateElementUpdate(elementUpdate) {
            this.$emit('elementUpdate', elementUpdate);
        },
        propogateDiagram(diagram) {
            this.$emit('diagram', diagram);
        },
        propogateCommand(command) {
            this.$emit('command', command);
        }
    },
    computed: {
        gapStyle() {
            return {
                width: '10px'
            }
        },
        entryStyle() {
            return {
                inputStyle : true,
                inputDark : this.theme === 'dark',
                inputLight : this.theme === 'light',
            }
        },
        entryButton() {
            return {
                inputButton : true,
                inputDark : this.theme === 'dark',
                inputLight : this.theme === 'light',
            }
        }
    },
    components: { FreezeAndPopUp, UserSelector, BannerButton, UserBubble }
}
</script>
<template>
    <div class="umlBanner"
            :class="{
                bannerDark : theme === 'dark',
                bannerLight : theme === 'light',
            }">
        <div class="titleContainer">
            <img v-bind:src="websiteImage"/>
            uml-cafe v{{ version }}
            <div :style="gapStyle"></div>
            <div v-if="user !== undefined">
                Logged in as {{ user }}
            </div>
            <div :style="gapStyle"></div>
            <div v-if="$umlWebClient.readonly">
                readonly
            </div>
        </div>
        <div class="bannerItems">
            <UserBubble v-for="user in users" :key="user.id" :user="user"/>
            <BannerButton 
                @button-clicked="createDiagram"
                :label="'Create New Diagram'"
                :theme="theme"></BannerButton>
            <div :style="gapStyle"></div>
            <BannerButton 
                @button-clicked="toggleLogin"
                :label="'Login'"
                :theme="theme"
                ></BannerButton>
            <div class="optionsContainer">
                <div class="optionsButton" @click="optionToggle">
                    <img v-bind:src="hamburgerSVG" v-if="!hamburgerHover" @mouseenter="toggleHamburgerHover"/>
                    <img v-bind:src="hamburgerHoverSVG" v-if="hamburgerHover" @mouseleave="toggleHamburgerHover"/>
                </div>
            </div>
        </div>
    </div>
    <div class="dropdown" v-if="optionsEnabled">
        <div class="optionsOption" @click="toggleProjectExplorer">
            Browse Projects
        </div>
        <div class="optionsOption" @click="toggleCreateProject">
            Create Project
        </div>
        <div class="optionsOption" @click="toggleProjectSettings">
            Project Settings
        </div>
        <div class="optionsOption" @click="loadFromFile">
            <input ref="loadFromFileFileInput" type="file" style="position: absolute; top: -1000px;" @change="loadFromFileInput" >
                Load from file
        </div>
        <div class="optionsOption" @click="saveToFile">
            Save to file
        </div>
        <div class="optionsOption">
            Theme 
            <label class="switch">
                <input type="checkbox" @change="toggleTheme">
                <span class="slider"></span>
            </label>
        </div>
        <div class="optionsOption" @click="toggleLogin">
            Log In
        </div> 
        <div class="optionsOption" @click="toggleLogout">
            Log Out
        </div>
        <div class="optionsOption" @click="toggleSignup">
            Sign Up
        </div>
        <a :href="downloadRef" :download="downloadDownload" ref="saveA" style="display: none;"></a>
    </div>
    <FreezeAndPopUp :label="'Log In'"
                    :toggle="toggleLogin"
                    :theme="theme"
                    v-if="loginEnabled" 
                    @keydown.enter="login">
        <form>
            <label for="'logInUserInput'">username: </label>
            <input :class="entryStyle" type="text" id="'logInUserInput'" name="'logInUserInput'" ref="logInUserInput">
            <br>
            <label for="'logInPasswordInput'">password: </label>
            <input :class="entryStyle" type="password" id="'logInPasswordInput'" name="'logInPasswordInput'" ref="logInPasswordInput">
            <br>
            <label for="rememberUser">Remember Me</label>
            <input style="margin-left:5px;" type="checkbox" v-model="this.rememberUserEnabled" id="rememberUser" @click="toggleRememberUser">
            <br>
            <br>
            <div style="vertical-align:middle;">
                <div v-if="loginErrorMessage !== undefined" class="signUpError">
                    {{ loginErrorMessage }}
                </div>
                <input :class="entryButton" type="button" value="Log In" @click="login">
            </div>
            <hr>
            <input :class="entryButton" style="margin-right:20px;" type="button" value="Sign Up" @click="closeLoginAndGoToSignUp">
            <input :class="entryButton" type="button" value="Log Out" @click="toggleLogout">
        </form>
    </FreezeAndPopUp>
    <FreezeAndPopUp :label="'Sign Up'"
                    :toggle="toggleSignup"
                    :theme="theme"
                    v-if="signupEnabled"
                    @keydown.enter="signup">
        <form>
            <label for="'signUpUserInput'">username: </label>
            <input :class="entryStyle" type="text" id="'signUpUserInput'" name="'signUpUserInput'" ref="signUpUserInput">
            <br>
            <label for="'signUpPasswordInput'">password: </label>
            <input :class="entryStyle" type="password" id="'signUpPasswordInput'" name="'signUpPasswordInput'" ref="signUpPasswordInput">
            <br>
            <label for="'signUpPasswordInput2'">retype password: </label>
            <input :class="entryStyle" type="password" id="'signUpPasswordInput2'" name="'signUpPasswordInput2'" ref="signUpPasswordInput2">
            <br>
            <div style="vertical-align:middle;">
                <div v-if="signUpErrorMessage !== undefined" class="signUpError">
                    {{ signUpErrorMessage }}
                </div>
                <input :class="entryButton" type="button" value="Sign Up" @click="signup">
            </div>
        </form>
    </FreezeAndPopUp>
    <FreezeAndPopUp :label="'Create Project'" 
                    :toggle="toggleCreateProject"
                    :theme="theme"
                    v-if="createProjectEnabled">
        <p>
            Creating a new project allows your project to become persistent on this server. Being persistent means that the url will always be the same, and as long as the server is up your project will be accessible via the internet. This allows for easy sharing of models in different view modes. You may also grant other users permissions to see or write to the project you have created. Just give the project an identifier and choose the permissions and your project should be ready to build and share.
        </p>
        <hr>
        <form>
            <div class="floatFormOption">
                <label for="'projectIdentifier'">Project Identifier : </label>
                <p>
                    The Project Identifier is used for the url that you can share and the name of the model file if you download it.
                </p>
                <input :class="entryStyle" type="text" 
                       id="'projectIdentifier'" 
                       name="'projectIdentifier'" 
                       ref="projectIdentifier"
                       value="Project">
            </div>
            <div class="floatFormOption">
                <label for="visibilitySelect">
                    Project Visibility:
                </label>
                <p>
                    The Project Visibility establishes a general rule to who can view this project. If it is private then only you and who you add to the editors and viewers list can edit and view it. If it is Read-Only Public that means that anyone with the link can see the project and walk around it but cannot edit it. If it is Public then anyone can view or edit the project if they have the link.
                </p>
                <select :class="entryStyle" name="visibilitySelect" id="visibilitySelect" ref="visibilitySelect">
                    <option value="private">Private</option>
                    <option value="readonly">Read-Only Public</option>
                    <option value="public">Public</option>
                </select>
            </div>
            <div class="floatFormOption">
                <UserSelector :label="'Edit List'" :users="editUsers" :theme="theme">
                    <p>
                        The list of users on the server that can edit the project. They will be able to create and delete from your project. This list has no effect if your project is Public.
                    </p>
                </UserSelector>
            </div>
            <div class="floatFormOption">
                <UserSelector :label="'View List'" :users="viewUsers" :theme="theme">
                    <p>
                        The list of users on the server that can view the project. They will be able to navigate around the project and view all of the details within it. They will not however be allowed to make any changes to the Project.
                    </p>
                </UserSelector>
            </div>
            <div class="floatFormOption">
                <div class="createProjectDiv">
                    <input :class="entryButton" type="button" value="Create" @click="createProject">
                </div>
                <div class="createProjectError" v-if="createProjectWarningMessage !== undefined">
                    {{ createProjectWarningMessage }}
                </div>
            </div>
        </form>
    </FreezeAndPopUp>
    <FreezeAndPopUp :label="'Project Settings'"
    v-if="projectSettingsEnabled"
    :toggle="toggleProjectSettings"
    :theme="theme">
        <p>
            These are the current settings that the project has. Only the user who created and owns the project may alter these settings.
        </p>
        <hr>
        <form>
            <div class="floatFormOption">
                <label for="visibilitySelect">
                    Project Visibility:
                </label>
                <p>
                    The Project Visibility establishes a general rule to who can view this project. If it is private then only you and who you add to the editors and viewers list can edit and view it. If it is Read-Only Public that means that anyone with the link can see the project and walk around it but cannot edit it. If it is Public then anyone can view or edit the project if they have the link.
                </p>
                <select :class="entryStyle" name="visibilitySelect" id="visibilitySelect" ref="visibilitySelect">
                    <option value="private">Private</option>
                    <option value="readonly">Read-Only Public</option>
                    <option value="public">Public</option>
                </select>
            </div>
            <div class="floatFormOption">
                <UserSelector :label="'Edit List'" :users="editUsers" :theme="theme">
                    <p>
                        The list of users on the server that can edit the project. They will be able to create and delete from your project. This list has no effect if your project is Public.
                    </p>
                </UserSelector>
            </div>
            <div class="floatFormOption">
                <UserSelector :label="'View List'" :users="viewUsers" :theme="theme">
                    <p>
                        The list of users on the server that can view the project. They will be able to navigate around the project and view all of the details within it. They will not however be allowed to make any changes to the Project.
                    </p>
                </UserSelector>
            </div>
            <div class="floatFormOption">
                <div class="createProjectDiv">
                    <input :class="entryButton" type="button" value="Update" @click="updateProjectSettings">
                </div>
                <div class="createProjectError" v-if="projectSettingsWarningMessage !== undefined">
                    {{ projectSettingsWarningMessage }}
                </div>
            </div>
        </form>
    </FreezeAndPopUp>
    <FreezeAndPopUp :label="'Project Explorer'" 
                    v-if="projectExplorerEnabled"
                    :toggle="toggleProjectExplorer"
                    :theme="theme">
        Browse your recent projects, as well as the projects that you own. Double click on a project to open it.
        <hr/>
        <h3>Recent Projects:</h3>
        <div 
            v-if="recentProjects" 
            v-for="recentProject in recentProjects" 
            :key="recentProject" 
            :class="entryStyle" 
            @dblclick="openProject(recentProject)">
            {{ recentProject }}
        </div>
        <div v-if="!recentProjects" :class="entryStyle"></div>
        <br/>
        <h3>Your Projects:</h3>
        <div 
            v-if="userProjects" 
            v-for="userProject in userProjects" 
            :key="userProject" 
            :class="entryStyle"
            @dblclick="openProject(userProject)">
            {{ userProject }}
        </div>
        <div v-if="!userProjects" :class="entryStyle"></div>
        <br/>
        <button :class="entryButton" @click="toggleCreateProject">
            Create Project
        </button>

    </FreezeAndPopUp>
</template>
<style>
.umlBanner {
    flex: 0 1 auto;
    max-height: 10vh;
}
.bannerDark {
    background-color: var(--vt-c-black);
}
.bannerLight {
    background-color: var(--uml-cafe-light-dark);
    color: var(--vt-c-dark-dark);
}
.bannerItems {
    display: flex;
    justify-content: flex-end;
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
    padding: 5px 15px;
    font-family: system-ui;
    position: relative;
}
.optionsOption:hover {
    background-color: var(--mx-menu-hover-backgroud);
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
.createProjectError {
    background-color: #ff4343;
    padding-left: 5px;
    padding-right: 5px;
    margin-top: 5px;
    margin-left: 5px;
    z-index: 2;
    float: left;
}
.floatFormOption {
    padding: 5px 15px;
}
hr {
    margin: 20px 0px;
}
.inputStyle {
    width: 46vw;
    
    min-height: 24px;
    display: flex;
    padding-left: 5px;
    border: none;
    
}
.inputDark {
    background-color: var(--open-uml-selection-dark-1);
    color: var( --vt-c-text-light-1);
}
.inputDark:hover {
    background-color: var(--vt-c-dark-soft);
    color: var( --vt-c-text-light-1);
}
.inputLight {
    color: var(--vt-c-dark-dark);
    background-color: var(--vt-c-white-soft);
}
.inputLight:hover {
    background-color: var(--vt-c-white-mute);
    color: var(--vt-c-dark-dark);
}
.createProjectDiv {
    float: right;
}
.inputButton {
    border: none;
    height: 2em;
    border-radius: 10px;
}

/* special slider input */
.switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 24px;
    margin-left: 10px;
}

/* Hide default HTML checkbox */
.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--uml-cafe-light-dark-2);
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 15px;
  width: 15px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 24px;
}

input:checked + .slider {
  background-color: #ccc;
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--uml-cafe-light-dark-2); /* change to user color */
}

input:checked + .slider:before {
  -webkit-transform: translateX(15px);
  -ms-transform: translateX(15px);
  transform: translateX(15px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
