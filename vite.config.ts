import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    // 模板里的 <el-*> 按需引入，不再 app.use(ElementPlus) 全量注册。
    // importStyle: false 是刻意的：让样式仍由 main.ts 里单独引入的 index.css 统一提供，
    // 保证「Element 基础样式 → global.css 覆盖 → theme.scss 变量」的固定层叠顺序。
    // 若改成按组件注入 CSS，动态 chunk 的样式会晚于 global.css 进入 head，
    // 那些没用 !important 的覆盖规则（el-collapse-item 等）就会被 Element 反盖。
    Components({
      dts: false,
      resolvers: [ElementPlusResolver({ importStyle: false })],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    // 按需引入后各路由块应远小于 600kB，超限就说明又退化成全量了
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // 按实际引入的模块分块：对象写法会把整个包作为入口拉进来，
        // 函数写法只命中真正被 import 到的模块，不会意外带上未用代码。
        // element-plus 不在这里强制合并：组件按需引入后由 rollup 自行拆成
        // 路由级共享块，登录页无需为 el-table 买单。
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/echarts/") || id.includes("/zrender/")) return "echarts";
          if (
            id.includes("/vue/") ||
            id.includes("/vue-router/") ||
            id.includes("/pinia/") ||
            id.includes("/@vue/")
          ) {
            return "vue-vendor";
          }
        },
        // 入口文件命名模式
        entryFileNames: "assets/[name]-[hash].js",
        // chunk 文件命名模式
        chunkFileNames: "assets/[name]-[hash].js",
        // 资源文件命名模式
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
