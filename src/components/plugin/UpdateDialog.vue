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
        <div class="settings-grid">
          <div v-for="(config, index) in customConfigs" :key="index" class="setting-card">
            <div class="setting-header">
              <div class="setting-title">
                <div class="setting-label">{{ config.label }}</div>
                <div v-if="config.description" class="setting-description">{{ config.description }}</div>
              </div>
            </div>
            <div class="setting-control">
              <!-- 布尔类型 - 开关 -->
              <MySwitch v-if="config.type === 'boolean'" v-model="(config.value as boolean)" />

              <!-- 字符串类型 - 输入框 -->
              <el-input v-else-if="config.type === 'string'" v-model="(config.value as string)"
                :placeholder="config.placeholder || '请输入'" />

              <!-- 数字类型 - 数字输入框 -->
              <el-input-number v-else-if="config.type === 'number'" v-model="(config.value as number)" :min="config.min"
                :max="config.max" :step="config.step || 1" />

              <!-- 选择类型 - 下拉框 -->
              <el-select v-else-if="config.type === 'select'" v-model="(config.value as string | number)"
                :placeholder="config.placeholder || '请选择'">
                <el-option v-for="option in config.options" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>

              <!-- 多行文本 -->
              <el-input v-else-if="config.type === 'textarea'" v-model="(config.value as string)" type="textarea"
                :rows="config.rows || 3" :placeholder="config.placeholder || '请输入'" />

              <!-- 数组类型 - TagInput -->
              <TagInput v-else-if="config.type === 'array'" v-model="(config.value as string[])"
                :placeholder="config.placeholder || '输入后按回车添加'" />

              <!-- 字典类型 - 展示子配置（支持递归） -->
              <div v-else-if="config.type === 'dict' && config.children" class="dict-children">
                <DictChildren :children="config.children" />
              </div>
            </div>
          </div>
        </div>
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
        <button class="action-button confirm-button" @click="commit">
          <i class="el-icon-check"></i>
          <span>确定</span>
        </button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, inject, watch } from 'vue'
import MySwitch from "@/components/ui/MySwitch.vue"
import TagInput from "@/components/ui/TagInput.vue"
import DictChildren from "@/components/plugin/DictChildren.vue"
import { getRequest, postRequest } from "@/utils/api"
import { message } from "@/utils/message"

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

interface CustomConfig {
  key: string
  label: string
  type: 'boolean' | 'string' | 'number' | 'select' | 'textarea' | 'array' | 'dict'
  value: boolean | string | number | string[] | Record<string, unknown>
  icon?: string
  description?: string
  placeholder?: string
  options?: Array<{ label: string; value: unknown }>
  min?: number
  max?: number
  step?: number
  rows?: number
  children?: DictChildConfig[]
}

interface DictChildConfig {
  key: string
  label: string
  type: 'boolean' | 'string' | 'number' | 'select' | 'textarea' | 'dict'
  value: boolean | string | number | Record<string, unknown>
  description?: string
  placeholder?: string
  options?: Array<{ label: string; value: unknown }>
  min?: number
  max?: number
  step?: number
  rows?: number
  children?: DictChildConfig[]
}

const customConfigs = ref<CustomConfig[]>([])

// 监听 visible 变化，当变为 true 时获取配置
watch(
  () => [modelVisible.value, props.service],
  async ([visible, service]) => {
    if (visible && service) {
      await getCustomConfigs()
    }
  },
  { immediate: true }
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
      const configData = resp.data.data
      customConfigs.value = []

      // 遍历配置数据，生成自定义配置项
      Object.keys(configData).forEach((key) => {
        const value = configData[key]
        const configType = determineConfigType(value)
        const config: CustomConfig = {
          key,
          label: formatLabel(key),
          type: configType,
          value: configType === 'dict' ? {} : value,
        }

        // 如果是字典类型，展开为子配置项
        if (configType === 'dict' && typeof value === 'object' && value !== null) {
          config.children = parseDictToChildren(value as Record<string, unknown>)
        }

        customConfigs.value.push(config)
      })
    } else {
      message?.error(resp.data.info || '获取配置失败')
    }
  } catch (error) {
    console.error('获取自定义配置失败:', error)
    message?.error('获取配置失败')
  }
}

// 根据值确定配置类型
function determineConfigType(value: unknown): CustomConfig['type'] {
  if (typeof value === 'boolean') {
    return 'boolean'
  } else if (typeof value === 'number') {
    return 'number'
  } else if (Array.isArray(value)) {
    return 'array'
  } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // 对象类型转换为字典配置
    return 'dict'
  } else if (typeof value === 'string') {
    // 如果字符串包含换行，可能是多行文本
    if (String(value).includes('\n')) {
      return 'textarea'
    }
    return 'string'
  }
  return 'string'
}

// 将字典对象转换为子配置数组（支持递归）
function parseDictToChildren(dict: Record<string, unknown>): DictChildConfig[] {
  const children: DictChildConfig[] = []

  Object.keys(dict).forEach((key) => {
    const value = dict[key]
    const childType = determineChildType(value)
    const child: DictChildConfig = {
      key,
      label: formatLabel(key),
      type: childType,
      value: childType === 'dict' ? {} : (value as boolean | string | number),
    }

    // 如果子项也是字典，递归解析
    if (childType === 'dict' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      child.children = parseDictToChildren(value as Record<string, unknown>)
    }

    children.push(child)
  })

  return children
}

// 确定子配置项的类型（支持递归检测字典）
function determineChildType(value: unknown): DictChildConfig['type'] {
  if (typeof value === 'boolean') {
    return 'boolean'
  } else if (typeof value === 'number') {
    return 'number'
  } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // 嵌套的字典类型
    return 'dict'
  } else if (typeof value === 'string') {
    if (String(value).includes('\n')) {
      return 'textarea'
    }
    return 'string'
  }
  return 'string'
}

// 格式化标签名称
function formatLabel(key: string): string {
  // 将驼峰命名或下划线命名转换为可读的中文标签
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

// 递归收集字典配置值
function collectDictValue(children: DictChildConfig[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  children.forEach((child) => {
    if (child.type === 'dict' && child.children) {
      // 递归收集嵌套字典
      result[child.key] = collectDictValue(child.children)
    } else {
      result[child.key] = child.value
    }
  })
  return result
}

// 提交更新
async function commit() {
  // 收集所有配置值
  const configs: Record<string, unknown> = {}
  customConfigs.value.forEach((config) => {
    // 如果是 dict 类型，从子配置项构建对象
    if (config.type === 'dict' && config.children) {
      configs[config.key] = collectDictValue(config.children)
    } else {
      configs[config.key] = config.value
    }
  })

  try {
    const resp = await postRequest!(
      `${prefix}/plugin/update_plugin_config`,
      {
        service: props.service,
        configs,
      }
    )
    if (resp.data.suc) {
      if (resp.data.warning) {
        message?.warning(resp.data.warning)
      } else {
        message?.success(resp.data.info)
        emit('close', true)
      }
    } else {
      message?.error(resp.data.info)
    }
  } catch (error) {
    console.error('更新插件失败:', error)
    message?.error('更新插件失败')
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
        background-image: radial-gradient(circle,
            $primary 1px,
            transparent 1px);
        background-size: 20px 20px;
      }

      &.pattern-2 {
        bottom: 0;
        left: 0;
        width: 200px;
        height: 200px;
        background-image: linear-gradient(45deg, $primary 25%, transparent 25%),
          linear-gradient(-45deg, $primary 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, $primary 75%),
          linear-gradient(-45deg, transparent 75%, $primary 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
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

    // 覆盖 Element Plus 默认样式
    :deep(.el-input__inner) {
      border-radius: 8px !important;
      padding: 8px 12px !important;
    }

    :deep(.el-input-number) {
      width: 100% !important;
    }

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
