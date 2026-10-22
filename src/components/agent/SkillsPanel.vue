<template>
  <el-config-provider :locale="zhCn">
    <div class="skills-panel">
      <div class="panel-header">
        <h4>技能</h4>
        <div class="header-actions">
          <el-button size="small" type="primary" @click="openCreateDialog">新建</el-button>
          <el-button size="small" :loading="loading" @click="loadSkills">刷新</el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="skills"
        :row-class-name="rowClassName"
        stripe
        empty-text="暂无技能"
      >
        <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
        <el-table-column
          prop="description"
          label="描述"
          min-width="240"
          show-overflow-tooltip
        />
        <el-table-column label="类型" width="130">
          <template #default="{ row }">
            <el-tag :type="sourceTagType(row.source)" size="small">
              {{ sourceLabel(row.source) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              :loading="isPending(row.name, 'enabled')"
              @change="(value: boolean) => setState(row.name, { enabled: value })"
            />
          </template>
        </el-table-column>
        <el-table-column label="内嵌开关" width="110" align="center">
          <template #default="{ row }">
            <el-tooltip
              content="开启后正文直接嵌入提示词，且不可被 agent 查询"
              placement="top"
            >
              <el-switch
                :model-value="row.embedded"
                :disabled="!row.enabled"
                :loading="isPending(row.name, 'embedded')"
                @change="(value: boolean) => setState(row.name, { embedded: value })"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="正文字数" width="100" align="right">
          <template #default="{ row }">{{ row.content_length }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="openViewDialog(row.name)">
              查看
            </el-button>
            <el-button size="small" link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-tooltip
              v-if="row.source === 'builtin'"
              content="内置技能不可删除，编辑后可恢复"
              placement="top"
            >
              <span class="inline-block">
                <el-button size="small" link disabled>删除</el-button>
              </span>
            </el-tooltip>
            <template v-else>
              <el-button
                v-if="row.source === 'modified'"
                size="small"
                link
                type="warning"
                @click="handleDelete(row, true)"
              >
                恢复内置
              </el-button>
              <el-button
                v-else
                size="small"
                link
                type="danger"
                @click="handleDelete(row, false)"
              >
                删除
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <el-alert
        type="info"
        :closable="false"
        title="启用的非内嵌技能不会自动进入提示词，智能体通过 list_skills 功能按需查询；内嵌技能适合短小的强制规范类内容。"
      />

      <el-dialog
        v-model="editorVisible"
        :title="editorTitle"
        width="720px"
        @closed="handleEditorClosed"
      >
        <el-form :model="editorForm" label-position="top">
          <el-form-item label="名称">
            <el-input
              v-model="editorForm.name"
              :disabled="nameLocked"
              placeholder="技能名（= 文件名），例如 my_skill"
            />
            <div v-if="nameLocked" class="field-hint">
              正在修改内置技能，名称锁定；如需改名请「新建」一个技能。
            </div>
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="editorForm.description"
              maxlength="80"
              show-word-limit
              placeholder="一句话说明这个技能讲什么"
            />
          </el-form-item>
          <el-form-item label="正文（Markdown）">
            <el-input
              v-model="editorForm.content"
              type="textarea"
              :rows="18"
              class="content-textarea"
              placeholder="以使用者视角描述玩法与指令"
            />
            <div class="field-hint">{{ editorForm.content.length }} 字</div>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="editorVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="handleSave">保存</el-button>
          </span>
        </template>
      </el-dialog>

      <el-dialog v-model="viewVisible" :title="`查看：${viewSkill?.name || ''}`" width="720px">
        <div v-if="viewSkill" class="view-body">
          <p class="view-meta">
            <el-tag :type="sourceTagType(viewSkill.source)" size="small">
              {{ sourceLabel(viewSkill.source) }}
            </el-tag>
            <span>描述：{{ viewSkill.description || '—' }}</span>
          </p>
          <pre class="view-content">{{ viewSkill.content }}</pre>
        </div>
      </el-dialog>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ElMessageBox } from 'element-plus'
import type { SkillDetail, SkillInfo, SkillSource } from '@/types/agent'
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
const submitting = ref(false)
const skills = ref<SkillInfo[]>([])
const pendingKeys = ref<Set<string>>(new Set())

const editorVisible = ref(false)
const editorMode = ref<'create' | 'edit'>('create')
const nameLocked = ref(false)
const editorForm = reactive({ name: '', description: '', content: '' })

const viewVisible = ref(false)
const viewSkill = ref<SkillDetail | null>(null)

const editorTitle = computed(() => (editorMode.value === 'create' ? '新建技能' : '编辑技能'))

const SOURCE_LABEL: Record<SkillSource, string> = {
  builtin: '内置',
  user: '用户',
  modified: '内置（已修改）',
}

const sourceLabel = (source: SkillSource) => SOURCE_LABEL[source] || source

const sourceTagType = (source: SkillSource) =>
  source === 'builtin' ? 'info' : source === 'user' ? 'success' : 'warning'

const rowClassName = ({ row }: { row: SkillInfo }) => (row.enabled ? '' : 'row-inactive')

const isPending = (name: string, field: string) => pendingKeys.value.has(`${name}:${field}`)

const markPending = (name: string, field: string, on: boolean) => {
  const key = `${name}:${field}`
  if (on) {
    pendingKeys.value.add(key)
  } else {
    pendingKeys.value.delete(key)
  }
  pendingKeys.value = new Set(pendingKeys.value)
}

const loadSkills = async () => {
  loading.value = true
  try {
    const response = await getRequest(`${prefix}/agent/get_skills`)
    const payload = response.data as ResultResponse<SkillInfo[]>
    if (payload.suc) {
      skills.value = payload.data || []
    } else {
      message.error(payload.info || '获取技能列表失败')
    }
  } catch (error) {
    console.error('loadSkills error', error)
    message.error('获取技能列表失败，请检查接口状态')
  } finally {
    loading.value = false
  }
}

const fetchSkill = async (name: string): Promise<SkillDetail | null> => {
  const response = await getRequest(`${prefix}/agent/get_skill`, { name })
  const payload = response.data as ResultResponse<SkillDetail>
  if (!payload.suc || !payload.data) {
    message.error(payload.info || `获取技能 ${name} 失败`)
    return null
  }
  return payload.data
}

const setState = async (
  name: string,
  state: { enabled?: boolean; embedded?: boolean },
) => {
  const target = skills.value.find((item) => item.name === name)
  if (!target) return
  const previous = { enabled: target.enabled, embedded: target.embedded }
  // 乐观更新
  if (state.enabled !== undefined) {
    target.enabled = state.enabled
    if (!state.enabled) target.embedded = false
  }
  if (state.embedded !== undefined) target.embedded = state.embedded
  const field = state.enabled !== undefined ? 'enabled' : 'embedded'
  markPending(name, field, true)
  try {
    const response = await postRequest(`${prefix}/agent/set_skill_state`, {
      name,
      ...state,
    })
    const payload = response.data as ResultResponse<SkillInfo>
    if (payload.suc && payload.data) {
      Object.assign(target, payload.data)
    } else {
      Object.assign(target, previous)
      message.error(payload.info || '设置失败')
    }
  } catch (error) {
    console.error('setSkillState error', error)
    Object.assign(target, previous)
    message.error('设置失败，请检查接口状态')
  } finally {
    markPending(name, field, false)
  }
}

const openCreateDialog = () => {
  editorMode.value = 'create'
  nameLocked.value = false
  editorForm.name = ''
  editorForm.description = ''
  editorForm.content = ''
  editorVisible.value = true
}

const handleEdit = async (row: SkillInfo) => {
  editorMode.value = 'edit'
  if (row.source === 'builtin') {
    // 编辑内置 = 先落地同名用户配置覆盖内置，再进编辑器
    try {
      await ElMessageBox.confirm('编辑将创建同名用户配置覆盖内置', '提示', {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch (error) {
      if (error !== 'cancel') console.error('edit builtin confirm error', error)
      return
    }
    const detail = await fetchSkill(row.name)
    try {
      const response = await postRequest(`${prefix}/agent/save_skill`, {
        name: row.name,
        description: detail?.description || row.description,
        content: detail?.content || '',
      })
      const payload = response.data as ResultResponse<SkillInfo>
      if (!payload.suc) {
        message.error(payload.info || '创建同名用户配置失败')
        return
      }
      await loadSkills()
    } catch (error) {
      console.error('overrideBuiltin error', error)
      message.error('创建同名用户配置失败')
      return
    }
  }
  const detail = await fetchSkill(row.name)
  if (!detail) return
  // modified 时锁定为内置名：改名会变成"新建用户技能 + 原内置重新出现"，易生歧义
  nameLocked.value = row.source !== 'user'
  editorForm.name = detail.name
  editorForm.description = detail.description
  editorForm.content = detail.content
  editorVisible.value = true
}

const handleEditorClosed = () => {
  submitting.value = false
}

const handleSave = async () => {
  const name = editorForm.name.trim()
  if (!name) {
    message.error('请填写技能名')
    return
  }
  if (!nameLocked.value && name !== editorForm.name) {
    message.error('技能名首尾不能有空白字符')
    return
  }
  submitting.value = true
  try {
    const response = await postRequest(`${prefix}/agent/save_skill`, {
      name,
      description: editorForm.description,
      content: editorForm.content,
    })
    const payload = response.data as ResultResponse<SkillInfo>
    if (payload.suc) {
      message.success('保存成功')
      editorVisible.value = false
      await loadSkills()
    } else {
      message.error(payload.info || '保存失败')
    }
  } catch (error) {
    console.error('saveSkill error', error)
    message.error('保存失败，请检查接口状态')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row: SkillInfo, restoring: boolean) => {
  const text = restoring
    ? `将删除用户配置并恢复内置技能 ${row.name} 的正文，你的修改会丢失。确定继续吗？`
    : `确定删除技能 ${row.name} 吗？`
  try {
    await ElMessageBox.confirm(text, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch (error) {
    if (error !== 'cancel') console.error('deleteSkill confirm error', error)
    return
  }
  try {
    const response = await postRequest(
      `${prefix}/agent/delete_skill?name=${encodeURIComponent(row.name)}`,
    )
    const payload = response.data as ResultResponse<null>
    if (payload.suc) {
      message.success(restoring ? '已恢复内置内容' : '删除成功')
      await loadSkills()
    } else {
      message.error(payload.info || '删除失败')
    }
  } catch (error) {
    console.error('deleteSkill error', error)
    message.error('删除失败，请检查接口状态')
  }
}

const openViewDialog = async (name: string) => {
  const detail = await fetchSkill(name)
  if (!detail) return
  viewSkill.value = detail
  viewVisible.value = true
}

onMounted(loadSkills)
</script>

<style scoped>
.skills-panel {
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

.skills-panel :deep(.row-inactive) {
  color: var(--el-text-color-placeholder);
}

.inline-block {
  display: inline-block;
}

.field-hint {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.content-textarea :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.view-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.view-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.view-content {
  max-height: 60vh;
  margin: 0;
  overflow: auto;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
