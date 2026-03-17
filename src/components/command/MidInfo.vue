<template>
  <div ref="midInfo" class="mid-info text-gray-800 p-4 flex flex-col h-full">
    <!-- 消息接收区域 -->
    <div class="message-area rounded-xl shadow-md p-4 mb-4" :style="{
      height: areaHeight + 'px',
      backgroundColor: 'var(--bg-color-secondary)',
      border: '1px solid var(--border-color-light)',
    }">
      <div class="title-box flex items-center mb-3">
        <p class="text-md font-bold flex items-center" :style="{ color: 'var(--primary-color)' }">
          <span class="mr-2">(◕‿◕✿)</span>消息接收
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-3" :style="{ height: areaHeight - 80 + 'px' }">
        <div v-for="(item, key) in progressItems.chat" :key="key" class="flex flex-col p-1 justify-center">
          <div class="progress-container flex-col w-full flex justify-center items-center">
            <div class="progress-container w-full flex justify-center items-center">
              <el-progress type="circle" :percentage="getPercentageChat(key)" :width="progressWidth"
                :stroke-width="strokeWidth" :color="item.color" :format="() => String(chCnt[key as keyof typeof chCnt])"
                :style="{
                  '--progress-font-size': fontSize + 'px',
                  'max-width': '100%',
                }" />
            </div>
            <p class="text-sm font-medium mt-2 text-center truncate w-full"
              :style="{ color: 'var(--text-color-secondary)' }">
              {{ item.label }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能调用区域 -->
    <div class="function-area rounded-xl shadow-md p-4 mb-4" :style="{
      height: areaHeight + 'px',
      backgroundColor: 'var(--bg-color-secondary)',
      border: '1px solid var(--border-color-light)',
    }">
      <div class="title-box flex items-center mb-3">
        <p class="text-md font-bold flex items-center" :style="{ color: 'var(--primary-color)' }">
          <span class="mr-2">(ﾉ◕ヮ◕) ﾉ*:･ﾟ✧</span>功能调用
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-3" :style="{ height: areaHeight - 80 + 'px' }">
        <div v-for="(item, key) in progressItems.chat" :key="key" class="flex flex-col p-1 justify-center">
          <div class="progress-container flex-col w-full flex justify-center items-center">
            <div class="progress-container w-full flex justify-center items-center">
              <el-progress type="circle" :percentage="getPercentageCall(key)" :width="progressWidth"
                :stroke-width="strokeWidth" :color="item.color"
                :format="() => String(callCnt[key as keyof typeof callCnt])" :style="{
                  '--progress-font-size': fontSize + 'px',
                  'max-width': '100%',
                }" />
            </div>
            <p class="text-sm font-medium mt-2 text-center truncate w-full"
              :style="{ color: 'var(--text-color-secondary)' }">
              {{ item.label }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-area rounded-xl shadow-md p-4 flex-1 min-h-25" ref="chartArea" :style="{
      height: computedChartHeight + 'px',
      backgroundColor: 'var(--bg-color-secondary)',
      border: '1px solid var(--border-color-light)',
      background:
        'linear-gradient(to bottom right, var(--bg-color), var(--bg-color-hover))',
    }">
      <div ref="chart" class="w-full h-full" :style="{ height: computedChartHeight - 20 + 'px' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick, inject } from "vue"
import EventBus from "@/utils/event-bus"
import { getCssVar } from "@/utils/template"
import { debounce, cloneDeep } from "lodash"
import { useMainStore } from "@/stores/main"
import { getRequest } from "@/utils/api"
import { message } from "@/utils/message"
import { getLoading } from "@/utils/loading"
import * as echarts from "echarts"

const store = useMainStore()
const prefix = inject("prefix") as string

interface ProgressItem {
  label: string
  color: string
}

interface ProgressItems {
  chat: { [key: string]: ProgressItem }
  call: { [key: string]: ProgressItem }
}

interface ChatAndCallMonth {
  date: string[]
  chat: number[]
  call: number[]
}

interface ChartOption {
  title: {
    text: string
    textStyle: {
      color: string
      fontSize: number
    }
  }
  tooltip: echarts.EChartsOption['tooltip']
  legend: echarts.EChartsOption['legend']
  grid: echarts.EChartsOption['grid']
  toolbox: echarts.EChartsOption['toolbox']
  xAxis: {
    type?: 'category' | 'value'
    data?: (string | number)[]
    boundaryGap?: boolean
    axisLine?: {
      lineStyle?: {
        color?: string
      }
    }
    axisLabel?: {
      color?: string
      fontSize?: number
    }
  }
  yAxis: {
    type?: 'category' | 'value'
    position?: 'left' | 'right'
    name?: string
    axisLine?: {
      lineStyle?: {
        color?: string
      }
    }
    axisLabel?: {
      color?: string
      fontSize?: number
    }
    splitLine?: {
      lineStyle?: {
        color?: string
      }
    }
  }[]
  series: echarts.EChartsOption['series']
}

const progressWidth = ref(80)
const strokeWidth = ref(8)
const fontSize = ref(14)
const areaHeight = ref(300)
const chartBorderHeight = ref(0)
const chCnt = ref({ num: 0, day: 0, week: 0, month: 0, year: 0 })
const callCnt = ref({ num: 0, day: 0, week: 0, month: 0, year: 0 })
const progressItems = ref<ProgressItems>({
  chat: {
    num: { label: "总数", color: "#f97316" },
    day: { label: "一日内", color: "#ec4899" },
    week: { label: "一周内", color: "#a855f7" },
    month: { label: "一月内", color: "#3b82f6" },
    year: { label: "一年内", color: "#10b981" },
  },
  call: {
    num: { label: "总数", color: "#f97316" },
    day: { label: "一日内", color: "#ec4899" },
    week: { label: "一周内", color: "#a855f7" },
    month: { label: "一月内", color: "#3b82f6" },
    year: { label: "一年内", color: "#10b981" },
  },
})
const chatCntInterval = ref<number | null>(null)
const callInterval = ref<number | null>(null)
const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null
const chatAndCallMonth = ref<ChatAndCallMonth>({ date: [], chat: [], call: [] })
const chartOpt = ref<ChartOption>({
  title: {
    text: "消息/调用统计",
    textStyle: {
      color: "var(--primary-color)",
      fontSize: 16,
    },
  },
  tooltip: {
    trigger: "axis",
    backgroundColor: "var(--el-bg-color-overlay)",
    borderColor: "var(--border-color-light)",
    borderWidth: 1,
    textStyle: {
      color: "var(--text-color)",
      fontSize: 14,
    },
  },
  legend: {
    data: ["消息统计", "调用统计"],
    textStyle: {
      color: "var(--text-color)",
      fontSize: 14,
    },
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
    backgroundColor: "var(--bg-color-secondary)",
  },
  toolbox: {
    feature: {
      saveAsImage: {
        title: "保存图片",
        pixelRatio: 2,
      },
    },
    iconStyle: {
      borderColor: "var(--primary-color-light)",
    },
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: [],
    axisLine: {
      lineStyle: {
        color: "var(--border-color)",
      },
    },
    axisLabel: {
      color: "var(--text-color-secondary)",
      fontSize: 12,
    },
  },
  yAxis: [
    {
      type: "value",
      name: "消息统计",
      axisLine: {
        lineStyle: {
          color: "var(--border-color)",
        },
      },
      axisLabel: {
        color: "var(--text-color-secondary)",
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: "var(--border-color-light)",
        },
      },
    },
    {
      type: "value",
      name: "调用统计",
      position: "right",
      axisLine: {
        lineStyle: {
          color: "var(--border-color)",
        },
      },
      axisLabel: {
        color: "var(--text-color-secondary)",
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: "var(--border-color-light)",
        },
      },
    },
  ],
  series: [
    {
      name: "消息统计",
      type: "line",
      smooth: true,
      data: [],
      yAxisIndex: 0,
      lineStyle: {
        width: 3,
        color: "var(--primary-color)",
      },
      itemStyle: {
        color: "var(--primary-color)",
      },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: "var(--primary-color-light)",
            },
            {
              offset: 1,
              color: "var(--el-fill-color-light)",
            },
          ],
        },
      },
    },
    {
      name: "调用统计",
      type: "line",
      smooth: true,
      data: [],
      yAxisIndex: 1,
      lineStyle: {
        width: 3,
        color: "var(--primary-color-light)",
      },
      itemStyle: {
        color: "var(--primary-color-light)",
      },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: "var(--el-fill-color)",
            },
            {
              offset: 1,
              color: "var(--el-fill-color-lighter)",
            },
          ],
        },
      },
    },
  ],
})

const midInfo = ref<HTMLElement | null>(null)
const chartArea = ref<HTMLElement | null>(null)

const chartInitialized = ref(false)

const computedChartHeight = computed(() => {
  if (!chartInitialized.value && !chartBorderHeight.value) {
    // 只在组件初始化时调用一次
    nextTick(() => {
      if (!chartInitialized.value) {
        handleResize()
        chartInitialized.value = true
      }
    })
  }
  return chartBorderHeight.value
})

const isMobile = () => {
  return window.innerWidth <= 640
}

const updateAreaHeight = () => {
  if (isMobile()) {
    // 移动端使用固定高度
    areaHeight.value = 500
  } else {
    // 桌面端保持原有动态计算逻辑
    const height = window.innerHeight
    areaHeight.value = height * 0.2
    if (height > 1080) {
      areaHeight.value = height * 0.25
    }
    if (height > 1440) {
      areaHeight.value = height * 0.3
    }
    // 确保最小高度
    areaHeight.value = Math.max(areaHeight.value, 200)
  }
}

const handleResize = () => {
  const width = window.innerWidth
  const height = window.innerHeight

  // 进度条大小调整逻辑保持不变
  if (width < 640) {
    progressWidth.value = Math.min(70, Math.max(50, width * 0.15))
    strokeWidth.value = 6
    fontSize.value = 10
  } else if (width < 1024) {
    progressWidth.value = 75
    strokeWidth.value = 7
    fontSize.value = 12
  } else {
    progressWidth.value = 90
    strokeWidth.value = 8
    fontSize.value = 14
  }

  // 高分辨率适配
  if (height > 1080) {
    progressWidth.value = Math.floor(height * 0.15)
    strokeWidth.value = Math.floor(progressWidth.value * 0.2)
    fontSize.value = Math.floor(progressWidth.value * 0.15)
  }

  // 确保最小和最大值
  progressWidth.value = Math.max(50, Math.min(progressWidth.value, 120))
  strokeWidth.value = Math.max(6, Math.min(strokeWidth.value, 12))
  fontSize.value = Math.max(10, Math.min(fontSize.value, 18))

  // 调用更新高度方法
  updateAreaHeight()

  nextTick(() => {
    if (midInfo.value) {
      chartBorderHeight.value =
        midInfo.value.offsetHeight - areaHeight.value * 2 - 100
      chartBorderHeight.value = Math.max(chartBorderHeight.value, 180)
    }

    if (chartRef.value) {
      chartInstance?.resize()
    }
  })
}

const getPercentageChat = (type: string) => {
  if (chCnt.value.num == 0) return 0
  if (type == "num") return 100
  if (chCnt.value[type as keyof typeof chCnt.value] == chCnt.value.num) return 100
  return (chCnt.value[type as keyof typeof chCnt.value] / chCnt.value.num) * 100
}

const getPercentageCall = (type: string) => {
  if (callCnt.value.num == 0) return 0
  if (type == "num") return 100
  if (callCnt.value[type as keyof typeof callCnt.value] == callCnt.value.num) return 100
  return (callCnt.value[type as keyof typeof callCnt.value] / callCnt.value.num) * 100
}

interface ApiResponse<T = unknown> {
  suc: boolean
  data: T
  info?: string
  warning?: string
}

interface ChatCountData {
  num: number
  day: number
  week: number
  month: number
  year: number
}

const getMonthChatAndCallCount = (bot_id: string) => {
  const loading = getLoading(".chart-area")
  getRequest(
    `${prefix}/dashboard/get_chat_and_call_month`,
    { bot_id: bot_id }
  ).then((resp: { data: ApiResponse<ChatAndCallMonth> }) => {
    if (resp.data.suc) {
      if (resp.data.warning) {
        message.warning(resp.data.warning || '')
      } else {
        message.success(resp.data.info || '')
        chatAndCallMonth.value = resp.data.data
        const chartOptClone = cloneDeep(chartOpt.value)
        if (chartOptClone.xAxis && 'data' in chartOptClone.xAxis) {
          chartOptClone.xAxis.data = chatAndCallMonth.value.date
        }
        if (chartOptClone.series && Array.isArray(chartOptClone.series)) {
          const series0 = chartOptClone.series[0]
          const series1 = chartOptClone.series[1]
          if (series0 && 'data' in series0) {
            series0.data = chatAndCallMonth.value.chat
          }
          if (series1 && 'data' in series1) {
            series1.data = chatAndCallMonth.value.call
          }
        }
        chartInstance?.setOption(chartOptClone)
        chartInstance?.resize()
      }
    } else {
      message.error(resp.data.info || '')
    }
    loading.close()
  })
}

const getChCount = (bot_id: string, no_loading?: boolean) => {
  if (bot_id) {
    let loading: ReturnType<typeof getLoading> | null = null
    if (!no_loading) {
      loading = getLoading(".message-area")
    }

    getRequest(`${prefix}/main/get_all_chat_count`, {
      bot_id,
    }).then((resp: { data: ApiResponse<ChatCountData> }) => {
      if (resp.data.suc) {
        if (resp.data.warning) {
          if (loading) {
            message.warning(resp.data.warning || '')
          }
        } else {
          if (loading) {
            message.success(resp.data.info || '')
          }
          chCnt.value = resp.data.data
        }
      } else {
        if (loading) {
          message.error(resp.data.info || '')
        }
      }
      if (loading) {
        loading.close()
      }
    })
  }
}

const getCallCount = (bot_id: string, no_loading?: boolean) => {
  if (bot_id) {
    let loading: ReturnType<typeof getLoading> | null = null
    if (!no_loading) {
      loading = getLoading(".function-area")
    }

    getRequest(`${prefix}/main/get_all_call_count`, {
      bot_id,
    }).then((resp: { data: ApiResponse<ChatCountData> }) => {
      if (resp.data.suc) {
        if (resp.data.warning) {
          if (loading) {
            message.warning(resp.data.warning || '')
          }
        } else {
          if (loading) {
            message.success(resp.data.info || '')
          }

          callCnt.value = resp.data.data
        }
      } else {
        if (loading) {
          message.error(resp.data.info || '')
        }
      }
      if (loading) {
        loading.close()
      }
    })
  }
}

const updateChartTheme = () => {
  const chartOptNew: ChartOption = {
    title: {
      text: "消息/调用统计",
      textStyle: {
        color: getCssVar("--primary-color"),
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: getCssVar("--el-bg-color-overlay"),
      borderColor: getCssVar("--border-color-light"),
      borderWidth: 1,
      textStyle: {
        color: getCssVar("--text-color"),
        fontSize: 14,
      },
    },
    legend: {
      data: ["消息统计", "调用统计"],
      textStyle: {
        color: getCssVar("--text-color"),
        fontSize: 14,
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
      backgroundColor: getCssVar("--bg-color-secondary"),
    },
    toolbox: {
      feature: {
        saveAsImage: {
          title: "保存图片",
          pixelRatio: 2,
        },
      },
      iconStyle: {
        borderColor: getCssVar("--primary-color-light"),
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: chartOpt.value.xAxis?.data || [],
      axisLine: {
        lineStyle: {
          color: getCssVar("--border-color"),
        },
      },
      axisLabel: {
        color: getCssVar("--text-color-secondary"),
        fontSize: 12,
      },
    },
    yAxis: [
      {
        type: "value",
        name: "消息统计",
        axisLine: {
          lineStyle: {
            color: getCssVar("--border-color"),
          },
        },
        axisLabel: {
          color: getCssVar("--text-color-secondary"),
          fontSize: 12,
        },
        splitLine: {
          lineStyle: {
            color: getCssVar("--border-color-light"),
          },
        },
      },
      {
        type: "value",
        name: "调用统计",
        position: "right",
        axisLine: {
          lineStyle: {
            color: getCssVar("--border-color"),
          },
        },
        axisLabel: {
          color: getCssVar("--text-color-secondary"),
          fontSize: 12,
        },
        splitLine: {
          lineStyle: {
            color: getCssVar("--border-color-light"),
          },
        },
      },
    ],
    series: [
      {
        name: "消息统计",
        type: "line",
        smooth: true,
        data: chatAndCallMonth.value.chat,
        yAxisIndex: 0,
        lineStyle: {
          width: 3,
          color: getCssVar("--primary-color"),
        },
        itemStyle: {
          color: getCssVar("--primary-color"),
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: getCssVar("--primary-color-light"),
              },
              {
                offset: 1,
                color: getCssVar("--el-fill-color-light"),
              },
            ],
          },
        },
      },
      {
        name: "调用统计",
        type: "line",
        smooth: true,
        data: chatAndCallMonth.value.call,
        yAxisIndex: 1,
        lineStyle: {
          width: 3,
          color: getCssVar("--primary-color-light"),
        },
        itemStyle: {
          color: getCssVar("--primary-color-light"),
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: getCssVar("--el-fill-color"),
              },
              {
                offset: 1,
                color: getCssVar("--el-fill-color-lighter"),
              },
            ],
          },
        },
      },
    ],
  }

  chartOpt.value = chartOptNew
  if (chartInstance) {
    chartInstance.setOption(chartOptNew as echarts.EChartsOption, true)
  }
  nextTick(() => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })
}

onMounted(() => {
  const botInfo = store.botInfo

  window.addEventListener("resize", handleResize)
  if (botInfo?.self_id) {
    getChCount(botInfo.self_id)
    getCallCount(botInfo.self_id)
    getMonthChatAndCallCount(botInfo.self_id)
    chatCntInterval.value = setInterval(() => {
      getChCount(botInfo.self_id, true)
    }, 30000)
    callInterval.value = setInterval(() => {
      getCallCount(botInfo.self_id, true)
    }, 30000)
  }

  nextTick(() => {
    if (chartRef.value) {
      chartInstance = echarts.init(chartRef.value)
      handleResize()
      updateChartTheme()
      chartInitialized.value = true
    }
  })

  EventBus.on("sidebar-aside", debounce(handleResize, 200))
  EventBus.on("change-theme", debounce(updateChartTheme, 200))
})

onBeforeUnmount(() => {
  if (chatCntInterval.value) {
    clearInterval(chatCntInterval.value)
  }
  if (callInterval.value) {
    clearInterval(callInterval.value)
  }
  window.removeEventListener("resize", handleResize)
  EventBus.off("sidebar-aside", handleResize)
  EventBus.off("change-theme", updateChartTheme)
})
</script>

<style scoped>
.mid-info {
  background-color: var(--bg-color);
}

.message-area,
.function-area,
.chart-area {
  transition: height 0.3s ease, font-size 0.3s ease;
}

.title-box {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.text-md {
  font-size: 1rem;
  line-height: 1.5;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.5;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1.5;
}

.progress-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 移动端响应式样式 */
@media (max-width: 640px) {

  .message-area,
  .function-area {
    padding: 12px;
  }

  .title-box {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .title-box span {
    margin-left: 0;
    margin-top: 4px;
    width: 100%;
  }

  .progress-container {
    min-width: 60px;
    max-width: 80px;
  }

  .grid-cols-2 {
    gap: 8px;
  }
}

/* 平板响应式样式 */
@media (max-width: 1024px) and (min-width: 641px) {

  .message-area,
  .function-area {
    padding: 12px;
  }
}

/* 自定义滚动条 */
.mid-info::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.mid-info::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb-color);
  border-radius: 9999px;
}

.mid-info::-webkit-scrollbar-track {
  background-color: var(--bg-color);
}

/* 打印样式 */
@media print {
  .mid-info {
    background-color: white !important;
  }

  .message-area,
  .function-area,
  .chart-area {
    border: 1px solid var(--border-color) !important;
    box-shadow: none !important;
  }
}
</style>
