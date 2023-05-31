import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import { randomID } from 'uml-js/lib/element';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'
import { UmlWebClient } from 'uml-js';

let sessionName = 'session-' + randomID();

// this is some logic to determine wether we are accessing an already created project or if we are in a new state.
if (document.URL.match('.\/projects\/.')) {
    sessionName = document.URL.match('(?<=\/projects\/).*')[0];
    sessionName = sessionName.slice(0, sessionName.length - 1);
    const umlWebClient = new UmlWebClient({server: sessionName});
    const app = createApp(App);
    app.config.globalProperties.$sessionName = sessionName;
    app.config.globalProperties.$umlWebClient = umlWebClient;
    app.config.unwrapInjectedRef = true;
    app.mount('#app');
    app.use(ContextMenu);
} else {
    // todo create new session
    const umlWebClient = new UmlWebClient({server: sessionName});
    const waitForServerAndForwardUrl = async () => {
        await umlWebClient.reserve();
        let beginningOfURL = document.URL;
        if (beginningOfURL.slice(-1) === '/') {
            beginningOfURL = beginningOfURL.slice(0, beginningOfURL.length -1);
        }
        window.location.replace(beginningOfURL + '/projects/' + sessionName);
    }
    waitForServerAndForwardUrl();
}
