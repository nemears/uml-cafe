import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import { randomID } from 'uml-js/lib/element';

const sessionName = 'session-' + randomID();
const app = createApp(App);
app.config.globalProperties.$sessionName = sessionName;
app.mount('#app');
