<template>
  <div class="telemetry-panel">
    <div class="panel-header">
      <div>
        <h4>行为埋点</h4>
        <p>按天落盘的 jsonl 聚合结果：她做了什么、被拒的理由、哪一步在拖时间。</p>
      </div>
      <div class="header-actions">
        <el-button size="small" :loading="loading" @click="load">刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="summary && !summary.files.length"
      type="info"
      :closable="false"
      show-icon
      title="还没有埋点数据：先在 Agent 设置里打开「行为数据收集」。"
    />
    <el-alert
      v-else-if="summary?.truncated"
      type="warning"
      :closable="false"
      show-icon
      :title="`数据量超出单次统计上限，只读了最近 ${summary.rows} 行`"
    />

    <div v-if="summary && summary.files.length" class="summary-line">
      <span class="muted">数据文件：{{ summary.files.join(' / ') }}</span>
      <span class="muted">共 {{ summary.rows }} 行</span>
    </div>

    <div class="turn-stats">
      <div class="stat-card">
        <span class="stat-label">对话轮次</span>
        <strong class="stat-value">{{ summary?.turn.turns ?? 0 }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">失败轮次</span>
        <strong class="stat-value">{{ summary?.turn.failed ?? 0 }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">平均思考轮数</span>
        <strong class="stat-value">{{ summary?.turn.avg_rounds ?? 0 }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">平均耗时</span>
        <strong class="stat-value">{{ summary?.turn.avg_duration ?? 0 }} s</strong>
      </div>
    </div>

    <div class="grid">
      <section class="chart-card">
        <h5>事件分布</h5>
        <template v-if="summary?.events.length">
          <div v-for="item in summary.events" :key="item.event" class="bar-row">
            <span class="bar-label">{{ item.event }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: barWidth(item.count, eventMax) }"></div>
            </div>
            <span class="bar-count">{{ item.count }}</span>
          </div>
        </template>
        <div v-else class="muted">暂无事件</div>
      </section>

      <section class="chart-card">
        <h5>功能调用次数</h5>
        <template v-if="summary?.tool.length">
          <div v-for="item in summary.tool.slice(0, 15)" :key="item.key" class="bar-row">
            <span class="bar-label">{{ item.key || '(未命名)' }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: barWidth(item.count, toolMax) }"></div>
            </div>
            <span class="bar-count">{{ item.count }}</span>
          </div>
        </template>
        <div v-else class="muted">暂无调用</div>
      </section>

      <section class="chart-card">
        <h5>插话判断标签</h5>
        <template v-if="summary?.judge_tags.length">
          <div v-for="item in summary.judge_tags" :key="item.key" class="bar-row">
            <span class="bar-label">{{ item.key || '(无标签)' }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: barWidth(item.count, tagMax) }"></div>
            </div>
            <span class="bar-count">{{ item.count }}</span>
          </div>
        </template>
        <div v-else class="muted">暂无判断记录</div>
      </section>

      <section class="chart-card">
        <h5>主动开口被拒原因</h5>
        <template v-if="summary?.initiative_start.length">
          <div v-for="item in summary.initiative_start" :key="item.key" class="bar-row">
            <span class="bar-label">{{ item.key }}</span>
            <div class="bar-track">
              <div class="bar-fill bar-fill--warn" :style="{ width: barWidth(item.count, startMax) }"></div>
            </div>
            <span class="bar-count">{{ item.count }}</span>
          </div>
        </template>
        <div v-else class="muted">暂无主动开口记录</div>
      </section>
    </div>

    <div class="raw-block">
      <div class="raw-header">
        <el-date-picker
          v-model="rawDate"
          type="date"
          size="small"
          value-format="YYYY-MM-DD"
          placeholder="选一天（留空取最近）"
          clearable
          class="raw-date"
          @change="loadRaw"
        />
        <el-button size="small" :loading="rawLoading" @click="loadRaw">回放原始记录</el-button>
        <span class="muted">最多 200 行</span>
      </div>
      <pre v-if="rawLines.length" class="raw-content">{{ rawText }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { getRequest } from '@/utils/api'
import { message } from '@/utils/message'
import type { TelemetrySummary } from '@/types/system'

interface ResultResponse<T> {
  suc: boolean
  code: number
  info: string
  data?: T
}

const prefix = inject<string>('prefix', '/atri/api')
const loading = ref(false)
const summary = ref<TelemetrySummary | null>(null)
const rawLoading = ref(false)
const rawDate = ref('')
const rawLines = ref<Array<Record<string, unknown>>>([])

const rawText = computed(() =>
  rawLines.value
    .map((row) => {
      const stamp = typeof row.ts === 'number' ? new Date(row.ts * 1000).toLocaleTimeString('zh-CN', { hour12: false }) : '—'
      const rest = { ...row }
      delete rest.ts
      return `${stamp} ${JSON.stringify(rest, null, 0)}`
    })
    .join('\n'),
)

const maxOf = (list: Array<{ count: number }> | undefined) =>
  list?.length ? Math.max(...list.map((item) => item.count)) : 0

const eventMax = computed(() => maxOf(summary.value?.events))
const toolMax = computed(() => maxOf(summary.value?.tool))
const tagMax = computed(() => maxOf(summary.value?.judge_tags))
const startMax = computed(() => maxOf(summary.value?.initiative_start))

const barWidth = (count: number, max: number) =>
  max > 0 ? `${Math.max(2, Math.round((count / max) * 100))}%` : '0%'

const load = async () => {
  loading.value = true
  try {
    const response = await getRequest(`${prefix}/agent/get_telemetry`)
    const payload = response.data as ResultResponse<TelemetrySummary>
    if (payload.suc && payload.data) summary.value = payload.data
    else message.error(payload.info || '获取埋点统计失败')
  } catch (error) {
    console.error('loadTelemetry error', error)
    message.error('获取埋点统计失败，请检查接口状态')
  } finally {
    loading.value = false
  }
}

const loadRaw = async () => {
  rawLoading.value = true
  try {
    const response = await getRequest(`${prefix}/agent/get_telemetry_raw`, { date: rawDate.value })
    const payload = response.data as ResultResponse<Array<Record<string, unknown>>>
    if (payload.suc) rawLines.value = payload.data || []
    else message.error(payload.info || '读取原始埋点失败')
  } catch (error) {
    console.error('loadTelemetryRaw error', error)
    message.error('读取原始埋点失败，请检查接口状态')
  } finally {
    rawLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.telemetry-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-header h4 {
  margin: 0 0 4px;
  font-size: 18px;
}

.panel-header p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 12px;
}

.summary-line {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.turn-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--bg-color);
}

.stat-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.stat-value {
  color: var(--el-color-primary);
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.chart-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--bg-color);
}

.chart-card h5 {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
}

.bar-row {
  display: grid;
  grid-template-columns: 150px 1fr 52px;
  align-items: center;
  gap: 8px;
}

.bar-label {
  overflow: hidden;
  color: var(--el-text-color-regular);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-track {
  height: 8px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  background: var(--el-color-primary);
  transition: width 0.3s ease;
}

.bar-fill--warn {
  background: var(--el-color-warning);
}

.bar-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.raw-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--bg-color);
}

.raw-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.raw-date {
  width: 190px;
}

.raw-content {
  max-height: 320px;
  margin: 0;
  overflow: auto;
  padding: 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
