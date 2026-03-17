import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    // 调整块大小警告限制为 1000kB
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 手动分割代码块
        manualChunks: {
          // 将 echarts 单独打包
          'echarts-vendor': ['echarts'],
          // 将 vue 和相关库单独打包
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // 将 element-plus 单独打包
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
        },
        // 入口文件命名模式
        entryFileNames: 'assets/[name]-[hash].js',
        // chunk 文件命名模式
        chunkFileNames: 'assets/[name]-[hash].js',
        // 资源文件命名模式
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
