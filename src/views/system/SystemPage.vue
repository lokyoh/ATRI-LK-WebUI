<template>
  <div class="system-page flex flex-col">
    <div class="page-heading shrink-0">
      <div>
        <h1>系统维护</h1>
        <p>数据备份与全局定时任务</p>
      </div>
    </div>

    <div class="tab-bar shrink-0">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: currentTab === tab.key }]"
        @click="currentTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 备份 -->
    <section v-if="currentTab === 'backup'" class="panel flex-1 min-h-0">
      <div class="panel-heading">
        <div>
          <h2>数据备份</h2>
          <p>
            自动备份 {{ backup?.auto_enabled ? `每天 ${backup.cron}` : '已关闭' }} ·
            保留 {{ backup?.keep || '不限' }} 份 ·
            {{ backup?.include_db ? '含数据库快照' : '不含数据库' }}
          </p>
          <p v-if="backup" class="muted">输出目录：{{ backup.target_dir }}</p>
        </div>
        <div class="panel-actions">
          <el-button :loading="loading" @click="loadBackups">刷新</el-button>
          <el-button type="primary" :loading="creating" @click="handleCreate">立即备份</el-button>
        </div>
      </div>

      <div class="main-content flex-1 min-h-0">
        <el-table
          v-loading="loading"
          :data="backup?.items || []"
          empty-text="还没有备份"
          stripe
          class="system-table"
        >
          <el-table-column prop="name" label="文件名" min-width="260" show-overflow-tooltip />
          <el-table-column label="大小" width="120" align="right">
            <template #default="{ row }">{{ formatSize(row.size) }}</template>
          </el-table-column>
          <el-table-column label="时间" width="190">
            <template #default="{ row }">{{ formatTime(row.mtime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="110" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="danger" @click="handleDelete(row.name)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <!-- 调度 -->
    <section v-else class="panel flex-1 min-h-0">
      <div class="panel-heading">
        <div>
          <h2>定时任务</h2>
          <p>全部服务的调度器作业；暂停只影响自动触发，立即执行只跑这一次。</p>
        </div>
        <div class="panel-actions">
          <el-input v-model="serviceFilter" clearable placeholder="按服务名筛选" class="filter-input" />
          <el-button :loading="loading" @click="loadJobs">刷新</el-button>
        </div>
      </div>

      <div class="main-content flex-1 min-h-0">
        <el-table
          v-loading="loading"
          :data="filteredJobs"
          :row-class-name="jobRowClass"
          empty-text="没有定时任务"
          stripe
          class="system-table"
        >
          <el-table-column prop="service" label="服务" width="160" show-overflow-tooltip />
          <el-table-column prop="name" label="任务" min-width="200" show-overflow-tooltip />
          <el-table-column prop="trigger" label="触发器" min-width="240" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.paused ? 'info' : 'success'">
                {{ row.paused ? '已暂停' : '运行中' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="下次执行" width="190">
            <template #default="{ row }">{{ row.next_run || '—' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="220" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                link
                type="warning"
                :loading="pending.has(`${row.service}:${row.name}`)"
                @click="toggleJob(row)"
              >
                {{ row.paused ? '恢复' : '暂停' }}
              </el-button>
              <el-button
                size="small"
                link
                type="primary"
                :disabled="pending.has(`${row.service}:${row.name}`)"
                @click="runJob(row)"
              >
                立即执行
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { getRequest, postRequest } from '@/utils/api'
import { message } from '@/utils/message'
import type { BackupOverview, SchedulerJobInfo } from '@/types/system'

interface ResultResponse<T> {
  suc: boolean
  code: number
  info: string
  data?: T
}

const prefix = inject<string>('prefix', '/atri/api')
const tabs = [
  { key: 'backup', label: '备份' },
  { key: 'scheduler', label: '定时任务' },
] as const
const currentTab = ref<'backup' | 'scheduler'>('backup')

const loading = ref(false)
const creating = ref(false)
const backup = ref<BackupOverview | null>(null)
const jobs = ref<SchedulerJobInfo[]>([])
const serviceFilter = ref('')
const pending = ref<Set<string>>(new Set())

const filteredJobs = computed(() => {
  const key = serviceFilter.value.trim().toLowerCase()
  if (!key) return jobs.value
  return jobs.value.filter((job) => job.service.toLowerCase().includes(key))
})

const jobRowClass = ({ row }: { row: SchedulerJobInfo }) => (row.paused ? 'row-paused' : '')

const formatSize = (size: number) => {
  if (!Number.isFinite(size) || size <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = size
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

const formatTime = (mtime: number) => {
  if (!Number.isFinite(mtime) || mtime <= 0) return '—'
  return new Date(mtime * 1000).toLocaleString('zh-CN', { hour12: false })
}

const loadBackups = async () => {
  loading.value = true
  try {
    const response = await getRequest(`${prefix}/backup/get_backups`)
    const payload = response.data as ResultResponse<BackupOverview>
    if (payload.suc && payload.data) backup.value = payload.data
    else message.error(payload.info || '获取备份列表失败')
  } catch (error) {
    console.error('loadBackups error', error)
    message.error('获取备份列表失败，请检查接口状态')
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  creating.value = true
  try {
    const response = await postRequest(`${prefix}/backup/create_backup`, {})
    const payload = response.data as ResultResponse<unknown>
    if (payload.suc) {
      message.success(payload.info || '备份完成')
      await loadBackups()
    } else {
      message.error(payload.info || '备份失败')
    }
  } catch (error) {
    console.error('createBackup error', error)
    message.error('备份失败，请检查接口状态')
  } finally {
    creating.value = false
  }
}

const handleDelete = async (name: string) => {
  try {
    await ElMessageBox.confirm(`确定删除备份 ${name} 吗？删除后无法恢复。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch (error) {
    if (error !== 'cancel') console.error('deleteBackup confirm error', error)
    return
  }
  try {
    const response = await postRequest(
      `${prefix}/backup/delete_backup?name=${encodeURIComponent(name)}`,
    )
    const payload = response.data as ResultResponse<unknown>
    if (payload.suc) {
      message.success(payload.info || '删除成功')
      await loadBackups()
    } else {
      message.error(payload.info || '删除失败')
    }
  } catch (error) {
    console.error('deleteBackup error', error)
    message.error('删除失败，请检查接口状态')
  }
}

const loadJobs = async () => {
  loading.value = true
  try {
    const response = await getRequest(`${prefix}/scheduler/get_scheduler_jobs`)
    const payload = response.data as ResultResponse<SchedulerJobInfo[]>
    if (payload.suc) {
      jobs.value = payload.data || []
    } else {
      message.error(payload.info || '获取定时任务失败')
    }
  } catch (error) {
    console.error('loadJobs error', error)
    message.error('获取定时任务失败，请检查接口状态')
  } finally {
    loading.value = false
  }
}

const markPending = (key: string, on: boolean) => {
  if (on) pending.value.add(key)
  else pending.value.delete(key)
  pending.value = new Set(pending.value)
}

const toggleJob = async (job: SchedulerJobInfo) => {
  const key = `${job.service}:${job.name}`
  markPending(key, true)
  try {
    const endpoint = job.paused ? 'resume_scheduler_job' : 'pause_scheduler_job'
    const response = await postRequest(`${prefix}/scheduler/${endpoint}`, {
      service: job.service,
      name: job.name,
    })
    const payload = response.data as ResultResponse<unknown>
    if (payload.suc) {
      message.success(payload.info || '已切换')
      await loadJobs()
    } else {
      message.error(payload.info || '切换失败')
    }
  } catch (error) {
    console.error('toggleSchedulerJob error', error)
    message.error('切换失败，请检查接口状态')
  } finally {
    markPending(key, false)
  }
}

const runJob = async (job: SchedulerJobInfo) => {
  const key = `${job.service}:${job.name}`
  markPending(key, true)
  try {
    const response = await postRequest(`${prefix}/scheduler/run_scheduler_job`, {
      service: job.service,
      name: job.name,
    })
    const payload = response.data as ResultResponse<unknown>
    if (payload.suc) {
      message.success(payload.info || '已触发')
      await loadJobs()
    } else {
      message.error(payload.info || '触发失败')
    }
  } catch (error) {
    console.error('runSchedulerJob error', error)
    message.error('触发失败，请检查接口状态')
  } finally {
    markPending(key, false)
  }
}

onMounted(() => {
  void loadBackups()
  void loadJobs()
})
</script>

<style lang="scss" scoped>
.system-page {
  position: relative;
  width: 100%;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  gap: 10px;
  padding: 12px 16px 14px;
  background: linear-gradient(125deg, var(--el-bg-color-page) 0%, var(--el-fill-color-light) 100%);
}

.page-heading h1 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  line-height: 1.25;
}

.page-heading p {
  margin: 2px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.tab-bar {
  display: flex;
  gap: 8px;
}

.tab-item {
  padding: 6px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-item.active {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-weight: 600;
}

.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
  box-shadow: 0 8px 24px rgb(15 23 42 / 4%);
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.panel-heading h2 {
  margin: 0 0 2px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 650;
}

.panel-heading p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.panel-heading .muted {
  margin-top: 2px;
  color: var(--el-text-color-placeholder);
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-input {
  width: 180px;
}

.main-content {
  flex: 1;
  min-height: 0;
  padding: 0 14px 14px;
}

.system-table {
  height: 100%;
  background: transparent;

  :deep(.el-table__inner-wrapper) {
    background: transparent;
  }

  :deep(.el-table__header th.el-table__cell) {
    height: 44px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 600;
    background: var(--el-fill-color-light);
  }

  :deep(.row-paused) {
    color: var(--el-text-color-placeholder);
  }
}
</style>
