import { createApp } from 'vue';
import App from './App.vue';
import './assets/style.css';

let Homey = null;

const app = createApp(App);

// Make Homey available globally
app.config.globalProperties.$homey = null;
app.config.globalProperties.t = (key) => {
  return Homey ? Homey.__(key) : key;
};

// Wait for Homey to be ready
window.onHomeyReady = function(homeyInstance) {
  Homey = homeyInstance;
  app.config.globalProperties.$homey = Homey;
  app.mount('#app');
  Homey.ready();
};

// For compatibility with Homey callback
window.onHomeyReady = window.onHomeyReady.bind(window);
