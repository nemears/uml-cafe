import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import { randomID } from 'uml-client/lib/element';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'
import { UmlWebClient } from 'uml-client';
import { getProjectLoginObject } from './umlUtil';

let projectName = randomID();
let groupName = 'sessions';
let serverAddress = 'ws://localhost:1672';//'wss://uml.cafe/api/';

// this is some logic to determine wether we are accessing an already created project or if we are in a new state.
if (location.pathname != "/") {
    let projectUrl = location.pathname;
    if (projectUrl.charAt(projectUrl.length - 1) === '/') {
        projectUrl = projectUrl.slice(0, projectUrl.length - 1);
    }

    let loginObject = getProjectLoginObject(projectUrl, serverAddress); 
    let umlWebClient = new UmlWebClient(loginObject);

    const mountApp = () => {
        const app = createApp(App);
        app.config.globalProperties.$umlWebClient = umlWebClient;
        app.config.unwrapInjectedRef = true;
        app.mount('#app');
        app.use(ContextMenu);
    }

    umlWebClient.initialization.then(() => {
        sessionStorage.setItem('user', loginObject.user);
        sessionStorage.setItem('passwordHash', loginObject.passwordHash);
        mountApp();
    }).catch((err) => {
        console.error(err);
        const errObj = JSON.parse(err);
        if (errObj.error.code && errObj.error.code == 1) {
            if (loginObject.user) {
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
            }
        }
    });
} else {
    let beginningOfURL = document.URL;
    if (beginningOfURL.slice(-1) === '/') {
        beginningOfURL = beginningOfURL.slice(0, beginningOfURL.length - 1);
    }
    window.location.replace(beginningOfURL + '/' + groupName + '/' + projectName);
}
