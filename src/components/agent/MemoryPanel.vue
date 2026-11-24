<template>
  <div class="memory-panel">
    <div class="panel-header">
      <div>
        <h4>长期记忆</h4>
        <p>
          只读浏览：她在什么时间、哪个会话记下了什么，以及哪些已经退出检索。
          向量缺失或换过模型时，记忆检索会漏掉这些条目，可在这里一次性补算。
        </p>
      </div>
      <div class="header-actions">
        <el-tooltip
          v-if="vectorStatus && !vectorStatus.has_model"
          content="还没配置 atri-embedding 使用点的向量模型，补算不可用"
          placement="bottom"
        >
          <span>
            <el-button size="small" disabled>补算向量</el-button>
          </span>
        </el-tooltip>
        <el-button
          v-else
          size="small"
          type="primary"
          plain
          :loading="backfilling"
          :disabled="!vectorStatus || vectorStatus.pending === 0"
          @click="handleBackfill"
        >
          补算向量{{ vectorStatus?.pending ? `（${vectorStatus.pending}）` : '' }}
        </el-button>
        <el-button size="small" :loading="loading" @click="refresh">刷新</el-button>
      </div>
    </div>

    <div class="stats-row">
      <el-tag type="info" effect="plain">共 {{ stats?.total ?? 0 }} 条</el-tag>
      <el-tag v-if="stats?.self" effect="plain">她的经历 {{ stats.self }}</el-tag>
      <el-tag v-if="stats?.consolidated" type="warning" effect="plain">
        已归并 {{ stats.consolidated }}
      </el-tag>
      <el-tag v-if="stats?.expired" type="danger" effect="plain">
        已过期 {{ stats.expired }}
      </el-tag>
      <el-tag v-if="stats?.without_vector" type="info" effect="plain">
        无向量 {{ stats.without_vector }}
      </el-tag>
      <el-tooltip
        v-if="vectorStatus"
        :disabled="!vectorStatus.has_model"
        :content="`向量模型：${vectorStatus.model_id || '(未解析出标识)'}`"
        placement="top"
      >
        <el-tag v-if="vectorStatus.has_model" :type="vectorStatus.pending ? 'warning' : 'success'" effect="plain">
          向量：{{ vectorStatus.pending ? `待补 ${vectorStatus.pending}` : '已齐全' }}
        </el-tag>
        <el-tag v-else type="danger" effect="plain">未配置向量模型</el-tag>
      </el-tooltip>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        size="small"
        clearable
        placeholder="按内容搜索"
        class="filter-keyword"
        @change="refresh"
      />
      <el-select
        v-model="filters.chatId"
        size="small"
        clearable
        placeholder="全部会话"
        class="filter-select"
        @change="refresh"
      >
        <el-option v-for="chat in page?.chats || []" :key="chat" :label="chat" :value="chat" />
      </el-select>
      <el-select
        v-model="filters.subject"
        size="small"
        clearable
        placeholder="全部主体"
        class="filter-select"
        @change="refresh"
      >
        <el-option
          v-for="who in page?.subjects || []"
          :key="who"
          :label="who === 'self' ? '她本人（self）' : who"
          :value="who"
        />
      </el-select>
      <el-date-picker
        v-model="filters.date"
        type="date"
        size="small"
        value-format="YYYY-MM-DD"
        placeholder="按创建日期"
        clearable
        class="filter-date"
        @change="refresh"
      />
      <el-checkbox v-model="filters.includeConsolidated" size="small" @change="refresh">
        含已归并
      </el-checkbox>
      <el-checkbox v-model="filters.includeExpired" size="small" @change="refresh">
        含已过期
      </el-checkbox>
    </div>

    <el-table
      v-loading="loading"
      :data="page?.items || []"
      :row-class-name="rowClass"
      :tooltip-options="overflowTooltipOptions"
      stripe
      empty-text="没有符合条件的记忆"
      class="memory-table"
    >
      <el-table-column label="内容" min-width="320">
        <template #default="{ row }">
          <div class="memory-content">{{ row.content }}</div>
        </template>
      </el-table-column>
      <el-table-column label="归属" width="180">
        <template #default="{ row }">
          <div class="badge-line">
            <el-tag v-if="row.subject === 'self'" type="success" size="small">她的</el-tag>
            <el-tag v-else-if="row.subject" type="info" size="small">{{ row.subject }}</el-tag>
            <span class="muted">{{ row.chat_id || '全局' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="重要度" width="130">
        <template #default="{ row }">
          <div class="metric-line">
            <span class="metric">{{ row.importance.toFixed(3) }}</span>
            <span v-if="row.emotion" class="muted">情绪 {{ row.emotion.toFixed(2) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="记录时间" width="170">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="130">
        <template #default="{ row }">
          <el-tag v-if="row.expired" type="danger" size="small">已过期</el-tag>
          <el-tag v-else-if="row.consolidated" type="warning" size="small">已归并</el-tag>
          <el-tag v-else-if="!row.embedding_model" type="info" size="small">无向量</el-tag>
          <span v-else class="muted">正常</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="panel-footer">
      <span class="muted">共 {{ page?.total || 0 }} 条，当前第 {{ pageIndex }} 页</span>
      <el-pagination
        v-model:current-page="pageIndex"
        :page-size="pageSize"
        :total="page?.total || 0"
        layout="prev, pager, next"
        size="small"
        @current-change="loadPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { getRequest, postRequest } from '@/utils/api'
import { overflowTooltipOptions } from '@/utils/table'
import { message } from '@/utils/message'
import type {
  MemoryPage,
  MemoryStats,
  MemoryVectorBackfill,
  MemoryVectorStatus,
} from '@/types/system'

interface ResultResponse<T> {
  suc: boolean
  code: number
  info: string
  data?: T
}

const prefix = inject<string>('prefix', '/atri/api')
const loading = ref(false)
const page = ref<MemoryPage | null>(null)
const stats = ref<MemoryStats | null>(null)
/** 一次最多补多少条；每条都是一次 embedding 调用，别让按钮变成扣款键 */
const BACKFILL_BATCH = 20
const pageIndex = ref(1)
const pageSize = 25
const vectorStatus = ref<MemoryVectorStatus | null>(null)
const backfilling = ref(false)

const filters = reactive({
  keyword: '',
  chatId: '',
  subject: '',
  date: '',
  includeConsolidated: false,
  includeExpired: true,
})

const rowClass = ({ row }: { row: { consolidated: boolean; expired: boolean } }) =>
  row.consolidated || row.expired ? 'row-inactive' : ''

const formatTime = (stamp: number) => {
  if (!Number.isFinite(stamp) || stamp <= 0) return '—'
  return new Date(stamp * 1000).toLocaleString('zh-CN', { hour12: false })
}

const loadPage = async () => {
  // 分页翻页是独立入口，网络失败要自己兜住，不能留给未处理的 rejection
  try {
    const response = await getRequest(`${prefix}/agent/get_memories`, {
      keyword: filters.keyword,
      chat_id: filters.chatId,
      subject: filters.subject,
      date: filters.date,
      offset: (pageIndex.value - 1) * pageSize,
      limit: pageSize,
      include_consolidated: filters.includeConsolidated,
      include_expired: filters.includeExpired,
    })
    const payload = response.data as ResultResponse<MemoryPage>
    if (payload.suc && payload.data) page.value = payload.data
    else message.error(payload.info || '获取记忆失败')
  } catch (error) {
    console.error('loadPage error', error)
    message.error('获取记忆失败，请检查接口状态')
  }
}

const loadStats = async () => {
  const response = await getRequest(`${prefix}/agent/get_memory_stats`)
  const payload = response.data as ResultResponse<MemoryStats>
  if (payload.suc && payload.data) stats.value = payload.data
}

const loadVectorStatus = async () => {
  try {
    const response = await getRequest(`${prefix}/agent/get_memory_vector_status`)
    const payload = response.data as ResultResponse<MemoryVectorStatus>
    if (payload.suc && payload.data) vectorStatus.value = payload.data
  } catch (error) {
    console.error('loadVectorStatus error', error)
  }
}

const handleBackfill = async () => {
  const pending = vectorStatus.value?.pending ?? 0
  if (!pending) {
    message.info('所有记忆的向量都已齐全')
    return
  }
  try {
    await ElMessageBox.confirm(
      `将为最多 ${Math.min(pending, BACKFILL_BATCH)} 条记忆补算向量，每条生成一次 embedding，会产生 token 费用。确定继续吗？`,
      '补算记忆向量',
      { confirmButtonText: '开始补算', cancelButtonText: '取消', type: 'warning' },
    )
  } catch (error) {
    if (error !== 'cancel') console.error('backfill confirm error', error)
    return
  }

  backfilling.value = true
  try {
    const response = await postRequest(
      `${prefix}/agent/backfill_memory_vectors?limit=${BACKFILL_BATCH}`,
      {},
    )
    const payload = response.data as ResultResponse<MemoryVectorBackfill>
    if (!payload.suc || !payload.data) {
      message.error(payload.info || '补算失败')
      return
    }
    const result = payload.data
    if (result.stopped) {
      message.warning(
        `补算中断：已补 ${result.filled} 条，还剩 ${result.pending} 条（${result.reason || '模型调用失败'}）`,
      )
    } else if (result.pending > 0) {
      message.success(
        `已补 ${result.filled} 条，还剩 ${result.pending} 条，可再点一次继续`,
      )
    } else {
      message.success(`已补 ${result.filled} 条，向量已全部补齐`)
    }
    vectorStatus.value = {
      ...(vectorStatus.value as MemoryVectorStatus),
      pending: result.pending,
    }
    await Promise.all([loadPage(), loadStats()])
  } catch (error) {
    console.error('backfillVectors error', error)
    message.error('补算失败，请检查接口状态')
  } finally {
    backfilling.value = false
  }
}

const refresh = async () => {
  loading.value = true
  pageIndex.value = 1
  try {
    await Promise.all([loadPage(), loadStats(), loadVectorStatus()])
  } catch (error) {
    console.error('loadMemories error', error)
    message.error('获取记忆失败，请检查接口状态')
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>

<style scoped>
.memory-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.header-actions {
  display: flex;
  gap: 8px;
}

.stats-row,
.filter-bar,
.panel-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.panel-footer {
  justify-content: space-between;
}

.filter-keyword {
  width: 220px;
}

.filter-select {
  width: 170px;
}

.filter-date {
  width: 150px;
}

.memory-content {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.5;
}

.badge-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.metric-line {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.memory-panel :deep(.row-inactive) {
  color: var(--el-text-color-placeholder);
}
</style>
