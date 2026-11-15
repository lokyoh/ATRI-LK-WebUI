<template>
  <div class="schedule-panel">
    <div class="panel-header">
      <h4>日程</h4>
      <div class="header-actions">
        <el-date-picker
          v-model="date"
          type="date"
          size="small"
          value-format="YYYY-MM-DD"
          :clearable="false"
          class="date-picker"
        />
        <el-button size="small" :loading="loading" @click="load">刷新</el-button>
        <el-button size="small" :disabled="!entries.length" @click="clear">清空填入</el-button>
        <el-button size="small" type="primary" plain @click="openEditor">添加安排</el-button>
      </div>
    </div>

    <el-alert v-if="location" type="info" :closable="false" class="location-alert">
      <template #title>此刻</template>
      {{ location.text }}
    </el-alert>

    <el-table
      v-loading="loading"
      :data="rows"
      row-key="key"
      empty-text="这天还没有安排"
      stripe
    >
      <el-table-column label="时间" width="196">
        <template #default="{ row }">
          <div class="time-cell">
            <span class="time">{{ shownStart(row) }} – {{ row.end }}</span>
            <el-tag v-if="crossesMidnight(row)" size="small" type="warning">跨天</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="活动" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.activity || '（无描述）' }}
        </template>
      </el-table-column>
      <el-table-column label="地点" width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.kind === 'travel'" class="muted">
            {{ row.from_place }} → {{ row.to_place }}
          </span>
          <span v-else>{{ row.place || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="来源" width="120">
        <template #default="{ row }">
          <el-tag :type="sourceTagType(row)" size="small">{{ sourceLabel(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="outfit" label="此刻穿搭" width="140" show-overflow-tooltip>
        <template #default>{{ outfit.current }}</template>
      </el-table-column>
      <el-table-column label="操作" width="76" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="canRemove(row)"
            size="small"
            link
            type="danger"
            :loading="removing === row.key"
            @click="removeEntry(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editorVisible" title="添加安排" width="760px">
      <el-form label-width="86px" label-position="left">
        <el-form-item label="日期">
          <span class="mono">{{ date }}</span>
        </el-form-item>
        <el-form-item
          v-for="(item, index) in drafts"
          :key="index"
          :label="index === 0 ? '时段' : ''"
        >
          <div class="draft-row">
            <el-time-picker
              v-model="item.start"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="开始"
              class="time-input"
            />
            <span class="dash">–</span>
            <el-time-picker
              v-model="item.end"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="结束"
              class="time-input"
            />
            <el-select v-model="item.kind" class="kind-input">
              <el-option label="待在某地" value="stay" />
              <el-option label="在路上" value="travel" />
            </el-select>
            <el-input
              v-if="item.kind === 'stay'"
              v-model="item.place"
              placeholder="地点"
              class="place-input"
            />
            <template v-else>
              <el-input v-model="item.from" placeholder="从" class="place-input" />
              <el-input v-model="item.to" placeholder="到" class="place-input" />
            </template>
            <el-input v-model="item.activity" placeholder="做什么" class="activity-input" />
            <el-button
              v-if="drafts.length > 1"
              link
              type="danger"
              :icon="Delete"
              @click="drafts.splice(index, 1)"
            />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button size="small" plain @click="addDraft">再加一条</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">写入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { getRequest, postRequest } from '@/utils/api'
import { message } from '@/utils/message'
import type {
  LocationInfo,
  OutfitInfo,
  ScheduleEntryInfo,
  ScheduleEntryInput,
} from '@/types/agent-life'

const prefix = inject<string>('prefix')
const formatDate = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const date = ref(formatDate(new Date()))
const loading = ref(false)
const saving = ref(false)
const editorVisible = ref(false)
const entries = ref<ScheduleEntryInfo[]>([])
const location = ref<LocationInfo | null>(null)
const outfit = ref<OutfitInfo | null>(null)

interface Draft extends ScheduleEntryInput {
  __key: number
}

const drafts = ref<Draft[]>([])
let draftSeed = 0

interface Row extends ScheduleEntryInfo {
  key: string
}

const rows = computed<Row[]>(() =>
  entries.value.map((entry, index) => ({ ...entry, key: `${index}-${entry.start}` })),
)
const crossesMidnight = (row: ScheduleEntryInfo) => row.end <= shownStart(row)
const removing = ref('')
const canRemove = (row: Row) => row.source === 'fill' || row.source === 'go'

async function removeEntry(row: Row) {
  removing.value = row.key
  try {
    const response = await postRequest(`${prefix}/agent/remove_life_plan_entry`, {
      date: date.value,
      start: shownStart(row),
      end: row.end,
      activity: row.activity,
    })
    if (response.data.suc) {
      apply(response.data.data)
      message?.success(response.data.info || '已删除')
    } else {
      message?.error(response.data.info)
    }
  } catch (error) {
    console.error('删除安排失败:', error)
    message?.error('删除安排失败')
  } finally {
    removing.value = ''
  }
}
const isCarried = (row: ScheduleEntryInfo) =>
  row.note === 'carried' || Boolean(row.origin_start && row.origin_start !== row.start)
// 遗留条目的 start 只是当天那一段的 00:00，活动其实从前一天就开始了。
const shownStart = (row: ScheduleEntryInfo) => row.origin_start || row.start

const sourceLabel = (row: ScheduleEntryInfo) => {
  if (isCarried(row)) return '昨日遗留'
  if (row.source === 'routine') return '固定作息'
  if (row.source === 'go') return '临时前往'
  if (row.note === 'auto') return '自动补路程'
  return '填入'
}

const sourceTagType = (row: ScheduleEntryInfo) => {
  if (isCarried(row)) return 'warning'
  if (row.source === 'routine') return 'info'
  if (row.source === 'go') return 'warning'
  return 'success'
}

function apply(data: { schedule: ScheduleEntryInfo[]; location: LocationInfo; outfit: OutfitInfo }) {
  entries.value = data.schedule ?? []
  location.value = data.location ?? null
  outfit.value = data.outfit ?? null
}

async function load() {
  loading.value = true
  try {
    const response = await getRequest(`${prefix}/agent/get_life`, { date: date.value })
    if (response.data.suc) apply(response.data.data)
    else message?.error(response.data.info)
  } catch (error) {
    console.error('读取日程失败:', error)
    message?.error('读取日程失败')
  } finally {
    loading.value = false
  }
}

function addDraft() {
  drafts.value.push({ __key: ++draftSeed, start: '', end: '', kind: 'stay', activity: '' })
}

function openEditor() {
  drafts.value = []
  addDraft()
  editorVisible.value = true
}

async function submit() {
  const payload = drafts.value
    .filter((item) => item.start && item.end && (item.activity || item.kind === 'travel'))
    .map((item) => ({
      start: item.start,
      end: item.end,
      kind: item.kind ?? 'stay',
      activity: item.activity || (item.kind === 'travel' ? '路上' : ''),
      place: item.kind === 'stay' ? item.place || '' : '',
      from: item.kind === 'travel' ? item.from || '' : '',
      to: item.kind === 'travel' ? item.to || '' : '',
    }))
  if (!payload.length) {
    message?.warning('至少填一条完整的时段')
    return
  }
  saving.value = true
  try {
    const response = await postRequest(`${prefix}/agent/fill_life_plan`, {
      date: date.value,
      entries: payload,
    })
    if (response.data.suc) {
      apply(response.data.data)
      message?.success(response.data.info || '已写入日程')
      editorVisible.value = false
    } else {
      message?.error(response.data.info)
    }
  } catch (error) {
    console.error('写入日程失败:', error)
    message?.error('写入日程失败')
  } finally {
    saving.value = false
  }
}

async function clear() {
  try {
    const response = await postRequest(`${prefix}/agent/clear_life_plan`, { date: date.value })
    if (response.data.suc) {
      apply(response.data.data)
      message?.success(response.data.info || '已清空')
    } else {
      message?.error(response.data.info)
    }
  } catch (error) {
    console.error('清空日程失败:', error)
    message?.error('清空日程失败')
  }
}

watch(date, load)
load()

defineExpose({ rows, outfit })
</script>

<style scoped>
.schedule-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-picker {
  width: 140px;
}

.location-alert {
  padding: 8px 12px;
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time {
  font-family: var(--el-font-family-mono, monospace);
  white-space: nowrap;
}

.muted {
  color: var(--el-text-color-secondary);
}

.mono {
  font-family: var(--el-font-family-mono, monospace);
}

.draft-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.time-input {
  width: 100px;
  flex: 0 0 100px;
}

.kind-input {
  width: 120px;
  flex: 0 0 120px;
}

.place-input {
  width: 100px;
  flex: 0 0 100px;
}

.activity-input {
  flex: 1;
  min-width: 100px;
}

.dash {
  color: var(--el-text-color-secondary);
}
</style>
