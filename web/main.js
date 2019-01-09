import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'
import VueAxios from 'vue-axios'
import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';
import VueAnalytics from 'vue-analytics'
import Markdown from './Markdown'
import config from './config'

Vue.use(VueAnalytics, {
    id: config.ua
})

Raven
    .config(config.dsn, {
        ignoreErrors: ["*timeout*", "Request failed", "Network Error"],
    })
    .addPlugin(RavenVue, Vue)
    .install();

Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(VueAxios, axios)
Vue.component("markdown", Markdown)

new Vue({
    render: h => h(App)
}).$mount('#app')
