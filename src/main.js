import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import { randomID } from 'uml-js/lib/element';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'

const sessionName = 'session-' + randomID();
const app = createApp(App);
app.config.globalProperties.$sessionName = sessionName;
app.config.unwrapInjectedRef = true;
app.mount('#app');
app.use(ContextMenu);
