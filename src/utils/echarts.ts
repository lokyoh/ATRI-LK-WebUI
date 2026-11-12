/**
 * ECharts 按需注册。
 *
 * 图表只在仪表盘用，所以注册逻辑放在这里、由 dashboard 组件 import，
 * 而不是 main.ts —— 否则 echarts 会被打进首屏入口 chunk，登录页也要为它买单。
 * 新增图表类型时只改这一个文件。
 */
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
} from 'echarts/components'

echarts.use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
])

// 转出 echarts/core 的全部导出（含 ECharts / EChartsOption 等类型），
// 这样使用方 `import * as echarts from '@/utils/echarts'` 与原来写法完全一致。
export * from 'echarts/core'
export default echarts
