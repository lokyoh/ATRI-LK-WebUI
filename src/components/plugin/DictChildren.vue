<template>
  <div class="dict-children-container">
    <div v-for="(child, index) in childConfigs" :key="index" class="dict-child-wrapper">
      <!-- 非字典类型：直接展示控件 -->
      <template v-if="child.type !== 'dict'">
        <div class="dict-child-label">{{ child.label }}</div>
        <div class="dict-child-control">
          <MySwitch v-if="child.type === 'boolean'" v-model="(child.value as boolean)" />
          <el-input v-else-if="child.type === 'string'" v-model="(child.value as string)"
            :placeholder="child.placeholder || '请输入'" />
          <el-input-number v-else-if="child.type === 'number'" v-model="(child.value as number)" :min="child.min"
            :max="child.max" :step="child.step || 1" />
          <el-input v-else-if="child.type === 'textarea'" v-model="(child.value as string)" type="textarea"
            :rows="child.rows || 2" :placeholder="child.placeholder || '请输入'" />
        </div>
      </template>

      <!-- 字典类型：递归展示 -->
      <template v-else>
        <div class="dict-child-label nested">{{ child.label }}</div>
        <div class="dict-nested-level">
          <DictChildren :children="child.children || []" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import MySwitch from "@/components/ui/MySwitch.vue"

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

interface Props {
  children: DictChildConfig[]
}

const props = defineProps<Props>()

const childConfigs = ref<DictChildConfig[]>([])

// 监听 props 变化
watch(
  () => props.children,
  (newVal) => {
    childConfigs.value = newVal
  },
  { immediate: true }
)
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

// 递归子配置容器
.dict-children-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;

  .dict-child-wrapper {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    align-items: center;
    gap: 8px;
    padding: 6px;
    background: $bg-color-overlay;
    border-radius: 4px;
    border: 1px solid $border-color;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      border-color: $primary-light;
      background: $primary-lightest;
    }

    .dict-child-label {
      font-size: 12px;
      font-weight: 500;
      color: $text-main;
      justify-self: start;

      &.nested {
        font-weight: 600;
        color: $primary;
      }
    }

    .dict-child-control {
      width: 100%;

      :deep(.el-input),
      :deep(.el-input-number) {
        width: 100%;
      }

      :deep(.my-switch) {
        display: inline-flex;
      }
    }

    // 嵌套层级
    .dict-nested-level {
      grid-column: 1 / -1;
      margin-left: 8px;
      padding: 6px;
      background: linear-gradient(135deg, $primary-lightest 0%, $bg-color 100%);
      border-radius: 4px;
      border-left: 2px solid $primary;
    }
  }
}
</style>
