import { createApp } from 'vue';
import App from './App.vue';

// @ts-ignore
window.onHomeyReady = function (): void {
    createApp(App)
        .mount('#app');
};
