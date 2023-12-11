import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import { randomID } from 'uml-client/lib/element';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'
import { UmlWebClient } from 'uml-client';

let sessionName = '/sessions/' + randomID();
let serverAddress = 'wss://uml.cafe/api/';

// this is some logic to determine wether we are accessing an already created project or if we are in a new state.
if (location.pathname != "/") {
    sessionName = location.pathname;
    
    if (sessionName.charAt(sessionName.length - 1) === '/') {
        sessionName = sessionName.slice(0, sessionName.length - 1);
    }

    // check for stashed user and passwordHash
    const user = sessionStorage.getItem('user');
    sessionStorage.removeItem('user');
    const passwordHash = sessionStorage.getItem('passwordHash');
    sessionStorage.removeItem('passwordHash');

    const umlWebClient = new UmlWebClient({
        address: serverAddress,
        server: sessionName,
        user: user,
        passwordHash: passwordHash,
    })
    umlWebClient.initializationPromise.catch((err) => {
        try {
            const errObj = JSON.parse(err);
            if (errObj.error.code && errObj.error.code == 1) {
                // prompt login
                console.log("todo prompt login based off of code")
            }
        } catch (parseErr) {
            
        }
    }).then(() => {
        const app = createApp(App);
        app.config.globalProperties.$sessionName = sessionName;
        app.config.globalProperties.$umlWebClient = umlWebClient;
        app.config.unwrapInjectedRef = true;
        app.mount('#app');
        app.use(ContextMenu);
    });
} else {
    // todo create new session
    const umlWebClient = new UmlWebClient({
        address: serverAddress,
        server: sessionName
    });
    const waitForServerAndForwardUrl = async () => {
        await umlWebClient.reserve();
        let beginningOfURL = document.URL;
        if (beginningOfURL.slice(-1) === '/') {
            beginningOfURL = beginningOfURL.slice(0, beginningOfURL.length -1);
        }
        window.location.replace(beginningOfURL + sessionName);
    }
    waitForServerAndForwardUrl();
}
