import { ElLoading } from 'element-plus'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'

// 懒加载路由的 chunk 在慢网络下要等一会儿，没有反馈会让人以为没点上。
// 留一个最短可见时间，避免秒开时闪一下。
const MIN_VISIBLE = 320

let instance: LoadingInstance | null = null
let startedAt = 0
let hideTimer: ReturnType<typeof setTimeout> | undefined

function close() {
  instance?.close()
  instance = null
}

export function startRouteLoading() {
  if (instance) return
  instance = ElLoading.service({
    lock: true,
    fullscreen: true,
    text: '正在加载页面喵~',
    spinner: 'el-icon-star-on',
    background: 'var(--el-bg-color-overlay)',
    customClass: 'route-loading',
  })
  startedAt = Date.now()
}

export function stopRouteLoading() {
  if (!instance) return
  const remain = MIN_VISIBLE - (Date.now() - startedAt)
  clearTimeout(hideTimer)
  if (remain > 0) hideTimer = setTimeout(close, remain)
  else close()
}

// 全屏遮罩上的文字必须看得清：utils/loading.ts 那套是给局部遮罩用的浅色。
const style = document.createElement('style')
style.textContent = `
  .route-loading .el-loading-spinner .el-loading-text,
  .route-loading .el-loading-spinner .circular {
    color: var(--el-color-primary) !important;
  }
  .route-loading .el-loading-spinner .el-loading-text {
    font-size: 14px;
      letter-spacing: 0.02em;
  }
`
document.head.appendChild(style)
