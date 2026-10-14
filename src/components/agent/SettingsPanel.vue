<template>
  <div class="settings-panel">
    <div class="settings-header">
      <div>
        <h4>AI 插件设置</h4>
        <p>配置 Agent 插件参数。</p>
      </div>
      <div class="action-bar">
        <el-button :loading="loading" :disabled="submitting" @click="loadSettings">刷新</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="loading || fields.length === 0"
          @click="saveSettings"
        >
          保存设置
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="settings-content">
      <DictChildren
        v-if="fields.length"
        :children="fields"
        :json-drafts="jsonDrafts"
        :json-errors="jsonErrors"
        @field-change="updateField"
        @json-input="updateJsonDraft"
        @json-blur="parseJsonDraft"
        @field-error="updateFieldError"
      />
      <el-empty v-else-if="!loading" description="暂无可配置项" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import DictChildren from '@/components/plugin/DictChildren.vue'
import type { PluginConfigField, PluginConfigSchema } from '@/types/plugin-config'
import { getRequest, postRequest } from '@/utils/api'
import { message } from '@/utils/message'

interface SettingsResponse {
  suc: boolean
  info: string
  warning?: string
  data?: PluginConfigSchema
}

const prefix = inject<string>('prefix', '/atri/api')
const fields = ref<PluginConfigField[]>([])
const jsonDrafts = ref<Record<string, string>>({})
const jsonErrors = ref<Record<string, string>>({})
const loading = ref(false)
const submitting = ref(false)

onMounted(() => {
  void loadSettings()
})

async function loadSettings() {
  loading.value = true
  try {
    const resp = await getRequest(`${prefix}/agent/get_settings`)
    const payload = resp.data as SettingsResponse
    if (!payload.suc || !payload.data) {
      message.error(payload.info || '获取配置失败')
      return
    }
    if (!Array.isArray(payload.data.fields)) {
      throw new TypeError('Agent 配置响应缺少 fields schema')
    }

    fields.value = payload.data.fields
    jsonDrafts.value = {}
    jsonErrors.value = {}
    initializeJsonDrafts(fields.value)
  } catch (error) {
    console.error('获取 Agent 配置失败:', error)
    message.error(error instanceof Error ? `获取配置失败：${error.message}` : '获取配置失败')
  } finally {
    loading.value = false
  }
}

function initializeJsonDrafts(configFields: PluginConfigField[], parentPath = '') {
  for (const field of configFields) {
    const path = parentPath ? `${parentPath}.${field.key}` : field.key
    if (field.type === 'json' || field.type === 'object-list') {
      jsonDrafts.value[path] = JSON.stringify(field.value, null, 2) ?? ''
    }
    if (field.children) initializeJsonDrafts(field.children, path)
  }
}

function updateField(field: PluginConfigField, value: unknown) {
  field.value = value as PluginConfigField['value']
}

function updateJsonDraft(path: string, value: string) {
  jsonDrafts.value[path] = value
  delete jsonErrors.value[path]
}

function updateFieldError(path: string, error: string | undefined) {
  if (error) {
    jsonErrors.value[path] = error
  } else {
    delete jsonErrors.value[path]
  }
}

function findField(path: string): PluginConfigField | undefined {
  const keys = path.split('.')
  let currentFields = fields.value
  let field: PluginConfigField | undefined
  for (const key of keys) {
    field = currentFields.find((item) => item.key === key)
    if (!field) return undefined
    currentFields = field.children || []
  }
  return field
}

function parseJsonDraft(path: string): boolean {
  const field = findField(path)
  if (!field) return false
  try {
    const value: unknown = JSON.parse(jsonDrafts.value[path] ?? '')
    if (field.type === 'object-list' && !Array.isArray(value)) {
      throw new TypeError('此项必须是 JSON 数组')
    }
    if (
      field.type === 'json' &&
      (value === null || typeof value !== 'object' || Array.isArray(value))
    ) {
      throw new TypeError('此项必须是 JSON 对象')
    }
    field.value = value as PluginConfigField['value']
    delete jsonErrors.value[path]
    return true
  } catch (error) {
    jsonErrors.value[path] = error instanceof Error ? error.message : 'JSON 格式无效'
    return false
  }
}

function collectValues(configFields: PluginConfigField[]): Record<string, unknown> {
  return Object.fromEntries(
    configFields
      .filter((field) => field.editable)
      .map((field) => [
        field.key,
        field.type === 'group'
          ? collectValues(field.children || [])
          : field.value,
      ]),
  )
}

function validateRequired(
  configFields: PluginConfigField[],
  parentEditable = true,
): string | undefined {
  for (const field of configFields) {
    const editable = parentEditable && field.editable
    if (!editable) continue
    if (field.type === 'group') {
      const nestedError = validateRequired(field.children || [], editable)
      if (nestedError) return nestedError
    } else if (
      field.required &&
      (field.value === null ||
        field.value === undefined ||
        (typeof field.value === 'string' && !field.value.trim()))
    ) {
      return `“${field.label}”为必填项`
    }
  }
  return undefined
}

async function saveSettings() {
  for (const path of Object.keys(jsonDrafts.value)) {
    if (!parseJsonDraft(path)) {
      message.error(`请修正 JSON 配置：${path}`)
      return
    }
  }
  const jsonError = Object.values(jsonErrors.value)[0]
  if (jsonError) {
    message.warning(jsonError)
    return
  }
  const validationError = validateRequired(fields.value)
  if (validationError) {
    message.warning(validationError)
    return
  }

  submitting.value = true
  try {
    const resp = await postRequest(`${prefix}/agent/set_settings`, collectValues(fields.value))
    const payload = resp.data as SettingsResponse
    if (payload.suc) {
      if (payload.warning) {
        message.warning(payload.warning)
      } else {
        message.success(payload.info || '设置成功')
      }
    } else {
      message.error(payload.info || '设置失败')
    }
  } catch (error) {
    console.error('保存 Agent 配置失败:', error)
    message.error(error instanceof Error ? `保存失败：${error.message}` : '保存失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.settings-header h4 {
  margin: 0 0 4px;
  font-size: 18px;
}

.settings-header p {
  margin: 0;
  color: var(--text-color-secondary);
}

.action-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.settings-content {
  min-height: 0;
}
</style>
