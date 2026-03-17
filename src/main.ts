import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "default-passive-events";
import "@/assets/css/global.css";
import "@/styles/theme.scss";
import "@/assets/tailwind.css";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers"; // 导入 Canvas 渲染器
import { LineChart, BarChart } from "echarts/charts"; // 导入需要的图表
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from "echarts/components"; // 导入需要的组件

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

use([
  CanvasRenderer, // 必须注册渲染器
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
]);

const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.provide("prefix", "/atri/api");

app.mount("#app");
