<template>
  <div class="agent-page">
    <div class="page-header">
      <h2>AI模型设置</h2>
      <div class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-item', { active: currentTab === tab.key }]"
          @click="currentTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="tab-content">
      <div v-if="currentTab === 'settings'" class="tab-panel">
        <SettingsPanel />
      </div>

      <div v-if="currentTab === 'models'" class="tab-panel">
        <ModelsPanel />
      </div>

      <div v-if="currentTab === 'usage'" class="tab-panel">
        <TokenUsagePanel />
      </div>

      <div v-if="currentTab === 'function_plugin'" class="tab-panel">
        <FunctionPluginPanel />
      </div>

      <div v-if="currentTab === 'function_calling'" class="tab-panel">
        <FunctionCallingPanel />
      </div>

      <div v-if="currentTab === 'skills'" class="tab-panel">
        <SkillsPanel />
      </div>

      <div v-if="currentTab === 'tasks'" class="tab-panel">
        <TasksPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import SettingsPanel from '@/components/agent/SettingsPanel.vue'
import ModelsPanel from '@/components/agent/ModelsPanel.vue'
import TokenUsagePanel from '@/components/agent/TokenUsagePanel.vue'
import FunctionCallingPanel from '@/components/agent/FunctionCallingPanel.vue'
import FunctionPluginPanel from '@/components/agent/FunctionPluginPanel.vue'
import SkillsPanel from '@/components/agent/SkillsPanel.vue'
import TasksPanel from '@/components/agent/TasksPanel.vue'
import { getLoading } from '@/utils/loading'

const tabs = [
  { key: 'settings', label: '设置' },
  { key: 'models', label: '模型' },
  { key: 'usage', label: 'Token 用量' },
  { key: 'function_plugin', label: '功能插件' },
  { key: 'function_calling', label: '功能调用' },
  { key: 'skills', label: '技能' },
  { key: 'tasks', label: '定时任务' },
]

const currentTab = ref('settings')
let loadingInstance: ReturnType<typeof getLoading> | null = null

const startContentLoading = () => {
  loadingInstance?.close()
  loadingInstance = getLoading('.tab-content')
}

const stopContentLoading = () => {
  loadingInstance?.close()
  loadingInstance = null
}

watch(currentTab, () => {
  startContentLoading()
  setTimeout(() => {
    stopContentLoading()
  }, 500)
})

onMounted(() => {
  startContentLoading()
  setTimeout(() => {
    stopContentLoading()
  }, 600)
})
</script>

<style scoped>
.agent-page {
  padding: 24px 28px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  background:
    radial-gradient(ellipse at 92% 0%, var(--el-color-primary-light-9) 0, transparent 30%),
    var(--el-bg-color-page);
}

.page-header {
  display: grid;
  gap: 18px;
  margin-bottom: 18px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.25;
  color: var(--el-text-color-primary);
}

.tab-nav {
  display: flex;
  gap: 4px;
  width: fit-content;
  max-width: 100%;
  padding: 5px;
  overflow-x: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-light);
}

.tab-item {
  flex: 0 0 auto;
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.tab-item:hover:not(.active) {
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
}

.tab-item.active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: 0 1px 4px rgb(15 23 42 / 10%);
}

.tab-content {
  min-height: calc(100% - 112px);
  padding: 22px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
  box-shadow: 0 8px 24px rgb(15 23 42 / 4%);
}

.tab-panel h3 {
  margin-top: 0;
}

.agent-page :deep(.el-table) {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-header-bg-color: var(--el-fill-color-light);
  --el-table-row-hover-bg-color: var(--el-fill-color-light);

  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.agent-page :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.agent-page :deep(.el-table th.el-table__cell) {
  height: 44px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
}

.agent-page :deep(.el-table td.el-table__cell) {
  padding: 12px 0;
}

.agent-page :deep(.el-table th.el-table__cell),
.agent-page :deep(.el-table td.el-table__cell) {
  border-right: 0;
}

.agent-page :deep(.el-table .cell) {
  line-height: 1.5;
}

.placeholder-box {
  margin-top: 16px;
  padding: 20px;
  background: var(--el-fill-color-extra-light);
  border: 1px dashed var(--el-border-color-light);
  border-radius: 6px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .agent-page {
    padding: 16px;
  }

  .tab-content {
    min-height: 0;
    padding: 14px;
    border-radius: 12px;
  }
}
</style>
