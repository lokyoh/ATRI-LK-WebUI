<template>
  <div class="right-info p-2 md:p-4 h-full" ref="rightInfo" :style="{ backgroundColor: 'var(--bg-color)' }">
    <!-- 机器人信息卡片 - 三行垂直布局 -->
    <div class="base-info rounded-xl p-3 shadow-md mb-4" :style="{
      backgroundColor: 'var(--bg-color-secondary)',
      border: '2px solid var(--border-color-light)',
    }">
      <div class="space-y-2"><!-- 连接时长 -->
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider" :style="{ color: 'var(--primary-color)' }">
            连接时长
          </p>
          <p class="text-base font-bold" :style="{ color: 'var(--primary-color)' }">
            {{ connectTime }}
          </p>
        </div>

        <!-- 连接日期 -->
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider" :style="{ color: 'var(--primary-color)' }">
            连接日期
          </p>
          <p class="text-base font-bold" :style="{ color: 'var(--primary-color)' }">
            {{ botInfo.connect_date }}
          </p>
        </div>
      </div>
    </div>

    <!-- 图表区域 - 自适应高度 -->
    <div class="chart-area" :style="{ height: chartAreaHeight + 'px' }">
      <!-- 活跃群聊图表 -->
      <div class="active-group chart-container rounded-xl p-4 shadow-md" :style="{
        backgroundColor: 'var(--bg-color-secondary)',
        border: '2px solid var(--border-color-light)',
      }">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
          <p class="text-base font-bold mb-1 md:mb-0 flex items-center" :style="{ color: 'var(--primary-color)' }">
            <i class="fas fa-users mr-1 animate-bounce text-sm" :style="{ color: 'var(--primary-color-light)' }"></i>
            活跃群组
          </p>

          <div ref="groupTypeRef" class="flex flex-wrap gap-1">
            <button v-for="type in timeTypes" :key="'group' + type.value" @click="clickGroupType(type.value)"
              class="px-2 py-0.5 text-[10px] rounded-full transition-all duration-200" :style="{
                backgroundColor:
                  selectGroupType === type.value
                    ? 'var(--primary-color)'
                    : 'var(--bg-color-hover)',
                color:
                  selectGroupType === type.value
                    ? 'var(--bg-color)'
                    : 'var(--primary-color)',
              }">
              {{ type.label }}
            </button>
          </div>
        </div>

        <div ref="groupChart" class="w-full" :style="{ height: chartHeight + 'px' }"></div>
      </div>

      <!-- 热门插件图表 -->
      <div class="hot-plugin chart-container rounded-xl p-4 shadow-md" :style="{
        backgroundColor: 'var(--bg-color-secondary)',
        border: '2px solid var(--border-color-light)',
      }">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
          <p class="text-base font-bold mb-1 md:mb-0 flex items-center" :style="{ color: 'var(--primary-color)' }">
            <i class="fas fa-plug mr-1 animate-pulse text-sm" :style="{ color: 'var(--primary-color-light)' }"></i>
            热门插件
          </p>

          <div class="flex flex-wrap gap-1">
            <button v-for="type in timeTypes" :key="'plugin' + type.value" @click="clickHotPluginType(type.value)"
              class="px-2 py-0.5 text-[10px] rounded-full transition-all duration-200" :style="{
                backgroundColor:
                  selectHotPluginType === type.value
                    ? 'var(--primary-color)'
                    : 'var(--bg-color-hover)',
                color:
                  selectHotPluginType === type.value
                    ? 'var(--bg-color)'
                    : 'var(--primary-color)',
              }">
              {{ type.label }}
            </button>
          </div>
        </div>

        <div ref="hotPluginChart" class="w-full h-full min-h-50" :style="{ height: chartHeight + 'px' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, inject } from "vue"
import { debounce } from "lodash"
import { getChartOption } from "@/utils/template"
import EventBus from "@/utils/event-bus"
import { getLoading } from "@/utils/loading"
import { getRequest } from "@/utils/api"
import { message } from "@/utils/message"
import * as echarts from "echarts"
import { useMainStore } from "@/stores/main"

interface ApiResponse<T = unknown> {
  suc: boolean
  warning?: string
  info: string
  data: T
}

interface ActiveGroup {
  group_id: number
  name: string
  chat_num: number
  ava_img: string
}

interface BotInfo {
  connect_count: number
  connect_time: number
  connect_date: string
  self_id: string
  config?: Record<string, unknown>
}

interface TimeType {
  label: string
  value: string
}

interface ChartDataItem {
  name: string
  value: number
}

const store = useMainStore()
const prefix = inject("prefix") as string

// 响应式数据
const chartHeight = ref(100)
const chartAreaHeight = ref(0)
const activeGroupData = ref<ChartDataItem[]>([])
const hotPluginData = ref<ChartDataItem[]>([])
const botInfo = ref<BotInfo>({
  connect_count: 42,
  connect_date: "2023-10-15",
  connect_time: Math.floor(Date.now() / 1000) - 45296,
  self_id: "123456",
})
const selectGroupType = ref("all")
const selectHotPluginType = ref("all")
const groupChart = ref<HTMLElement | null>(null)
const hotPluginChart = ref<HTMLElement | null>(null)
const groupTypeRef = ref<HTMLElement | null>(null)
const rightInfo = ref<HTMLElement | null>(null)

let groupChartInstance: echarts.ECharts | null = null
let hotPluginChartInstance: echarts.ECharts | null = null
let groupCntInterval: number | null = null
let timer: number | null = null
const connectTime = ref("")

const timeTypes: TimeType[] = [
  { label: "全部", value: "all" },
  { label: "日", value: "day" },
  { label: "周", value: "week" },
  { label: "月", value: "month" },
  { label: "年", value: "year" },
]

// 格式化秒数
const formatSeconds = (seconds: number): string => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0")
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0")
  const s = Math.floor(seconds % 60).toString().padStart(2, "0")
  return `${h}:${m}:${s}`
}

// 更新连接时间
const updateConnectTime = () => {
  const now = Math.floor(Date.now() / 1000)
  connectTime.value = formatSeconds(now - botInfo.value.connect_time)
}

// 初始化图表
const initCharts = () => {
  if (groupChart.value) {
    groupChartInstance = echarts.init(groupChart.value)
  }
  if (hotPluginChart.value) {
    hotPluginChartInstance = echarts.init(hotPluginChart.value)
  }

  // 等待一下再加载数据，确保图表完全初始化
  setTimeout(() => {
    getActiveGroupData()
    getHotPlugin()
  }, 100)
}

// 更新图表主题
const updateChartTheme = () => {
  if (!groupChartInstance || !hotPluginChartInstance) {
    console.warn('图表实例未初始化')
    return
  }

  const groupOption = getChartOption()
  const pluginOption = getChartOption()

  // 确保 series 是数组且有元素
  if (Array.isArray(groupOption.series) && groupOption.series[0]) {
    (groupOption.series[0] as echarts.SeriesOption).data = activeGroupData.value
  }
  if (Array.isArray(pluginOption.series) && pluginOption.series[0]) {
    (pluginOption.series[0] as echarts.SeriesOption).data = hotPluginData.value
  }

  groupChartInstance?.setOption(groupOption as echarts.EChartsOption, true)
  hotPluginChartInstance?.setOption(pluginOption as echarts.EChartsOption, true)
  groupChartInstance?.resize()
  hotPluginChartInstance?.resize()
}

// 处理窗口大小变化
const handleResize = debounce(() => {
  if (rightInfo.value) {
    const baseInfoEl = rightInfo.value.querySelector(".base-info") as HTMLElement
    if (baseInfoEl) {
      const infoHeight = baseInfoEl.offsetHeight
      chartAreaHeight.value = rightInfo.value.offsetHeight - infoHeight - 49
      chartAreaHeight.value = Math.max(chartAreaHeight.value, 300)

      if (window.innerWidth <= 640) {
        chartAreaHeight.value = Math.max(chartAreaHeight.value, 400)
      }

      if (groupTypeRef.value) {
        chartHeight.value = chartAreaHeight.value / 2 - groupTypeRef.value.offsetHeight - 20
      }

      // 延迟调整图表大小
      setTimeout(() => {
        groupChartInstance?.resize()
        hotPluginChartInstance?.resize()
      }, 50)
    }
  }
}, 200)

// 设置大小监听器
const setupResizeListener = () => {
  window.addEventListener("resize", handleResize)
}

// 启动定时器
const startTimers = () => {
  // 连接时间计时器
  if (botInfo.value.connect_time) {
    updateConnectTime()
    timer = window.setInterval(updateConnectTime, 1000)
  }

  // 数据刷新定时器
  groupCntInterval = window.setInterval(() => {
    getActiveGroupData(selectGroupType.value, true)
  }, 25000)
}

// 获取活跃群组数据
const getActiveGroupData = (date_type?: string | null, no_loading?: boolean) => {
  if (date_type === "all") {
    date_type = null
  }

  let loading = null
  if (!no_loading) {
    loading = getLoading(".active-group")
  }

  getRequest(`${prefix}/main/get_active_group`, {
    date_type: date_type,
    bot_id: botInfo.value.self_id,
  }).then((resp) => {
    const respData = resp.data as ApiResponse<ActiveGroup[]>
    if (respData.suc) {
      if (respData.warning) {
        if (loading) {
          message.warning(respData.info)
        }
      } else {
        if (loading) {
          message.success(respData.info)
        }
        const tmpOpt = getChartOption()
        const group_list: string[] = []

        // 确保 data 是数组
        const dataArray = Array.isArray(respData.data) ? respData.data : []
        const data = dataArray.map((e: ActiveGroup) => {
          group_list.push(e.name)
          return {
            name: String(e.group_id),
            value: e.chat_num,
          }
        })

        // 配置 X 轴显示名称
        if (tmpOpt.xAxis) {
          const xAxisObj = tmpOpt.xAxis as {
            data?: (string | number)[]
            axisLabel?: {
              rotate?: number
              interval?: number
              formatter?: (value: string) => string
            }
          }
          xAxisObj.data = group_list
          xAxisObj.axisLabel = xAxisObj.axisLabel || {}
          xAxisObj.axisLabel.rotate = 45 // 旋转标签避免重叠
          xAxisObj.axisLabel.interval = 0 // 显示所有标签
          xAxisObj.axisLabel.formatter = (value: string) => {
            return value.length > 10 ? value.substring(0, 10) + '...' : value
          }
        }

        activeGroupData.value = data
        if (tmpOpt.series && Array.isArray(tmpOpt.series) && tmpOpt.series[0]) {
          (tmpOpt.series[0] as echarts.SeriesOption).data = data
        }

        groupChartInstance?.setOption(tmpOpt as echarts.EChartsOption, true)
      }
    } else {
      if (loading) {
        message.error(respData.info)
      }
    }
    if (loading) {
      loading.close()
    }
  })
}

// 获取热门插件
const getHotPlugin = (date_type?: string | null) => {
  const loading = getLoading(".hot-plugin")

  getRequest(`${prefix}/main/get_hot_plugin`, {
    date_type: date_type,
    bot_id: botInfo.value.self_id,
  }).then((resp) => {
    const respData = resp.data as ApiResponse<{ name: string; count: number }[]>
    if (respData.suc) {
      if (respData.warning) {
        message.warning(respData.info)
      } else {
        message.success(respData.info)
        const tmpOpt = getChartOption()
        const hotPluginList: string[] = []

        // 确保 data 是数组
        const dataArray = Array.isArray(respData.data) ? respData.data : []
        const data = dataArray.map((e) => {
          hotPluginList.push(e.name)
          return {
            name: e.name,
            value: e.count,
          }
        })

        // 配置 X 轴显示名称
        if (tmpOpt.xAxis) {
          const xAxisObj = tmpOpt.xAxis as {
            data?: (string | number)[]
            axisLabel?: {
              rotate?: number
              interval?: number
              formatter?: (value: string) => string
            }
          }
          xAxisObj.data = hotPluginList
          xAxisObj.axisLabel = xAxisObj.axisLabel || {}
          xAxisObj.axisLabel.rotate = 45 // 旋转标签避免重叠
          xAxisObj.axisLabel.interval = 0 // 显示所有标签
          xAxisObj.axisLabel.formatter = (value: string) => {
            return value.length > 10 ? value.substring(0, 10) + '...' : value
          }
        }

        hotPluginData.value = data
        if (tmpOpt.series && Array.isArray(tmpOpt.series) && tmpOpt.series[0]) {
          (tmpOpt.series[0] as echarts.SeriesOption).data = data
        }
        hotPluginChartInstance?.setOption(tmpOpt as echarts.EChartsOption, true)
      }
    } else {
      message.error(respData.info)
    }
    loading.close()
  })
}

// 点击群组类型
const clickGroupType = (type: string) => {
  selectGroupType.value = type
  getActiveGroupData(type)
}

// 点击热门插件类型
const clickHotPluginType = (type: string) => {
  selectHotPluginType.value = type
  getHotPlugin(type === "all" ? null : type)
}

onMounted(() => {
  // 从 store 获取 botInfo
  const storeBotInfo = store.botInfo
  if (storeBotInfo) {
    botInfo.value = {
      ...botInfo.value,
      ...storeBotInfo,
      connect_time: storeBotInfo.connect_time || botInfo.value.connect_time,
    }
  }

  setupResizeListener()
  startTimers()
  handleResize()

  // 初始化图表
  initCharts()

  EventBus.on("sidebar-aside", handleResize)
  EventBus.on("change-theme", debounce(updateChartTheme, 200))
})

onUnmounted(() => {
  if (groupCntInterval) {
    clearInterval(groupCntInterval)
  }
  if (timer) {
    clearInterval(timer)
  }
  window.removeEventListener("resize", handleResize)
  EventBus.off("sidebar-aside", handleResize)
  EventBus.off("change-theme", updateChartTheme)
  groupChartInstance?.dispose()
  hotPluginChartInstance?.dispose()
})

// 监听 botInfo 变化
watch(() => store.botInfo, (newVal) => {
  if (newVal) {
    botInfo.value = {
      ...botInfo.value,
      ...newVal,
    }
  }
}, { immediate: true })
</script>

<style scoped>
.right-info {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb-color) var(--bg-color);
}

.right-info::-webkit-scrollbar {
  width: 6px;
}

.right-info::-webkit-scrollbar-track {
  background: var(--bg-color);
  border-radius: 10px;
}

.right-info::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb-color);
  border-radius: 10px;
}

.chart-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-container {
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.base-info {
  transition: all 0.3s ease;
}

.base-info div:not(:last-child) {
  border-bottom: 1px dashed var(--border-color-light);
  padding-bottom: 8px;
}

.base-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--primary-shadow);
}

button {
  transition: all 0.2s ease;
}

button:hover {
  transform: scale(1.05);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .right-info {
    padding: 0.75rem;
  }

  .base-info {
    padding: 0.75rem;
  }

  .chart-container {
    padding: 0.75rem;
  }
}
</style>
