import { createApp } from 'vue'
import App from './App.vue'
import './assets/style.css'

let Homey: any = null

const app = createApp(App)

// Make Homey available globally
app.config.globalProperties.$homey = null
app.config.globalProperties.t = (key: string): string => {
    return Homey ? Homey.__(key) : key
}

// Wait for Homey to be ready
window.onHomeyReady = function (homeyInstance: any) {
    Homey = homeyInstance
    app.config.globalProperties.$homey = Homey
    app.mount('#app')
    Homey.ready()
}

// For compatibility with Homey callback
window.onHomeyReady = window.onHomeyReady.bind(window)

declare global {
    interface Window {
        onHomeyReady: (homey: any) => void
    }
}
