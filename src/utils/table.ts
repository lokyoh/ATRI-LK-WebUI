/**
 * `el-table` 内置溢出提示（`show-overflow-tooltip`）的默认挂载点修正。
 *
 * Element Plus 默认把提示挂到表格根节点上（`appendTo: tableWrapper`），并且用
 * `position: fixed` 定位。表格根节点在全局样式里有 `overflow: hidden`（为了圆角），
 * 而页面路由容器又有 `backdrop-filter`（模糊背景），两者叠加会让这个浮层的
 * 包含块从视口变成路由容器：坐标整体偏移一个顶栏/侧栏的距离，看起来就是
 * 「提示框飘在别的地方」。
 *
 * 把提示挂到 `body` 后，浮层不再受表格裁剪与祖先包含块影响，坐标重新以视口为基准。
 * 所有使用 `show-overflow-tooltip` 的表格都应该透传这个配置。
 */
export const overflowTooltipOptions = { appendTo: 'body' }
