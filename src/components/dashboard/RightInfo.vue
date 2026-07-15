<template>
  <div class="right-info p-4 md:p-4 h-full" ref="rightInfo" :style="{ backgroundColor: 'var(--el-fill-color-light)' }">
    <!-- NoneBot配置卡片 - 更紧凑的版本 -->
    <div class="base-border rounded-lg p-4 shadow-sm mb-2 h-auto min-h-30" ref="baseBorder"
      :style="{ backgroundColor: 'var(--el-bg-color)' }">
      <p class="base-title mb-1 flex items-center" :style="{ color: 'var(--el-color-primary)' }">
        <i class="fas fa-cog mr-1 text-xs"></i> NoneBot配置
      </p>
      <div class="nb-config grid grid-cols-2 gap-1 px-0.5">
        <div v-for="(item, key) in configItems" :key="key" class="rounded-sm p-1" :style="{
          background: 'var(--el-fill-color-lighter)',
          border: '1px solid var(--el-border-color-light)',
        }">
          <el-tooltip effect="light" :content="String(item.value)" placement="top" popper-class="max-w-xs break-words">
            <p class="config-info-item-text truncate leading-tight cursor-default"
              :style="{ color: 'var(--el-text-color-regular)' }">
              {{ item.value }}
            </p>
          </el-tooltip>
          <p class="config-small-title font-bold uppercase tracking-tighter mt-0"
            :style="{ color: 'var(--el-color-primary)' }">
            {{ item.label }}
          </p>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="space-y-4 min-h-75">
      <!-- 活跃群聊图表 -->
      <div class="active-group base-border rounded-xl p-4 shadow-lg h-full min-h-75" :style="{
        height: computedChartDivHeight + 'px',
        backgroundColor: 'var(--el-bg-color)',
      }">
        <div ref="activeGroupBorder" class="flex justify-between items-center mb-2">
          <p class="mb-1 md:mb-0 flex items-center" :style="{ color: 'var(--el-color-primary)' }">
            <i class="fas fa-users mr-1 animate-bounce" :style="{ color: 'var(--el-color-primary)' }"></i>
            活跃群组
          </p>
          <div class="flex flex-wrap gap-1">
            <button v-for="type in timeTypes" :key="'group' + type.value" @click="clickGroupType(type.value)"
              class="px-2 py-0.5 rounded-full transition-all duration-200" :class="{
                'text-white shadow-sm': selectGroupType === type.value,
                'hover:bg-opacity-80': selectGroupType !== type.value,
              }" :style="{
                backgroundColor:
                  selectGroupType === type.value
                    ? 'var(--el-color-primary)'
                    : 'var(--el-fill-color-light)',
                color:
                  selectGroupType === type.value
                    ? 'var(--el-color-white)'
                    : 'var(--el-color-primary)',
              }">
              {{ type.label }}
            </button>
          </div>
        </div>
        <div ref="groupChart" class="w-full" :style="{ height: computedChartHeight + 'px' }"></div>
      </div>

      <!-- 热门插件图表 -->
      <div class="hot-plugin base-border rounded-xl p-4 shadow-lg h-full min-h-75" :style="{
        height: computedChartDivHeight + 'px',
        backgroundColor: 'var(--el-bg-color)',
      }">
        <div ref="hotPluginBorder" class="flex justify-between items-center mb-2">
          <p class="mb-1 md:mb-0 flex items-center" :style="{ color: 'var(--el-color-primary)' }">
            <i class="fas fa-users mr-1 animate-bounce" :style="{ color: 'var(--el-color-primary)' }"></i>
            热门插件
          </p>
          <div class="flex flex-wrap gap-1">
            <button v-for="type in timeTypes" :key="'plugin' + type.value" @click="clickHotPluginType(type.value)"
              class="px-2 py-0.5 rounded-full transition-all duration-200" :class="{
                'text-white shadow-sm': selectGroupType === type.value,
                'hover:bg-opacity-80': selectGroupType !== type.value,
              }" :style="{
                backgroundColor:
                  selectGroupType === type.value
                    ? 'var(--el-color-primary)'
                    : 'var(--el-fill-color-light)',
                color:
                  selectGroupType === type.value
                    ? 'var(--el-color-white)'
                    : 'var(--el-color-primary)',
              }">
              {{ type.label }}
            </button>
          </div>
        </div>
        <div ref="hotPluginChart" class="w-full" :style="{ height: computedChartHeight + 'px' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, inject } from "vue"
import EventBus from "@/utils/event-bus"
import { debounce } from "lodash"
import { getChartOption } from "@/utils/template"
import { useMainStore } from "@/stores/main"
import * as echarts from "echarts"
import { isMobile } from "@/utils/validate"
import { getLoading } from "@/utils/loading"
import { getRequest } from "@/utils/api"
import { message } from "@/utils/message"

const store = useMainStore()
const prefix = inject<string>('prefix')

interface config {
  driver: String
  host: string
  port: string
  log_level: string
  api_timeout: string
  nickname: string[]
  session_expire_timeout: string;
  nicknames?: string;
}
interface getNonebotConfigResponse {
  suc: boolean;
  code: number;
  info: string;
  warning?: string;
  data: config;
}
interface activeGroup {
  group_id: string;
  name: string;
  chat_num: number;
  ava_img: string;
}
interface getActiveGroupResponse {
  suc: boolean;
  code: number;
  info: string;
  warning?: string;
  data: activeGroup[];
}
interface hotPlugin {
  name: string;
  count: number;
}
interface getHotPluginResponse {
  suc: boolean;
  code: number;
  info: string;
  warning?: string;
  data: hotPlugin[];
}

const timeTypes = ref([
  { label: "全部", value: "all" },
  { label: "日", value: "day" },
  { label: "周", value: "week" },
  { label: "月", value: "month" },
  { label: "年", value: "year" },
])

const chartHeight = ref(0)
const chartDivHeight = ref(0)
const botInfo = ref<typeof store.botInfo>(null)
const botConfig = ref<config>({
  host: "127.0.0.1",
  port: "20000",
  driver: "~fastapi+~httpx+~websockets",
  log_level: "INFO",
  api_timeout: "30.0",
  session_expire_timeout: "30",
  nickname: [],
})
const activeGroupData = ref<{ name: string, value: number }[]>([])
const hotPluginData = ref<{ name: string; value: number }[]>([])
const selectGroupType = ref("all")
const selectHotPluginType = ref("all")
const groupCntInterval = ref<number | null>(null)
const groupChart = ref<HTMLElement | null>(null)
const hotPluginChart = ref<HTMLElement | null>(null)
const rightInfo = ref<HTMLElement | null>(null)
const baseBorder = ref<HTMLElement | null>(null)
const activeGroupBorder = ref<HTMLElement | null>(null)
let groupChartInstance: echarts.ECharts | null = null
let hotPluginChartInstance: echarts.ECharts | null = null

const configItems = computed(() => {
  return [
    { label: "Host", value: botConfig.value.host },
    { label: "Port", value: botConfig.value.port },
    { label: "Driver", value: botConfig.value.driver },
    { label: "Log Level", value: botConfig.value.log_level },
    { label: "API Timeout", value: botConfig.value.api_timeout },
    {
      label: "Session Timeout",
      value: botConfig.value.session_expire_timeout,
    },
    {
      label: "Nicknames",
      value: botConfig.value.nickname?.join(", ") || "无",
    },
  ]
})
const computedChartHeight = computed(() => {
  return chartHeight.value
})
const computedChartDivHeight = computed(() => {
  return chartDivHeight.value
})

if (store.botInfo) {
  botInfo.value = store.botInfo
}

onMounted(() => {
  window.addEventListener("resize", handleResize)
  getNonebotConfig()
  getActiveGroupData()
  getHotPlugin()
  groupCntInterval.value = setInterval(() => {
    getActiveGroupData(selectGroupType.value, true)
  }, 25000)

  // 等待 DOM 完全渲染后再初始化图表
  nextTick(() => {
    setTimeout(() => {
      groupChartInstance = echarts.init(groupChart.value)
      hotPluginChartInstance = echarts.init(hotPluginChart.value)
      handleResize()
    }, 100)
  })

  EventBus.on("sidebar-aside", debounce(handleResize, 200))
  EventBus.on("change-theme", debounce(updateChartTheme, 200))
})

onUnmounted(() => {
  window.removeEventListener("resize", handleResize)
  EventBus.off("sidebar-aside", handleResize)
  EventBus.off("change-theme", updateChartTheme)
  if (groupCntInterval.value) {
    clearInterval(groupCntInterval.value)
  }
})

function updateChartTheme() {
  const groupOption = getChartOption()
  const pluginOption = getChartOption()

  const groupSeries = groupOption.series as echarts.EChartsOption['series']
  const pluginSeries = pluginOption.series as echarts.EChartsOption['series']

  if (Array.isArray(groupSeries) && groupSeries[0]) {
    const series0 = groupSeries[0] as any
    series0.data = activeGroupData.value
  }
  if (Array.isArray(pluginSeries) && pluginSeries[0]) {
    const series0 = pluginSeries[0] as any
    series0.data = hotPluginData.value
  }

  groupChartInstance?.setOption(groupOption as echarts.EChartsOption, true)
  hotPluginChartInstance?.setOption(pluginOption as echarts.EChartsOption, true)
  groupChartInstance?.resize()
  hotPluginChartInstance?.resize()
}

function handleResize() {
  nextTick(() => {
    setTimeout(() => {
      // 移动端适配
      if (isMobile()) {
        chartHeight.value = window.innerHeight * 0.3
        chartDivHeight.value = chartHeight.value + 80
      } else {
        if (rightInfo.value && baseBorder.value && activeGroupBorder.value) {
          const containerHeight = rightInfo.value.offsetHeight
          chartDivHeight.value = (containerHeight - baseBorder.value.offsetHeight - 54) / 2
          chartHeight.value = chartDivHeight.value - activeGroupBorder.value.offsetHeight - 30
        }
      }
      nextTick(() => {
        groupChartInstance?.resize()
        hotPluginChartInstance?.resize()
      })
    }, 100)
  })
}

function getNonebotConfig() {
  const loading = getLoading(".base-border")
  getRequest(`${prefix}/dashboard/get_nonebot_config`).then(
    (resp: { data: getNonebotConfigResponse }) => {
      if (resp.data.suc) {
        if (resp.data.warning) {
          message.warning(resp.data.info)
        } else {
          message.success(resp.data.info)
          botConfig.value = resp.data.data
          botConfig.value.nicknames = ""
          if (botConfig.value.nickname) {
            botConfig.value.nicknames = botConfig.value.nickname.join(",")
          }
        }
      } else {
        message.error(resp.data.info)
      }
      loading.close()
    }
  )
}

function clickGroupType(type: string) {
  selectGroupType.value = type
  getActiveGroupData(type)

  // 添加点击动画效果
  const buttons = document.querySelectorAll(".btn-group button")
  buttons.forEach((btn) => {
    const text = btn.textContent || ""
    if (text.toLowerCase() === type) {
      btn.classList.add("animate-pulse")
      setTimeout(() => btn.classList.remove("animate-pulse"), 500)
    }
  })
}

function getActiveGroupData(date_type: string | null = null, no_loading = false) {
  if (date_type == "all") {
    date_type = null
  }
  let loading = null
  if (!no_loading) {
    loading = getLoading(".active-group")
  }
  getRequest(`${prefix}/main/get_active_group`, {
    date_type,
  }).then((resp: { data: getActiveGroupResponse }) => {
    if (resp.data.suc) {
      if (resp.data.warning) {
        if (loading) {
          message.warning(resp.data.info)
        }
      } else {
        if (loading) {
          message.success(resp.data.info)
        }

        const tmpOpt = getChartOption()
        const group_list: string[] = []
        const data = resp.data.data.map((e) => {
          group_list.push(e.name)
          return {
            name: e.group_id,
            value: e.chat_num,
          }
        })

        // --- 主题化修改 Start ---
        try {
          const opt = tmpOpt as echarts.EChartsOption
          opt.backgroundColor = "transparent" // 设置背景透明

          // X 轴
          if (opt.xAxis && Array.isArray(opt.xAxis) && opt.xAxis[0]) {
            opt.xAxis[0].axisLabel = opt.xAxis[0].axisLabel || {}
            opt.xAxis[0].axisLabel.rotate = 45 // 旋转标签避免重叠
            opt.xAxis[0].axisLabel.interval = 0 // 显示所有标签
          } else if (opt.xAxis && !Array.isArray(opt.xAxis)) {
            const xAxisObj = opt.xAxis
            xAxisObj.axisLabel = xAxisObj.axisLabel || {}
            xAxisObj.axisLabel.rotate = 45
            xAxisObj.axisLabel.interval = 0
          }
          // Y 轴
          if (opt.yAxis && Array.isArray(opt.yAxis) && opt.yAxis[0]) {
            opt.yAxis[0].axisLabel = opt.yAxis[0].axisLabel || {}
          } else if (opt.yAxis && !Array.isArray(opt.yAxis)) {
            const yAxisObj = opt.yAxis
            yAxisObj.axisLabel = yAxisObj.axisLabel || {}
          }
          // 提示框
          if (opt.tooltip && typeof opt.tooltip === 'object') {
            const tooltip = opt.tooltip as any
            tooltip.formatter = function (params: {
              name: string
              value: number
            }) {
              return params.name + '<br/>' + params.value + ' 次聊天'
            }
          }
        } catch (e) {
          console.error("Failed to apply theme to group chart:", e)
        }
        // --- 主题化修改 End ---

        const optData = tmpOpt as any
        if (optData.xAxis) {
          if (Array.isArray(optData.xAxis)) {
            optData.xAxis[0].data = group_list
          } else {
            optData.xAxis.data = group_list
          }
        }
        if (optData.series && Array.isArray(optData.series) && optData.series[0]) {
          const series0 = optData.series[0] as any
          series0.data = data
        }
        activeGroupData.value = data
        groupChartInstance?.setOption(tmpOpt as echarts.EChartsOption, true)
      }
    } else {
      if (loading) {
        message.error(resp.data.info)
      }
    }
    if (loading) {
      loading.close()
    }
  })
}

function clickHotPluginType(type: string) {
  selectHotPluginType.value = type
  getHotPlugin(type)

  // 添加点击动画效果
  const buttons = document.querySelectorAll(".hot-plugin .btn-group button")
  buttons.forEach((btn) => {
    const text = btn.textContent || ""
    if (text.toLowerCase() === type) {
      btn.classList.add("animate-pulse")
      setTimeout(() => btn.classList.remove("animate-pulse"), 500)
    }
  })
}

function getHotPlugin(date_type: string | null = null) {
  const loading = getLoading(".hot-plugin")
  getRequest(`${prefix}/main/get_hot_plugin`, {
    date_type,
  }).then((resp: { data: getHotPluginResponse }) => {
    if (resp.data.suc) {
      if (resp.data.warning) {
        message.warning(resp.data.info)
      } else {
        message.success(resp.data.info)
        const tmpOpt = getChartOption()
        const hotPluginList: string[] = []
        const data = resp.data.data.map((e) => {
          hotPluginList.push(e.name)
          return {
            name: e.name,
            value: e.count,
          }
        })

        // --- 主题化修改 Start ---
        try {
          const opt = tmpOpt as echarts.EChartsOption
          // X 轴
          if (opt.xAxis && Array.isArray(opt.xAxis) && opt.xAxis[0]) {
            opt.xAxis[0].axisLabel = opt.xAxis[0].axisLabel || {}
            opt.xAxis[0].axisLabel.rotate = 45 // 旋转标签避免重叠
            opt.xAxis[0].axisLabel.interval = 0 // 显示所有标签
          } else if (opt.xAxis && !Array.isArray(opt.xAxis)) {
            const xAxisObj = opt.xAxis
            xAxisObj.axisLabel = xAxisObj.axisLabel || {}
            xAxisObj.axisLabel.rotate = 45
            xAxisObj.axisLabel.interval = 0
          }
          // Y 轴
          if (opt.yAxis && Array.isArray(opt.yAxis) && opt.yAxis[0]) {
            opt.yAxis[0].axisLabel = opt.yAxis[0].axisLabel || {}
          } else if (opt.yAxis && !Array.isArray(opt.yAxis)) {
            const yAxisObj = opt.yAxis
            yAxisObj.axisLabel = yAxisObj.axisLabel || {}
          }
          // 提示框
          if (opt.tooltip && typeof opt.tooltip === 'object') {
            const tooltip = opt.tooltip as any
            tooltip.formatter = function (params: {
              name: string
              value: number
            }) {
              return params.name + '<br/>' + params.value + ' 次使用'
            }
          }
        } catch (e) {
          console.error("Failed to apply theme to plugin chart:", e)
        }
        // --- 主题化修改 End ---

        const optData = tmpOpt as any
        if (optData.xAxis) {
          if (Array.isArray(optData.xAxis)) {
            optData.xAxis[0].data = hotPluginList
          } else {
            optData.xAxis.data = hotPluginList
          }
        }
        if (optData.series && Array.isArray(optData.series) && optData.series[0]) {
          const series0 = optData.series[0] as any
          series0.data = data
        }
        hotPluginData.value = data
        hotPluginChartInstance?.setOption(tmpOpt as echarts.EChartsOption, true)
      }
    } else {
      message.error(resp.data.info)
    }
    loading.close()
  })
}
</script>

<style scoped>
/* 使用CSS变量优化字体大小 */
.base-title {
  font-size: var(--font-size-lg);
  font-weight: bold;
}

.config-info-item-text {
  font-size: var(--font-size-xs);
  font-family: monospace;
  margin-bottom: 0;
  line-height: var(--line-height-dense);
}

.config-small-title {
  font-size: var(--font-size-micro);
  line-height: var(--line-height-dense);
}

/* 图表标题样式 */
.base-border>div>p {
  font-size: var(--font-size-lg);
  font-weight: bold;
}

/* 按钮字体大小 */
.base-border button {
  font-size: var(--font-size-xxs);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .base-title {
    font-size: var(--font-size-md);
  }

  .config-info-item-text {
    font-size: var(--font-size-xxs);
  }

  .config-small-title {
    font-size: var(--font-size-micro);
  }

  .base-border>div>p {
    font-size: var(--font-size-md);
  }

  .base-border button {
    font-size: var(--font-size-micro);
  }
}

/* 其他样式保持不变 */
.right-info {
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color) var(--el-fill-color-lighter);
}

.right-info::-webkit-scrollbar {
  width: 6px;
}

.right-info::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
}

.right-info::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 10px;
}

.base-border {
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-light);
}

.base-border:hover {
  box-shadow: var(--el-box-shadow-light);
}

.nb-config {
  padding: 0;
}

.base-title {
  text-shadow: 1px 1px 2px var(--el-color-primary-light-8);
}

.base-border::before {
  content: "";
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  z-index: -1;
  background: linear-gradient(45deg,
      var(--el-color-primary),
      var(--el-color-primary-light-3),
      var(--el-color-primary-light-5));
  background-size: 300% 300%;
  border-radius: 12px;
  opacity: 0.1;
  animation: gradientBG 8s ease infinite;
}

@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

/* 工具提示样式 */
:deep(.el-tooltip__popper) {
  max-width: 80vw;
  border: 1px solid var(--el-color-primary) !important;
  background-color: var(--el-bg-color-overlay) !important;
  color: var(--el-text-color-primary) !important;
  font-size: var(--font-size-xs);
  border-radius: 12px !important;
  box-shadow: var(--el-box-shadow-light) !important;
}

:deep(.el-tooltip__popper[x-placement^="top"] .popper__arrow) {
  border-top-color: var(--el-color-primary) !important;
}

:deep(.el-tooltip__popper[x-placement^="bottom"] .popper__arrow) {
  border-bottom-color: var(--el-color-primary) !important;
}
</style>
