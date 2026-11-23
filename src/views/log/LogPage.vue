<template>
  <div class="log-page">
    <div class="page-header">
      <div>
        <p class="page-kicker">系统运行状态</p>
      </div>
      <div class="mode-tabs">
        <button
          :class="['mode-btn', { active: mode === 'live' }]"
          @click="switchMode('live')"
        >
          实时日志
        </button>
        <button
          :class="['mode-btn', { active: mode === 'history' }]"
          @click="switchMode('history')"
        >
          历史检索
        </button>
      </div>
    </div>

    <div v-if="mode === 'live'" class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <span class="stat-label">{{ stat.label }}</span>
        <strong class="stat-value">{{ stat.value }}</strong>
      </div>
    </div>

    <div class="log-panel">
      <div class="panel-toolbar">
        <div class="filter-group">
          <button
            v-for="level in levels"
            :key="level"
            :class="['filter-btn', { active: activeLevel === level }]"
            @click="activeLevel = level"
          >
            {{ level === 'all' ? '全部' : levelMap[level] }}
          </button>
        </div>
        <div class="toolbar-actions">
          <!-- 实时模式：客户端即时过滤 -->
          <template v-if="mode === 'live'">
            <input
              v-model="keyword"
              class="search-input"
              type="text"
              placeholder="搜索日志…"
            />
            <button
              :class="['tool-btn', { active: autoScroll }]"
              :title="autoScroll ? '新日志到达时自动滚动到底部' : '已暂停跟随，点击恢复'"
              @click="autoScroll = !autoScroll"
            >
              {{ autoScroll ? '跟随滚动' : '暂停跟随' }}
            </button>
            <button class="tool-btn" @click="logStore.clear()">清屏</button>
            <span class="panel-meta">
              共 {{ displayLogs.length }} 条 · {{ connectionLabel }}
            </span>
          </template>
          <!-- 历史模式：服务端关键字检索 + 分页 -->
          <template v-else>
            <select v-model="historyType" class="history-select" @change="onHistoryTypeChange">
              <option value="info">INFO</option>
              <option value="warning">WARNING</option>
              <option value="error">ERROR</option>
              <option value="debug">DEBUG</option>
            </select>
            <select v-model="historyFile" class="history-select" @change="fetchHistory(1)">
              <option v-for="f in filesOfType" :key="f.name" :value="f.name">
                {{ f.name }}
              </option>
            </select>
            <input
              v-model="historyKeyword"
              class="search-input"
              type="text"
              placeholder="关键字检索…"
              @keyup.enter="fetchHistory(1)"
            />
            <button class="tool-btn" :disabled="historyLoading" @click="fetchHistory(1)">
              查询
            </button>
            <button
              class="tool-btn"
              :disabled="historyLoading || historyPage <= 1"
              @click="fetchHistory(historyPage - 1)"
            >
              上一页
            </button>
            <button
              class="tool-btn"
              :disabled="historyLoading || historyPage >= totalPages"
              @click="fetchHistory(historyPage + 1)"
            >
              下一页
            </button>
            <span class="panel-meta">
              第 {{ historyPage }}/{{ totalPages || 1 }} 页 · 共 {{ historyTotal }} 行
            </span>
          </template>
        </div>
      </div>

      <!-- 虚拟滚动控制台：固定行高，只渲染可视区切片 -->
      <div ref="consoleShell" class="console-shell" @scroll="handleScroll">
        <div class="console-virtual" :style="{ height: `${totalHeight}px` }">
          <div
            v-for="(log, i) in visibleLogs"
            :key="log.id"
            class="console-line"
            :class="[`level-${log.level}`]"
            :style="{ top: `${(startIndex + i) * ROW_HEIGHT}px` }"
          >
            <span class="console-time">{{ log.time }}</span>
            <!-- eslint-disable-next-line vue/no-v-html：内容来自 ansi_up，已做 HTML 转义 -->
            <span class="console-message" v-html="log.html"></span>
          </div>
        </div>
        <div v-if="!displayLogs.length" class="empty-state">
          {{ mode === 'live' ? '暂无符合条件的日志' : '选择文件后点击查询' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { getRequest } from '@/utils/api'
import { parsePlainLogLine, useLogStore, type LogEntry } from '@/stores/logs'

const logStore = useLogStore()
const prefix = inject<string>('prefix', '/atri/api')

const levelMap: Record<'info' | 'warn' | 'error' | 'debug', string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG',
}

const levels = ['all', 'info', 'warn', 'error', 'debug'] as const
const activeLevel = ref<(typeof levels)[number]>('all')
const keyword = ref('')
const autoScroll = ref(true)
const mode = ref<'live' | 'history'>('live')
const consoleShell = ref<HTMLElement | null>(null)

// ---------- 实时模式 ----------

const filteredLogs = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return logStore.logs.filter((log) => {
    if (activeLevel.value !== 'all' && log.level !== activeLevel.value) return false
    if (kw && !log.text.toLowerCase().includes(kw)) return false
    return true
  })
})

const connectionLabel = computed(
  () =>
    ({
      connected: '已连接',
      reconnecting: '重连中…',
      offline: '未连接',
    })[logStore.connection],
)

// 一趟遍历同时统计各级别数量，替代多次 filter
const stats = computed(() => {
  let info = 0
  let warn = 0
  let error = 0
  for (const log of logStore.logs) {
    if (log.level === 'info') info += 1
    else if (log.level === 'warn') warn += 1
    else if (log.level === 'error') error += 1
  }
  return [
    { label: '总日志', value: logStore.logs.length },
    { label: 'INFO', value: info },
    { label: 'WARN', value: warn },
    { label: 'ERROR', value: error },
  ]
})

// ---------- 历史模式 ----------

interface HistoryFile {
  type: string
  name: string
  size: number
}

const historyType = ref('info')
const historyFiles = ref<HistoryFile[]>([])
const historyFile = ref('')
const historyKeyword = ref('')
const historyEntries = ref<LogEntry[]>([])
const historyTotal = ref(0)
const historyPage = ref(1)
const HISTORY_PAGE_SIZE = 500
const historyLoading = ref(false)
let historySeq = 0

const filesOfType = computed(() =>
  historyFiles.value.filter((f) => f.type === historyType.value),
)
const totalPages = computed(() =>
  Math.ceil(historyTotal.value / HISTORY_PAGE_SIZE),
)

async function fetchHistory(page: number) {
  if (!historyFile.value || historyLoading.value) return
  historyLoading.value = true
  try {
    const resp = await getRequest(`${prefix}/logs/history`, {
      type: historyType.value,
      name: historyFile.value,
      page,
      size: HISTORY_PAGE_SIZE,
      keyword: historyKeyword.value.trim(),
    })
    if (resp.data?.suc) {
      const { total, lines } = resp.data.data as {
        total: number
        lines: string[]
      }
      historyTotal.value = total
      historyPage.value = page
      historyEntries.value = lines.map((line) =>
        parsePlainLogLine(line, historySeq++),
      )
      scrollToTop()
    }
  } finally {
    historyLoading.value = false
  }
}

async function loadHistoryFiles() {
  if (historyFiles.value.length) return
  const resp = await getRequest(`${prefix}/logs/files`)
  if (resp.data?.suc) {
    historyFiles.value = resp.data.data as HistoryFile[]
    onHistoryTypeChange()
  }
}

function onHistoryTypeChange() {
  const candidates = filesOfType.value
  const latest = candidates[candidates.length - 1]
  historyFile.value = latest ? latest.name : ''
  if (historyFile.value) fetchHistory(1)
  else historyEntries.value = []
}

function switchMode(target: 'live' | 'history') {
  if (mode.value === target) return
  mode.value = target
  if (target === 'history') {
    loadHistoryFiles()
  } else {
    scrollToBottom()
  }
}

// ---------- 虚拟滚动 ----------

const ROW_HEIGHT = 28
const RENDER_BUFFER = 5
const scrollTop = ref(0)
const viewportH = ref(400)
let resizeObserver: ResizeObserver | null = null

const displayLogs = computed(() => {
  const list = mode.value === 'live' ? filteredLogs.value : historyEntries.value
  if (activeLevel.value === 'all') return list
  return list.filter((log) => log.level === activeLevel.value)
})

const totalHeight = computed(() => displayLogs.value.length * ROW_HEIGHT)
const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - RENDER_BUFFER),
)
const endIndex = computed(() =>
  Math.min(
    displayLogs.value.length,
    Math.ceil((scrollTop.value + viewportH.value) / ROW_HEIGHT) + RENDER_BUFFER,
  ),
)
const visibleLogs = computed(() =>
  displayLogs.value.slice(startIndex.value, endIndex.value),
)

// 距底部一行以内视为「贴底」
const isNearBottom = () => {
  const el = consoleShell.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < ROW_HEIGHT
}

const scrollToBottom = () => {
  nextTick(() => {
    const el = consoleShell.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

const scrollToTop = () => {
  nextTick(() => {
    const el = consoleShell.value
    if (el) el.scrollTop = 0
  })
}

// 用户往上翻阅时自动暂停跟随，拖回底部自动恢复（仅实时模式有意义）
const handleScroll = () => {
  const el = consoleShell.value
  if (el) scrollTop.value = el.scrollTop
  if (mode.value === 'live') autoScroll.value = isNearBottom()
}

// 实时模式下新数据到达时贴底跟随；历史模式的滚动由 fetchHistory 决定
watch(
  displayLogs,
  () => {
    if (mode.value === 'live' && autoScroll.value) scrollToBottom()
  },
  { flush: 'post' },
)

onMounted(() => {
  logStore.start()
  const el = consoleShell.value
  if (el) {
    viewportH.value = el.clientHeight
    resizeObserver = new ResizeObserver(() => {
      viewportH.value = el.clientHeight
    })
    resizeObserver.observe(el)
  }
  scrollToBottom()
})

onBeforeUnmount(() => {
  logStore.stop()
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped>
.log-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 2px;
}

.page-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.mode-tabs {
  display: flex;
  gap: 8px;
}

.mode-btn {
  padding: 6px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 999px;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--bg-color);
  border: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-color-secondary);
}

.stat-value {
  font-size: 24px;
  line-height: 1;
  color: var(--text-color);
}

.log-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--bg-color);
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.panel-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 999px;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-input {
  width: 160px;
  padding: 5px 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 999px;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: var(--el-color-primary-light-5);
}

.history-select {
  padding: 5px 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.history-select option {
  color: initial;
}

.tool-btn {
  padding: 5px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 999px;
  background: transparent;
  color: var(--text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-btn.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
}

.panel-meta {
  color: var(--text-color-secondary);
  font-size: 12px;
}

/* 虚拟滚动控制台：固定行高，行内容超宽时容器横向滚动 */
.console-shell {
  position: relative;
  min-height: 440px;
  height: 62vh;
  overflow: auto;
  /* 控制台背景走中性填充色：既跟随主题，又不会被粉/蓝主题染成大面积色块 */
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
}

.console-virtual {
  position: relative;
  width: 100%;
}

.console-line {
  position: absolute;
  left: 0;
  min-width: 100%;
  width: max-content;
  height: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: transparent;
}

.console-line.level-info {
  border-left: 3px solid var(--el-color-primary);
}

.console-line.level-warn {
  border-left: 3px solid var(--el-color-warning);
}

.console-line.level-error {
  border-left: 3px solid var(--el-color-danger);
}

.console-line.level-debug {
  border-left: 3px solid var(--el-color-success);
}

.console-time {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.console-message {
  white-space: pre;
  color: var(--el-text-color-primary);
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
  font-size: 13px;
}

.empty-state {
  position: absolute;
  top: 0;
  left: 0;
  padding: 28px 16px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
