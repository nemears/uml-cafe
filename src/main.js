import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import { randomID } from 'uml-client/lib/types/element';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'
import Vue3ColorPicker from "vue3-colorpicker";
import "vue3-colorpicker/style.css";
import { UmlWebClient } from 'uml-client';
import { getProjectLoginObject, UmlCafeModule } from './umlUtil';
import config from '../config.json';

let projectName = randomID();
let groupName = 'sessions';
let serverAddress = config.api_location;

// this is some logic to determine wether we are accessing an already created project or if we are in a new state.
if (location.pathname != "/") {
    let projectUrl = location.pathname;
    if (projectUrl.charAt(projectUrl.length - 1) === '/') {
        projectUrl = projectUrl.slice(0, projectUrl.length - 1);
    }
    if (projectUrl.charAt(0) === '/') {
        projectUrl = projectUrl.slice(1, projectUrl.length);
    }

    let loginObject = getProjectLoginObject(projectUrl, serverAddress); 
    let umlWebClient = new UmlWebClient(loginObject);
    let umlCafeModule = new UmlCafeModule(umlWebClient);

    const mountApp = () => {
        const app = createApp(App);
        app.config.globalProperties.$umlWebClient = umlWebClient;
        app.config.globalProperties.$umlCafeModule = umlCafeModule;
        app.config.unwrapInjectedRef = true;
        app.mount('#app');
        app.use(ContextMenu);
        app.use(Vue3ColorPicker);
    }

    umlWebClient.initialization.then(() => {
        sessionStorage.setItem('user', loginObject.user);
        sessionStorage.setItem('password', loginObject.password);
        mountApp();
    }).catch((err) => {
        console.error(err);
        const errObj = JSON.parse(err);
        if (errObj.error.code && errObj.error.code == 1) {
            // try again with anonymous user
            umlWebClient = new UmlWebClient({
                address: serverAddress,
                group: groupName,
                project: projectName,
                create: groupName !== 'sessions',
            });
            umlWebClient.initialization.catch(() => {
                console.warn('must login before using application');
            }).then(() => {
                mountApp();
            });
        } else {
            mountApp();
        }
    });
} else {
    let beginningOfURL = document.URL;
    if (beginningOfURL.slice(-1) === '/') {
        beginningOfURL = beginningOfURL.slice(0, beginningOfURL.length - 1);
    }
    window.location.replace(beginningOfURL + '/' + groupName + '/' + projectName);
}
