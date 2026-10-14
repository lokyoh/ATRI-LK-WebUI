<template>
  <el-dialog v-model="modelVisible" @close="close" class="neko-dialog" width="80%" top="5vh">
    <!-- 对话框背景装饰 -->
    <div class="dialog-background">
      <div class="bg-pattern pattern-1"></div>
      <div class="bg-pattern pattern-2"></div>
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
    </div>

    <!-- 头部区域 -->
    <div class="plugin-header">
      <div class="plugin-info">
        <h2 class="plugin-title">
          {{ props.service }}
        </h2>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="plugin-content">
      <!-- 自定义配置区域 -->
      <div v-if="customConfigs.length > 0" class="settings-container">
        <DictChildren
          :children="customConfigs"
          :json-drafts="jsonDrafts"
          :json-errors="jsonErrors"
          @field-change="updateField"
          @json-input="updateJsonDraft"
          @json-blur="parseJsonDraft"
          @field-error="updateFieldError"
        />
      </div>
      <div v-else class="no-config-tip">
        <i class="el-icon-info"></i>
        <p>该插件暂无自定义配置项</p>
      </div>
    </div>

    <!-- 底部操作区 -->
    <div class="dialog-footer">
      <div class="action-buttons">
        <button class="action-button cancel-button" @click="close">
          <i class="el-icon-close"></i>
          <span>取消</span>
        </button>
        <button class="action-button confirm-button" :disabled="saving" @click="commit">
          <i class="el-icon-check"></i>
          <span>确定</span>
        </button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, inject, watch } from 'vue'
import DictChildren from '@/components/plugin/DictChildren.vue'
import { getRequest, postRequest } from '@/utils/api'
import { message } from '@/utils/message'
import type { PluginConfigField, PluginConfigSchema } from '@/types/plugin-config'

interface Props {
  service?: string
}

const props = withDefaults(defineProps<Props>(), {
  service: '',
})

const emit = defineEmits<{
  (e: 'close', updated?: boolean): void
}>()

// 定义双向绑定的 visible
const modelVisible = defineModel<boolean>('visible', { required: true })

// 注入全局方法
const prefix = inject<string>('prefix') as string

const customConfigs = ref<PluginConfigField[]>([])
const jsonDrafts = ref<Record<string, string>>({})
const jsonErrors = ref<Record<string, string>>({})
const saving = ref(false)

// 监听 visible 变化，当变为 true 时获取配置
watch(
  () => [modelVisible.value, props.service],
  async ([visible, service]) => {
    if (visible && service) {
      await getCustomConfigs()
    }
  },
  { immediate: true },
)

// 关闭对话框
function close() {
  modelVisible.value = false
  emit('close')
}

// 获取自定义配置
async function getCustomConfigs() {
  try {
    const resp = await getRequest!(`${prefix}/plugin/get_plugin_config`, {
      service: props.service,
    })
    if (resp.data.suc && resp.data.data) {
      const schema = resp.data.data as PluginConfigSchema
      if (!Array.isArray(schema.fields)) {
        throw new TypeError('插件配置响应缺少 fields schema')
      }
      customConfigs.value = schema.fields
      jsonDrafts.value = {}
      jsonErrors.value = {}
      initializeJsonDrafts(schema.fields)
    } else {
      message?.error(resp.data.info || '获取配置失败')
    }
  } catch (error) {
    console.error('获取自定义配置失败:', error)
    message?.error(error instanceof Error ? `获取配置失败：${error.message}` : '获取配置失败')
  }
}

function initializeJsonDrafts(fields: PluginConfigField[], parentPath = '') {
  for (const field of fields) {
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
  let fields = customConfigs.value
  let field: PluginConfigField | undefined
  for (const key of keys) {
    field = fields.find((item) => item.key === key)
    if (!field) return undefined
    fields = field.children || []
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
    jsonErrors.value[path] =
      error instanceof Error ? error.message : 'JSON 格式无效'
    return false
  }
}

function collectValues(fields: PluginConfigField[]): Record<string, unknown> {
  return Object.fromEntries(
    fields.map((field) => [
      field.key,
      field.type === 'group' ? collectValues(field.children || []) : field.value,
    ]),
  )
}

function validateRequired(fields: PluginConfigField[], parentEditable = true): string | undefined {
  for (const field of fields) {
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

// 提交更新
async function commit() {
  for (const path of Object.keys(jsonDrafts.value)) {
    if (!parseJsonDraft(path)) {
      message?.error(`请修正 JSON 配置：${path}`)
      return
    }
  }
  const fieldError = Object.values(jsonErrors.value)[0]
  if (fieldError) {
    message?.warning(fieldError)
    return
  }
  const validationError = validateRequired(customConfigs.value)
  if (validationError) {
    message?.warning(validationError)
    return
  }

  saving.value = true
  try {
    const resp = await postRequest!(`${prefix}/plugin/update_plugin_config`, {
      service: props.service,
      configs: collectValues(customConfigs.value),
    })
    if (resp.data.suc) {
      if (resp.data.warning) {
        message?.warning(resp.data.warning)
      } else {
        message?.success(resp.data.info)
        modelVisible.value = false
        emit('close', true)
      }
    } else {
      message?.error(resp.data.info)
    }
  } catch (error) {
    console.error('更新插件失败:', error)
    message?.error(error instanceof Error ? `更新插件失败：${error.message}` : '更新插件失败')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
// 主题颜色变量
$primary: var(--el-color-primary, #409eff);
$primary-light: var(--el-color-primary-light-3, #79bbff);
$primary-lighter: var(--el-color-primary-light-7, #c6e2ff);
$primary-lightest: var(--el-color-primary-light-9, #ecf5ff);
$text-main: var(--el-text-color-primary, #303133);
$text-secondary: var(--el-text-color-secondary, #909399);
$border-color: var(--el-border-color-light, #e4e7ed);
$bg-color: var(--el-bg-color, #ffffff);
$bg-color-overlay: var(--el-bg-color-overlay, #ffffff);

// 动画
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.6;
  }

  50% {
    opacity: 0.9;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes gradientMove {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

// 对话框样式
.neko-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    border: none;
    background: $bg-color-overlay;
    backdrop-filter: blur(10px);
    position: relative;
  }

  :deep(.el-dialog__header) {
    display: none !important; // 强制隐藏默认头部
  }

  :deep(.el-dialog__body) {
    padding: 0;
    position: relative;
    z-index: 1;
  }

  // 背景装饰 - 放在 dialog 层级
  .dialog-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    overflow: hidden;
    opacity: 0.3;
    pointer-events: none;

    .bg-pattern {
      position: absolute;
      opacity: 0.05;

      &.pattern-1 {
        top: 0;
        right: 0;
        width: 300px;
        height: 300px;
        background-image: radial-gradient(circle, $primary 1px, transparent 1px);
        background-size: 20px 20px;
      }

      &.pattern-2 {
        bottom: 0;
        left: 0;
        width: 200px;
        height: 200px;
        background-image:
          linear-gradient(45deg, $primary 25%, transparent 25%),
          linear-gradient(-45deg, $primary 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, $primary 75%),
          linear-gradient(-45deg, transparent 75%, $primary 75%);
        background-size: 20px 20px;
        background-position:
          0 0,
          0 10px,
          10px -10px,
          -10px 0px;
      }
    }

    .bg-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(50px);
      opacity: 0.1;

      &.blob-1 {
        top: -100px;
        right: -50px;
        width: 300px;
        height: 300px;
        background: linear-gradient(135deg, $primary, #8a2be2);
        animation: pulse 10s infinite ease-in-out;
      }

      &.blob-2 {
        bottom: -80px;
        left: -50px;
        width: 250px;
        height: 250px;
        background: linear-gradient(135deg, #00bfff, $primary);
        animation: pulse 8s infinite ease-in-out reverse;
      }
    }
  }

  // 插件头部
  .plugin-header {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: linear-gradient(135deg, $primary-lightest, $bg-color);
    border-bottom: 1px solid $border-color;
    position: relative;
    overflow: hidden;
    z-index: 2;

    .plugin-info {
      flex: 1;

      .plugin-title {
        margin: 0 0 4px;
        font-size: 14px;
        font-weight: 700;
        color: $text-main;
        display: flex;
        align-items: center;

        .plugin-version {
          font-size: 14px;
          font-weight: normal;
          color: $text-secondary;
          margin-left: 10px;
          padding: 2px 8px;
          background: $primary-lightest;
          border-radius: 12px;
        }
      }

      .plugin-meta {
        display: flex;
        align-items: center;
        color: $text-secondary;
        font-size: 14px;

        .plugin-module {
          padding-right: 12px;
          margin-right: 12px;
          border-right: 1px solid $border-color;
        }

        .plugin-author {
          display: flex;
          align-items: center;

          i {
            margin-right: 4px;
            font-size: 14px;
          }
        }
      }
    }
  }

  // 内容区域
  .plugin-content {
    padding: 8px;
    max-height: 60vh;
    overflow-y: auto;
    background: $bg-color;
    border-radius: 0 0 8px 8px;
    position: relative;
    z-index: 2;

    .no-config-tip {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px 12px;
      color: $text-secondary;
      background: linear-gradient(135deg, $primary-lightest 0%, $bg-color 100%);
      border-radius: 6px;
      border: 1px dashed $border-color;

      i {
        font-size: 24px;
        margin-bottom: 8px;
        opacity: 0.4;
        color: $primary;
      }

      p {
        margin: 0;
        font-size: 12px;
        font-weight: 500;
      }
    }

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: $bg-color;
      margin: 10px 0;
    }

    &::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, $primary-lighter, $primary-light);
      border-radius: 4px;

      &:hover {
        background: linear-gradient(180deg, $primary-light, $primary);
      }
    }
  }

  // 设置容器
  .settings-container {
    :deep(.el-input-number),
    :deep(.el-select) {
      width: 100% !important;
    }

    :deep(.el-textarea__inner) {
      border-radius: 8px !important;
      padding: 12px !important;
    }

    // 设置网格
    .settings-grid {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 4px;

      // 确保自定义组件使用正确的样式
      :deep(.my-switch),
      :deep(.tag-input),
      :deep(.el-input),
      :deep(.el-input-number),
      :deep(.el-select) {
        width: 100%;
      }
    }

    // 设置卡片
    .setting-card {
      background: $bg-color-overlay;
      border-radius: 6px;
      padding: 8px;
      border: 1px solid $border-color;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 8px;

      &:hover {
        border-color: $primary-light;
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
      }

      .setting-header {
        display: flex;
        align-items: flex-start;
        gap: 0;

        .setting-title {
          flex: 1;
          min-width: 0;

          .setting-label {
            font-size: 12px;
            font-weight: 600;
            color: $text-main;
            margin-bottom: 4px;
            line-height: 1.4;
          }

          .setting-description {
            font-size: 11px;
            color: $text-secondary;
            line-height: 1.5;
            margin: 0;
          }
        }
      }

      .setting-control {
        margin-top: 4px;
        width: 100%;

        :deep(.el-input),
        :deep(.el-input-number),
        :deep(.el-select) {
          width: 100%;
        }

        // 确保自定义组件宽度正确
        :deep(.my-switch) {
          display: inline-flex;
        }

        :deep(.tag-input) {
          width: 100%;
        }

        // 字典子配置样式
        .dict-children {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 6px;
          background: linear-gradient(135deg, $primary-lightest 0%, $bg-color 100%);
          border-radius: 4px;
          border: 1px dashed $border-color;
        }
      }
    }
  }

  // 底部操作区
  .dialog-footer {
    padding: 8px 12px;
    border-top: 1px solid $border-color;
    background: linear-gradient(135deg, $bg-color, $primary-lightest);
    display: flex;
    justify-content: center;
    position: relative;
    z-index: 2;

    .action-buttons {
      display: flex;
      gap: 8px;
      width: 100%;
      max-width: 280px;
      justify-content: center;

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;

        i {
          margin-right: 4px;
          font-size: 13px;
        }

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }

        &:hover::before {
          left: 100%;
        }

        &.cancel-button {
          background: $bg-color;
          color: $text-secondary;
          border: 2px solid $border-color !important; // 强制显示边框
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

          &:hover {
            background: #f5f7fa;
            color: $text-main;
            border-color: $text-secondary !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
        }

        &.confirm-button {
          background: linear-gradient(135deg, $primary, $primary-light);
          color: white;
          border: 2px solid transparent !important; // 保持透明边框但保留样式
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);

          &:hover {
            background: linear-gradient(135deg, $primary-light, $primary);
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
          }

          &:active {
            transform: translateY(-1px) scale(0.98);
          }
        }
      }
    }
  }

  // 响应式调整
  @media (max-width: 768px) {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 10px auto;
    }

    .plugin-header {
      padding: 20px;
      flex-direction: column;
      align-items: flex-start;

      .plugin-info {
        width: 100%;
      }
    }

    .plugin-content {
      padding: 20px;
    }

    .dialog-footer {
      padding: 20px;

      .action-buttons {
        width: 100%;
        flex-direction: column;
        max-width: none;

        button {
          width: 100%;
          padding: 14px 0;
        }
      }
    }
  }
}
</style>
