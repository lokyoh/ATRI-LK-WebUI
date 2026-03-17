<template>
  <div ref="midInfo" class="mid-info text-gray-800 p-4 flex flex-col" :style="{ backgroundColor: 'var(--bg-color)' }">
    <!-- 顶部区域 -->
    <div class="top-area" ref="topArea">
      <!-- 欢迎标题 -->
      <div v-if="!isMobile()" ref="welcomeBox"
        class="welcome-box rounded-xl z-10 p-5 shadow-lg mb-5 transform hover:scale-105 transition-transform"
        :style="{ backgroundColor: 'var(--bg-color-secondary)' }">
        <p class="text-2xl md:text-3xl font-bold mb-2" :style="{ color: 'var(--primary-color)' }">
          <span :style="{ color: 'var(--primary-color-light)' }">(≧∇≦)ﾉ</span>
          Hello 欢迎来到ATRI的仪表盘！
        </p>
      </div>

      <div id="main" ref="mainContent" :style="{ height: mainHeight + 'px' }" class="overflow-auto px-0">
        <div ref="mainStatus" class="overflow-auto overflow-x-visible">
          <!-- 系统状态 -->
          <div ref="systemCard" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div v-for="(item, index) in systemCards" :key="index"
              class="rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
              :style="{ backgroundColor: 'var(--bg-color-secondary)' }">
              <div class="flex items-center justify-center mb-2">
                <SvgIcon :name="item.icon" size="24" :color="primaryColor" />
                <span class="text-sm md:text-base font-medium" :style="{ color: 'var(--text-color-secondary)' }">{{
                  item.title }}</span>
              </div>
              <div class="text-center">
                <p class="text-2xl md:text-3xl font-bold" :style="{ color: 'var(--text-color-secondary)' }">
                  {{ systemStatus?.[item.key] }}%
                </p>
              </div>
            </div>
          </div>

          <!-- 聊天统计 -->
          <div ref="chatCard" class="char-cards grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div v-for="(item, index) in chatCards" :key="index"
              class="rounded-xl p-3 shadow-md hover:shadow-lg transition-shadow"
              :style="{ backgroundColor: 'var(--bg-color-secondary)' }">
              <div class="text-center mb-1">
                <span class="text-xs md:text-sm font-medium" :style="{ color: 'var(--text-color-secondary)' }">{{
                  item.title }}</span>
              </div>
              <div class="text-center">
                <p class="text-xl md:text-2xl font-bold" :style="{ color: 'var(--primary-color)' }">
                  {{ chatAndCall[item.key] }}
                </p>
              </div>
            </div>
          </div>

          <!-- 详细统计区域 -->
          <div class="detail-more rounded-xl overflow-hidden shadow-lg mb-4"
            :style="{ backgroundColor: 'var(--bg-color-secondary)' }">

            <!-- 详细统计 -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4"
              :style="{ backgroundColor: 'var(--bg-color-secondary)' }" ref="collapseContent">
              <div v-for="(item, index) in detailCards" :key="index"
                class="rounded-lg p-2 shadow-inner hover:shadow-md transition-shadow duration-300"
                :style="{ backgroundColor: 'var(--bg-color)' }">
                <div class="text-center mb-1">
                  <span class="text-xs font-medium" :style="{ color: 'var(--text-color-secondary)' }">{{ item.title
                    }}</span>
                </div>
                <div class="text-center">
                  <p class="text-lg font-bold" :style="{ color: 'var(--primary-color)' }">
                    {{ allChatAndCall[item.key] }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 图表区域 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 min-h-90">
              <div class="rounded-xl p-4 h-90 shadow-md hover:shadow-lg transition-shadow duration-300"
                :style="{ backgroundColor: 'var(--bg-color-secondary)' }">
                <div ref="chatChart" class="w-full h-full"></div>
              </div>
              <div class="rounded-xl p-4 h-90 shadow-md hover:shadow-lg transition-shadow duration-300"
                :style="{ backgroundColor: 'var(--bg-color-secondary)' }">
                <div ref="callChart" class="w-full h-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AnsiUp } from "ansi_up"
import { useMainStore } from "@/stores/main"
import { ref, onMounted, onUnmounted, nextTick, inject, computed } from "vue"
import { getLoading } from "@/utils/loading"
import * as echarts from "echarts/core"
import { isMobile } from "@/utils/validate"
import { getRequest } from "@/utils/api"
import { message } from "@/utils/message"
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'
import type { WsStatusData } from '@/stores/main'


const store = useMainStore()
const prefix = inject<string>('prefix')

interface BaseInfo {
  self_id: string;
  nickname: string;
  ava_url: string;
  friend_count: number;
  group_count: number;
  received_messages: number;
  connect_time: number;
  connect_date: string;
  connect_count: number;
  status: boolean;
  is_select: boolean;
  day_call: number;
  version: string;
}
interface allChatAndCallCount {
  chat_week: number;
  chat_month: number;
  chat_year: number;
  call_week: number;
  call_month: number;
  call_year: number;
  [key: string]: number;
}
interface getAllChatAndCallCountResponse {
  suc: boolean;
  code: number;
  info: string;
  warning?: string;
  data: allChatAndCallCount;
}
interface chatCallMonthCount {
  chat: number[];
  call: number[];
  date: string[];
}
interface getMonthChatAndCallCountResponse {
  suc: boolean;
  code: number;
  info: string;
  warning?: string;
  data: chatCallMonthCount;
}
interface queryChatCallCount {
  chat_num: number;
  chat_day: number;
  call_num: number;
  call_day: number;
  [key: string]: number;
}
interface getChatAndCallCountResponse {
  suc: boolean;
  code: number;
  info: string;
  warning?: string;
  data: queryChatCallCount;
}

const systemCards = ref([
  {
    icon: "cpu",
    title: "CPU",
    key: "cpu",
  },
  {
    icon: "memory",
    title: "MEMORY",
    key: "memory",
  },
  {
    icon: "disk",
    title: "DISK",
    key: "disk",
  },
])
const chatCards = ref([
  { title: "消息总数", key: "chat_num" },
  { title: "今日消息", key: "chat_day" },
  { title: "调用总数", key: "call_num" },
  { title: "今日调用", key: "call_day" },
])
const detailCards = ref([
  { title: "一周内消息", key: "chat_week" },
  { title: "一月内消息", key: "chat_month" },
  { title: "一年内消息", key: "chat_year" },
  { title: "一周内调用", key: "call_week" },
  { title: "一月内调用", key: "call_month" },
  { title: "一年内调用", key: "call_year" },
])
const windowHeight = ref(window.innerHeight)
const botInfo = ref<BaseInfo | null>(null)
const chatAndCall = ref<queryChatCallCount>({ chat_num: 0, chat_day: 0, call_num: 0, call_day: 0 })
const allChatAndCall = ref<allChatAndCallCount>({
  chat_week: 0,
  chat_month: 0,
  chat_year: 0,
  call_week: 0,
  call_month: 0,
  call_year: 0,
})
const chatAndCallMonth = ref<chatCallMonthCount>({ chat: [], call: [], date: [] })
const ansi_up = ref<AnsiUp | null>(null)
const clgDiv = ref<HTMLElement | null>(null)
const chatCntInterval = ref<ReturnType<typeof setInterval> | null>(null)
const chatChart = ref<HTMLElement | null>(null)
const callChart = ref<HTMLElement | null>(null)
let chatChartInstance: echarts.ECharts | null = null
let callChartInstance: echarts.ECharts | null = null
const chartOpt = ref({
  title: {
    text: "30天内记录次数",
    left: "center",
    textStyle: { color: "var(--primary-color)" },
    subtextStyle: { color: "var(--text-color-secondary)" },
  },
  xAxis: {
    type: "category",
    name: "日期",
    data: [],
    axisLine: { lineStyle: { color: "var(--text-color-secondary)" } },
    axisLabel: { color: "var(--text-color-secondary)" },
  },
  yAxis: {
    type: "value",
    name: "次数",
    axisLine: { lineStyle: { color: "var(--text-color-secondary)" } },
    axisLabel: { color: "var(--text-color-secondary)" },
  },
  tooltip: {
    trigger: "axis",
    backgroundColor: "var(--bg-color-secondary)",
    borderColor: "var(--border-color)",
    textStyle: { color: "var(--text-color)" },
  },
  series: [
    {
      data: [],
      type: "line",
      smooth: true,
      lineStyle: { color: "var(--primary-color-light)" },
      itemStyle: { color: "var(--primary-color)" },
    },
  ],
  backgroundColor: "var(--bg-color)",
})
const mainHeight = ref(0)
const resizeObserver = ref<ResizeObserver | null>(null)
const welcomeBox = ref<HTMLElement | null>(null)
const systemCard = ref<HTMLElement | null>(null)
const chatCard = ref<HTMLElement | null>(null)
const midInfo = ref<HTMLElement | null>(null)
const ws = ref<WebSocket | null>(null)

const systemStatus = computed(() => store.wsStatusData as WsStatusData | null)

const primaryColor = ref('')

const updatePrimaryColor = () => {
  const style = getComputedStyle(document.documentElement)
  primaryColor.value = style.getPropertyValue('--primary-color').trim()
}

botInfo.value = store.botInfo

onMounted(() => {
  updatePrimaryColor()
  window.addEventListener("resize", handleResize)
  clgDiv.value = document.getElementById("clg")
  ansi_up.value = new AnsiUp()
  getChatAndCallCount()
  getAllChatAndCallCount()
  getMonthChatAndCallCount()
  store.initStatusSocket()
  chatCntInterval.value = setInterval(() => {
    getChatAndCallCount(true)
    getAllChatAndCallCount(true)
    getMonthChatAndCallCount(true)
  }, 30000)
  if (chatChart.value) {
    chatChartInstance = echarts.init(chatChart.value)
    callChartInstance = echarts.init(callChart.value)
  }
  calculateMainHeight()
  setupResizeObserver()
  window.addEventListener("resize", calculateMainHeight)

  // 监听主题变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "data-theme") {
        updatePrimaryColor()
        getMonthChatAndCallCount()
      }
    })
  })
  observer.observe(document.documentElement, { attributes: true })
})

onUnmounted(() => {
  if (ws.value) {
    ws.value.close()
  }
  if (chatCntInterval.value) {
    clearInterval(chatCntInterval.value)
  }
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
  window.removeEventListener("resize", calculateMainHeight)
})

function calculateMainHeight() {
  nextTick(() => {
    // 获取容器总高度
    const midInfoHeight = midInfo.value?.offsetHeight || 0

    // 获取上方所有元素的高度
    const welcomeBoxHeight = welcomeBox.value?.offsetHeight || 0
    const systemCardsHeight = systemCard.value?.offsetHeight || 0
    const chatCardsHeight = chatCard.value?.offsetHeight || 0
    const collapseHeaderHeight = 48 // 折叠面板标题固定高度

    // 计算剩余可用高度
    const usedHeight =
      welcomeBoxHeight +
      systemCardsHeight +
      chatCardsHeight +
      collapseHeaderHeight

    // 添加额外的margin/padding补偿（移动端可能需要调整这个值）
    const mobileCompensation = isMobile() ? 20 : 0

    // 设置主内容区高度
    mainHeight.value = Math.max(
      midInfoHeight - usedHeight - mobileCompensation + 85,
      200
    )

    // 如果是移动设备，使用更紧凑的布局
    if (isMobile()) {
      mainHeight.value = Math.max(mainHeight.value, 500)
    }
  })
}

function setupResizeObserver() {
  resizeObserver.value = new ResizeObserver(() => {
    calculateMainHeight()
    if (chatChart.value) chatChartInstance?.resize()
    if (callChart.value) callChartInstance?.resize()
  })

  // 观察所有可能影响布局的元素
  if (midInfo.value) resizeObserver.value.observe(midInfo.value)
  if (welcomeBox.value)
    resizeObserver.value.observe(welcomeBox.value)
  if (systemCard.value)
    resizeObserver.value.observe(systemCard.value)
  if (chatCard.value)
    resizeObserver.value.observe(chatCard.value)
}

function handleResize() {
  windowHeight.value = window.innerHeight
  if (chatChart.value) chatChartInstance?.resize()
  if (callChart.value) callChartInstance?.resize()
}

function getAllChatAndCallCount(no_loading = false) {
  let loading: ReturnType<typeof getLoading> | null = null
  if (!no_loading) {
    loading = getLoading(".detail-more")
  }
  getRequest(
    `${prefix}/dashboard/get_all_chat_and_call_count`
  ).then((resp: { data: getAllChatAndCallCountResponse }) => {
    if (resp.data.suc) {
      if (resp.data.warning) {
        message.warning(resp.data.warning)
      } else {
        message.success(resp.data.info)
        allChatAndCall.value = resp.data.data
      }
    } else {
      if (loading) message.error(resp.data.info)
    }
    if (loading) loading.close()
  })
}

function getMonthChatAndCallCount(no_loading = false) {
  let loading: ReturnType<typeof getLoading> | null = null
  if (!no_loading) {
    loading = getLoading(".detail-more")
  }
  getRequest(
    `${prefix}/dashboard/get_chat_and_call_month`
  ).then((resp: { data: getMonthChatAndCallCountResponse }) => {
    if (resp.data.suc) {
      if (resp.data.warning) {
        message.warning(resp.data.warning)
      } else {
        message.success(resp.data.info)
        chatAndCallMonth.value = resp.data.data
        const chatOpt = JSON.parse(JSON.stringify(chartOpt.value))
        const callOpt = JSON.parse(JSON.stringify(chartOpt.value))
        chatOpt.xAxis.data = chatAndCallMonth.value.date
        callOpt.xAxis.data = chatAndCallMonth.value.date
        chatOpt.title.text = "聊天记录"
        callOpt.title.text = "调用记录"
        chatOpt.series[0].data = chatAndCallMonth.value.chat
        callOpt.series[0].data = chatAndCallMonth.value.call

        // 获取当前主题的实际颜色值
        const computedStyle = getComputedStyle(document.documentElement)
        const primaryColor = computedStyle
          .getPropertyValue("--primary-color")
          .trim()
        const primaryColorLight = computedStyle
          .getPropertyValue("--primary-color-light")
          .trim()
        const textColor = computedStyle
          .getPropertyValue("--text-color")
          .trim()
        const textColorSecondary = computedStyle
          .getPropertyValue("--text-color-secondary")
          .trim()
        const bgColor = computedStyle.getPropertyValue("--bg-color").trim()
        const bgColorSecondary = computedStyle
          .getPropertyValue("--bg-color-secondary")
          .trim()
        const borderColor = computedStyle
          .getPropertyValue("--border-color")
          .trim()

        // 更新图表配置中的颜色
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateChartColors = (opt: any) => {
          opt.title.textStyle.color = primaryColor
          opt.title.subtextStyle.color = textColorSecondary
          opt.xAxis.axisLine.lineStyle.color = textColorSecondary
          opt.xAxis.axisLabel.color = textColorSecondary
          opt.yAxis.axisLine.lineStyle.color = textColorSecondary
          opt.yAxis.axisLabel.color = textColorSecondary
          opt.tooltip.backgroundColor = bgColorSecondary
          opt.tooltip.borderColor = borderColor
          opt.tooltip.textStyle.color = textColor
          opt.series[0].lineStyle.color = primaryColorLight
          opt.series[0].itemStyle.color = primaryColor
          opt.backgroundColor = bgColor
        }

        updateChartColors(chatOpt)
        updateChartColors(callOpt)

        chatChartInstance?.setOption(chatOpt)
        callChartInstance?.setOption(callOpt)
        chatChartInstance?.resize()
        callChartInstance?.resize()
      }
    } else {
      if (loading) message.error(resp.data.info)
    }
    if (loading) loading.close()
  })
}

function getChatAndCallCount(no_loading = false) {
  let loading: ReturnType<typeof getLoading> | null = null
  if (!no_loading) {
    loading = getLoading(".char-cards")
  }
  getRequest(
    `${prefix}/dashboard/get_chat_and_call_count`
  ).then((resp: { data: getChatAndCallCountResponse }) => {
    if (resp.data.suc) {
      if (resp.data.warning) {
        if (loading) message.warning(resp.data.warning)
      } else {
        if (loading) message.success(resp.data.info)
        chatAndCall.value = resp.data.data
      }
    } else {
      if (loading) message.error(resp.data.info)
    }
    if (loading) loading.close()
  })
}
</script>

<style scoped>
.mid-info {
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
}

/* 欢迎标题 */
.welcome-box p.text-2xl {
  font-size: var(--font-size-xxl);
  line-height: var(--line-height-dense);
}

.welcome-box p.text-sm {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

/* 系统卡片 */
.system-cards .text-sm {
  font-size: var(--font-size-xs);
}

.system-cards .text-2xl {
  font-size: var(--font-size-xl);
}

/* 聊天统计卡片 */
.chat-cards .text-xs {
  font-size: var(--font-size-xxs);
}

.chat-cards .text-xl {
  font-size: var(--font-size-lg);
}

/* 详细统计卡片 */
.detail-cards .text-xs {
  font-size: var(--font-size-xxs);
}

.detail-cards .text-lg {
  font-size: var(--font-size-sm);
}

/* 日志区域 */
.log-area .text-lg {
  font-size: var(--font-size-md);
}

.log-area .text-xs {
  font-size: var(--font-size-xxs);
}

/* 代码日志 */
#clg {
  font-size: var(--font-size-code);
  line-height: var(--line-height-normal);
}

/* 折叠面板标题 */
:deep(.el-collapse-item__header) {
  font-size: var(--font-size-sm);
  background-color: var(--bg-color-secondary) !important;
}

:deep(.el-collapse-item__content) {
  background-color: var(--bg-color-secondary) !important;
}

/* 响应式微调 */
@media (max-width: 480px) {
  .welcome-box p.text-2xl {
    font-size: var(--font-size-xl);
  }

  .system-cards .text-2xl {
    font-size: var(--font-size-lg);
  }

  .chat-cards .text-xl {
    font-size: var(--font-size-md);
  }

  /* 小屏幕增加行高 */
  #clg {
    line-height: var(--line-height-loose);
  }
}

/* 超大屏幕优化 */
@media (min-width: 1920px) {
  .welcome-box p.text-2xl {
    letter-spacing: 0.02em;
  }

  .log-area {
    font-size: var(--font-size-sm);
  }
}
</style>
