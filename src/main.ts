import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
// 样式统一整份引入（而不是按组件注入）：按需注入的 CSS 会随路由 chunk 晚于
// global.css 进入 head，把 global.css 里没有 !important 的覆盖规则反盖掉。
// 实测整份 index.css 与按组件注入的总量只差约 24kB，不值得为此改变层叠顺序。
import "element-plus/dist/index.css";
import "default-passive-events";
import "@/assets/css/global.css";
import "@/styles/theme.scss";
import "@/assets/tailwind.css";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.use(router);
// Element Plus 组件由 unplugin-vue-components 按模板按需引入（见 vite.config.ts），
// 这里不再 app.use(ElementPlus) 全量注册；ElMessage/ElMessageBox/ElLoading 等
// 函数式 API 在各自使用处显式 import。
app.provide("prefix", "/atri/api");

app.mount("#app");
