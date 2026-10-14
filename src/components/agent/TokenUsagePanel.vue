<template>
  <el-config-provider :locale="zhCn">
    <div class="token-usage-panel">
      <div class="panel-header">
        <h4>Token 用量</h4>
        <el-button size="small" :loading="loading" @click="loadUsage">刷新</el-button>
      </div>

      <section class="summary-section">
        <div class="summary-heading">
          <span>用量统计</span>
          <el-select
            v-model="summaryPeriod"
            size="small"
            class="period-select"
            aria-label="统计周期"
          >
            <el-option
              v-for="period in summaryPeriods"
              :key="period.value"
              :label="period.label"
              :value="period.value"
            />
          </el-select>
        </div>
        <div class="summary-grid">
          <el-card shadow="never">
            <span>输入 Token</span>
            <strong>{{ formatNumber(summary.promptTokens) }}</strong>
          </el-card>
          <el-card shadow="never">
            <span>输出 Token</span>
            <strong>{{ formatNumber(summary.outputTokens) }}</strong>
          </el-card>
          <el-card shadow="never">
            <span>缓存命中 Token</span>
            <strong>{{ formatNumber(summary.cacheHitTokens) }}</strong>
          </el-card>
          <el-card shadow="never">
            <span>总 Token</span>
            <strong>{{ formatNumber(summary.totalTokens) }}</strong>
          </el-card>
        </div>
      </section>

      <el-form class="query-form" :inline="true" @submit.prevent="applyQuery">
        <el-form-item label="模型">
          <el-select
            v-model="queryModel"
            clearable
            placeholder="全部模型"
            class="model-select"
            size="small"
          >
            <el-option v-for="model in modelNames" :key="model" :label="model" :value="model" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件">
          <el-input
            v-model="queryEvent"
            class="event-input"
            clearable
            placeholder="输入事件名称"
            size="small"
            @keyup.enter="applyQuery"
          />
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="queryDateRange"
            class="date-range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY年MM月DD日"
            value-format="YYYY-MM-DD"
            size="small"
          />
        </el-form-item>
        <el-form-item>
          <el-button size="small" type="primary" @click="applyQuery">查询</el-button>
          <el-button size="small" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="pageRecords" stripe empty-text="暂无 Token 用量记录">
        <el-table-column prop="time" label="时间" min-width="180" />
        <el-table-column prop="modelName" label="模型" min-width="150" show-overflow-tooltip />
        <el-table-column prop="event" label="事件" min-width="140" show-overflow-tooltip />
        <el-table-column prop="promptTokens" label="输入 Token" min-width="120" align="right">
          <template #default="{ row }">{{ formatNumber(row.promptTokens) }}</template>
        </el-table-column>
        <el-table-column prop="outputTokens" label="输出 Token" min-width="120" align="right">
          <template #default="{ row }">{{ formatNumber(row.outputTokens) }}</template>
        </el-table-column>
        <el-table-column prop="cacheHitTokens" label="缓存命中 Token" min-width="130" align="right">
          <template #default="{ row }">{{ formatNumber(row.cacheHitTokens) }}</template>
        </el-table-column>
        <el-table-column label="总 Token" min-width="120" align="right">
          <template #default="{ row }">{{
            formatNumber(row.promptTokens + row.outputTokens)
          }}</template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="filteredRecords.length"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredRecords.length"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        small
      />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { getRequest } from '@/utils/api'
import { message } from '@/utils/message'

interface TokenUsageItem {
  name: string
  event: string
  usage: {
    prompt_tokens: number
    output_tokens: number
    cache_hit_tokens: number
  }
  time: string
}

interface TokenUsageResponse {
  suc: boolean
  info: string
  data?: Record<string, TokenUsageItem[]>
}

interface TokenUsageRecord {
  modelName: string
  event: string
  time: string
  promptTokens: number
  outputTokens: number
  cacheHitTokens: number
}

type SummaryPeriod = 'today' | 'week' | 'month' | 'year'

const prefix = inject<string>('prefix', '/atri/api')
const loading = ref(false)
const usageByModel = ref<Record<string, TokenUsageItem[]>>({})
const summaryPeriod = ref<SummaryPeriod>('today')
const summaryPeriods: { label: string; value: SummaryPeriod }[] = [
  { label: '今天', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本年', value: 'year' },
]
const queryModel = ref('')
const queryEvent = ref('')
const queryDateRange = ref<string[]>([])
const appliedModel = ref('')
const appliedEvent = ref('')
const appliedStartDate = ref('')
const appliedEndDate = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const modelNames = computed(() => Object.keys(usageByModel.value).sort())
const allRecords = computed<TokenUsageRecord[]>(() =>
  Object.entries(usageByModel.value)
    .flatMap(([modelName, items]) =>
      items.map((item) => ({
        modelName,
        event: item.event,
        time: item.time,
        promptTokens: item.usage.prompt_tokens,
        outputTokens: item.usage.output_tokens,
        cacheHitTokens: item.usage.cache_hit_tokens,
      })),
    )
    .sort((a, b) => b.time.localeCompare(a.time)),
)
const filteredRecords = computed(() =>
  allRecords.value.filter((record) => {
    const matchesModel = !appliedModel.value || record.modelName === appliedModel.value
    const matchesEvent =
      !appliedEvent.value || record.event.toLowerCase().includes(appliedEvent.value)
    const recordDate = getDateKey(record.time)
    const matchesStartDate = !appliedStartDate.value || recordDate >= appliedStartDate.value
    const matchesEndDate = !appliedEndDate.value || recordDate <= appliedEndDate.value
    return matchesModel && matchesEvent && matchesStartDate && matchesEndDate
  }),
)
const pageRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})
const summaryRecords = computed(() => {
  const { start, end } = getSummaryDateRange(summaryPeriod.value)
  return allRecords.value.filter((record) => {
    const recordDate = getDateKey(record.time)
    return recordDate >= start && recordDate <= end
  })
})
const summary = computed(() =>
  summaryRecords.value.reduce(
    (totals, record) => {
      totals.promptTokens += record.promptTokens
      totals.outputTokens += record.outputTokens
      totals.cacheHitTokens += record.cacheHitTokens
      totals.totalTokens += record.promptTokens + record.outputTokens
      return totals
    },
    { promptTokens: 0, outputTokens: 0, cacheHitTokens: 0, totalTokens: 0 },
  ),
)

const formatNumber = (value: number) => new Intl.NumberFormat().format(value)

const getDateKey = (time: string) => {
  const [, year, month, day] = /^(\d{4})年(\d{1,2})月(\d{1,2})日/.exec(time) || []
  if (!year || !month || !day) return ''
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getSummaryDateRange = (period: SummaryPeriod) => {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (period === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  } else if (period === 'month') {
    start.setDate(1)
  } else if (period === 'year') {
    start.setMonth(0, 1)
  }

  return { start: formatDateKey(start), end: formatDateKey(today) }
}

const loadUsage = async () => {
  loading.value = true
  try {
    const response = await getRequest(`${prefix}/agent/get_token_usage`)
    const payload = response.data as TokenUsageResponse
    if (payload.suc) {
      usageByModel.value = payload.data || {}
    } else {
      message.error(payload.info || '获取 Token 用量失败')
    }
  } catch (error) {
    console.error('loadTokenUsage error', error)
    message.error('获取 Token 用量失败，请检查接口状态')
  } finally {
    loading.value = false
  }
}

const applyQuery = () => {
  appliedModel.value = queryModel.value
  appliedEvent.value = queryEvent.value.trim().toLowerCase()
  appliedStartDate.value = queryDateRange.value[0] || ''
  appliedEndDate.value = queryDateRange.value[1] || ''
  currentPage.value = 1
}

const resetQuery = () => {
  queryModel.value = ''
  queryEvent.value = ''
  queryDateRange.value = []
  applyQuery()
}

onMounted(loadUsage)
</script>

<style scoped>
.token-usage-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
}

.summary-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.summary-grid :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
}

.summary-grid span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.summary-grid strong {
  font-size: 20px;
  color: var(--el-color-primary);
  overflow-wrap: anywhere;
}

.query-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.query-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.query-form :deep(.el-form-item__label) {
  padding-right: 6px;
  font-size: 12px;
}

.query-form :deep(.el-input),
.query-form :deep(.el-select) {
  font-size: 12px;
}

.model-select {
  width: 170px;
}

.event-input {
  width: 150px;
}

.date-range {
  width: 250px;
}

.period-select {
  width: 120px;
}

.pagination {
  justify-content: flex-end;
  font-size: 12px;
}

@media (max-width: 760px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .model-select,
  .event-input,
  .date-range {
    width: 100%;
  }
}
</style>
