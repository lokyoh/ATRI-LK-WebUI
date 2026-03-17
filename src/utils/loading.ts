import { ElLoading } from "element-plus";
import type { LoadingInstance } from "element-plus/es/components/loading/src/loading";

export const getLoading = (target: unknown): LoadingInstance => {
  const loading = ElLoading.service({
    target: target as string | HTMLElement,
    lock: true,
    text: "(>ω<) 正在努力加载中喵~",
    spinner: "el-icon-star-on",
    background: "var(--el-bg-color-overlay)",
    customClass: "kawaii-loading",
  });

  setTimeout(() => {
    loading.close();
  }, 5000);

  return loading;
};

// 添加自定义样式
const style = document.createElement("style");
style.textContent = `
  .kawaii-loading {
    .el-loading-spinner {
      .el-loading-text {
        color: var(--el-color-primary-light-3) !important;
      }
      .circular {
        color: var(--el-color-primary-light-3) !important;
      }
    }
  }
`;
document.head.appendChild(style);
