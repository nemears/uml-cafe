import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import { randomID } from 'uml-client/lib/element';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'
import { UmlWebClient } from 'uml-client';

let projectName = randomID();
let groupName = 'sessions';
let serverAddress = 'ws://localhost:1672';//'wss://uml.cafe/api/';

// this is some logic to determine wether we are accessing an already created project or if we are in a new state.
if (location.pathname != "/") {
    let projectUrl = location.pathname;
    if (projectUrl.charAt(projectUrl.length - 1) === '/') {
        projectUrl = projectUrl.slice(0, projectUrl.length - 1);
    }
    const projectUrlSplit = projectUrl.split('/');
    if (projectUrlSplit.length != 3) {
        // TODO expand to help user with more info
        throw new Error("bad url!");
    }
    groupName = projectUrlSplit[1];
    projectName = projectUrlSplit[2];

    // check for stashed user and passwordHash
    let user = sessionStorage.getItem('user');
    let passwordHash = sessionStorage.getItem('passwordHash');
    if (user === 'null' || user === 'undefined') {
        user = undefined;
    }
    if (passwordHash === 'null' || user === 'undefined') {
        passwordHash = undefined;
    }

    let umlWebClient = new UmlWebClient({
        address: serverAddress,
        group: groupName,
        project: projectName,
        user: user,
        passwordHash: passwordHash,
        create: groupName !== 'sessions',
    });
    umlWebClient.initialization.catch((err) => {
        if (user) {
            // try without a user
            umlWebClient = new UmlWebClient({
                address: serverAddress,
                group: groupName,
                project: projectName,
            });
            // do it again
            umlWebClient.initialization.catch(err => {
                // TODO throw error screen
                throw Error(err);
            }).then(() => {
                const app = createApp(App);
                app.config.globalProperties.$umlWebClient = umlWebClient;
                app.config.unwrapInjectedRef = true;
                app.mount('#app');
                app.use(ContextMenu); 
            });
        }
        console.error(err);
        try {
            const errObj = JSON.parse(err);
            if (errObj.error.code && errObj.error.code == 1) {
                // prompt login
                console.log("todo prompt login based off of code")
            }
        } catch (parseErr) {
            
        }
    }).then(() => {
        sessionStorage.setItem('user', user);
        sessionStorage.setItem('passwordHash', passwordHash);
        const app = createApp(App);
        app.config.globalProperties.$umlWebClient = umlWebClient;
        app.config.unwrapInjectedRef = true;
        app.mount('#app');
        app.use(ContextMenu);
    });
} else {
    let beginningOfURL = document.URL;
    if (beginningOfURL.slice(-1) === '/') {
        beginningOfURL = beginningOfURL.slice(0, beginningOfURL.length - 1);
    }
    window.location.replace(beginningOfURL + '/' + groupName + '/' + projectName);
}
