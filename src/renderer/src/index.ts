import { mount } from 'svelte'
import App from './App.svelte'
import './index.css'
import '@fortawesome/fontawesome-free/css/all.css'

const app = mount(App, { target: document.getElementById('app')! })

export default app
