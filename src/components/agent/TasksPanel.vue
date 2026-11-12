<template>
  <el-config-provider :locale="zhCn">
    <div class="tasks-panel">
      <div class="panel-header">
        <h4>定时任务</h4>
        <div class="header-actions">
          <el-input
            v-model="keyword"
            size="small"
            placeholder="搜索内容 / 群号 / 会话"
            clearable
            class="search-input"
          />
          <el-button size="small" :loading="loading" @click="loadTasks">刷新</el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredTasks"
        :row-class-name="rowClassName"
        stripe
        empty-text="暂无定时任务"
      >
        <el-table-column prop="when" label="触发" width="110" show-overflow-tooltip />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="kindTagType(row.kind)" size="small">
              {{ row.kind_label || row.kind }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="提醒内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="会话" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mono">{{ row.chat_id || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="bot" width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag v-if="!row.bot_id" type="danger" size="small">无去向</el-tag>
            <span v-else class="mono">{{ row.bot_id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="委托人" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mono">{{ row.user_id || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="150">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              link
              type="danger"
              :loading="pending.has(row.id)"
              @click.stop="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-alert
        type="info"
        :closable="false"
        title="定时任务是「到点唤起她自己思考」的提醒，不是固定文本。这里能看全所有 bot、所有会话的任务；群里的 /agent.任务列表 只能看本机器人的。"
      />

      <el-alert
        v-if="orphanCount > 0"
        type="warning"
        :closable="false"
        :title="`有 ${orphanCount} 个任务没有记录来源 bot，到点时不会执行，且会在下次启动时被清理。`"
      />

      <div class="panel-footer">共 {{ tasks.length }} 个任务<template v-if="keyword">，筛选出 {{ filteredTasks.length }} 个</template></div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ElMessageBox } from 'element-plus'
import type { AgentTaskInfo } from '@/types/agent-task'
import { getRequest, postRequest } from '@/utils/api'
import { message } from '@/utils/message'

interface ResultResponse<T> {
  suc: boolean
  code: number
  info: string
  data?: T
}

const prefix = inject<string>('prefix', '/atri/api')
const loading = ref(false)
const tasks = ref<AgentTaskInfo[]>([])
const keyword = ref('')
const pending = ref<Set<string>>(new Set())

const orphanCount = computed(() => tasks.value.filter((t) => !t.bot_id).length)

const filteredTasks = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return tasks.value
  return tasks.value.filter((t) =>
    [t.message, t.name, t.chat_id, t.bot_id, t.user_id]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(key)),
  )
})

const kindTagType = (kind: string) =>
  kind === 'once' ? 'primary' : kind === 'cron' ? 'success' : 'info'

const rowClassName = ({ row }: { row: AgentTaskInfo }) => (row.bot_id ? '' : 'row-orphan')

const formatTime = (timestamp: number) => {
  if (!timestamp) return '—'
  const d = new Date(timestamp * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const loadTasks = async () => {
  loading.value = true
  try {
    const response = await getRequest(`${prefix}/agent/get_tasks`)
    const payload = response.data as ResultResponse<AgentTaskInfo[]>
    if (payload.suc) {
      tasks.value = payload.data || []
    } else {
      message.error(payload.info || '获取定时任务失败')
    }
  } catch (error) {
    console.error('loadTasks error', error)
    message.error('获取定时任务失败，请检查接口状态')
  } finally {
    loading.value = false
  }
}

const handleCancel = async (row: AgentTaskInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定取消这条定时任务吗？\n「${row.message}」\n${row.when}`,
      '取消定时任务',
      { confirmButtonText: '取消任务', cancelButtonText: '再想想', type: 'warning' },
    )
  } catch (error) {
    if (error !== 'cancel') console.error('cancelTask confirm error', error)
    return
  }
  pending.value.add(row.id)
  pending.value = new Set(pending.value)
  try {
    const response = await postRequest(
      `${prefix}/agent/cancel_task?task_id=${encodeURIComponent(row.id)}`,
    )
    const payload = response.data as ResultResponse<null>
    if (payload.suc) {
      message.success('已取消')
      await loadTasks()
    } else {
      message.error(payload.info || '取消失败')
    }
  } catch (error) {
    console.error('cancelTask error', error)
    message.error('取消失败，请检查接口状态')
  } finally {
    pending.value.delete(row.id)
    pending.value = new Set(pending.value)
  }
}

onMounted(loadTasks)
</script>

<style scoped>
.tasks-panel {
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

.header-actions {
  display: flex;
  gap: 8px;
}

.search-input {
  width: 240px;
}

.tasks-panel :deep(.row-orphan) {
  color: var(--el-color-danger);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.panel-footer {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: right;
}
</style>
