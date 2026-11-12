/**
 * 顶部导航的固定高度（px）。
 *
 * `HomePage.vue` 的 `.home-header` 是 56px（height 与 min-height 都是 56），
 * 这里必须与样式保持一致；之前写死 85 会让主内容区少算 29px，
 * 页面底部留出一条空白带。
 */
export const HEADER_HEIGHT = 56;

/** App 根容器是 `innerHeight - 1`，留 1px 避免出现整页滚动条。 */
const ROOT_HEIGHT_OFFSET = 1;

export function getHeaderHeight() {
  return HEADER_HEIGHT;
}

/**
 * 主内容区可用高度 = 窗口高 - 根容器偏移 - 顶栏高度。
 * 传参是为了让调用方把自己的响应式 windowHeight 传进来，
 * 否则 computed 里读 window.innerHeight 不会随 resize 重算。
 */
export function getContentViewportHeight(windowHeight = window.innerHeight) {
  return windowHeight - ROOT_HEIGHT_OFFSET - HEADER_HEIGHT;
}
