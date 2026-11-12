<template>
  <div class="log-page">
    <div class="page-header">
      <div>
        <p class="page-kicker">系统运行状态</p>
      </div>
    </div>

    <div class="stats-grid">
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
        <div class="panel-meta">共 {{ filteredLogs.length }} 条日志</div>
      </div>

      <div ref="consoleShell" class="console-shell">
        <div
          v-for="log in filteredLogs"
          :key="log.id"
          class="console-line"
          :class="[`level-${log.level}`]"
        >
          <pre class="console-message">{{ log.message }}</pre>
        </div>
        <div v-if="!filteredLogs.length" class="empty-state">暂无符合条件的日志</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { getBaseUrl } from '@/utils/api'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

const ansiColorPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

interface LogEntry {
  id: number
  time: string
  level: LogLevel
  source: string
  message: string
}

const levelMap: Record<LogLevel | 'all', string> = {
  all: '全部',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG',
}

const levels = ['all', 'info', 'warn', 'error', 'debug'] as const
const MAX_LOG_ENTRIES = 500
const activeLevel = ref<(typeof levels)[number]>('all')
const logData = ref<LogEntry[]>([])
const wsRef = ref<WebSocket | null>(null)
const consoleShell = ref<HTMLElement | null>(null)
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

const scrollToBottom = () => {
  nextTick(() => {
    if (!consoleShell.value) return
    consoleShell.value.scrollTop = consoleShell.value.scrollHeight
  })
}

const parseBackendLog = (raw: string): LogEntry | null => {
  const cleaned = raw.replace(ansiColorPattern, '').replace(/\r/g, '').trim()
  if (!cleaned) return null

  const level = /\b(ERROR|WARN|WARNING|DEBUG|INFO|TRACE)\b/i.test(cleaned)
    ? /\bERROR\b/i.test(cleaned)
      ? 'error'
      : /\b(WARN|WARNING)\b/i.test(cleaned)
        ? 'warn'
        : /\bDEBUG\b/i.test(cleaned)
          ? 'debug'
          : 'info'
    : 'info'

  return {
    id: Date.now() + Math.random(),
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    level,
    source: 'backend',
    message: cleaned,
  }
}

const appendLogEntry = (raw: string) => {
  const parsed = parseBackendLog(raw)
  if (!parsed) return

  // 定长追加：日志是持续流入的，用 [...list, x].slice(-500) 每来一条都复制整个数组，
  // 500 条时就是每秒几十次 O(n) 复制。原地 push + 超长时 splice 更省。
  const list = logData.value
  list.push(parsed)
  if (list.length > MAX_LOG_ENTRIES) {
    list.splice(0, list.length - MAX_LOG_ENTRIES)
  }
  scrollToBottom()
}

const closeSocket = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (wsRef.value) {
    wsRef.value.close()
    wsRef.value = null
  }
}

const connectSocket = () => {
  closeSocket()

  const baseUrl = new URL(getBaseUrl())
  const socketUrl = `${baseUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${baseUrl.host}/atri/socket/logs`
  const socket = new WebSocket(socketUrl)
  wsRef.value = socket

  socket.onopen = () => {
    console.log('Log WebSocket connected')
  }

  socket.onmessage = (event) => {
    const payload = typeof event.data === 'string' ? event.data : String(event.data)
    appendLogEntry(payload)
  }

  socket.onerror = () => {
    console.warn('Log WebSocket error')
  }

  socket.onclose = () => {
    if (wsRef.value) {
      reconnectTimer = setTimeout(() => {
        connectSocket()
      }, 5000)
    }
  }
}

const filteredLogs = computed(() => {
  if (activeLevel.value === 'all') {
    return logData.value
  }
  return logData.value.filter((log) => log.level === activeLevel.value)
})

const stats = computed(() => [
  { label: '总日志', value: logData.value.length },
  { label: 'INFO', value: logData.value.filter((log) => log.level === 'info').length },
  { label: 'WARN', value: logData.value.filter((log) => log.level === 'warn').length },
  { label: 'ERROR', value: logData.value.filter((log) => log.level === 'error').length },
])

onMounted(() => {
  connectSocket()
  scrollToBottom()
})

onBeforeUnmount(() => {
  closeSocket()
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

.page-header h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
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

.panel-meta {
  color: var(--text-color-secondary);
  font-size: 12px;
}

.console-shell {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 440px;
  max-height: 100%;
  height: 62vh;
  overflow: auto;
  /* 控制台背景走中性填充色：既跟随主题，又不会被粉/蓝主题染成大面积色块 */
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
}

.console-line {
  width: 100%;
  padding: 5px 12px;
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

.console-message {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--el-text-color-primary);
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
}

.empty-state {
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
