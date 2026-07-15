<template>
  <div class="agent-page">
    <div class="page-header">
      <h2>AI模型设置</h2>
      <div class="tab-nav">
        <button v-for="tab in tabs" :key="tab.key" :class="['tab-item', { active: currentTab === tab.key }]"
          @click="currentTab = tab.key">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SettingsPanel from '@/components/agent/SettingsPanel.vue';
import ModelsPanel from '@/components/agent/ModelsPanel.vue';

const tabs = [
  { key: 'settings', label: '设置' },
  { key: 'models', label: '模型' },
];

const currentTab = ref('settings');
</script>

<style scoped>
.agent-page {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.tab-nav {
  display: flex;
  gap: 12px;
}

.tab-item {
  padding: 8px 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all .2s;
}

.tab-item.active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: var(--el-color-white);
}

.tab-content {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 24px;
}

.tab-panel h3 {
  margin-top: 0;
}

.placeholder-box {
  margin-top: 16px;
  padding: 20px;
  background: var(--el-fill-color-extra-light);
  border: 1px dashed var(--el-border-color-light);
  border-radius: 6px;
  color: var(--el-text-color-secondary);
}
</style>
