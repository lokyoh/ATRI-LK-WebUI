<template>
  <div
    class="base"
    :style="{
      height: computedHeight + 'px',
      background: 'linear-gradient(to bottom right, var(--bg-color), var(--bg-color-hover))',
    }"
  >
    <el-row :gutter="12" class="command-grid h-full">
      <el-col :xs="24" :sm="24" :md="8" :span="8" class="left-column h-full">
        <div class="base-info h-full">
          <LeftInfo class="h-full" />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8" :span="8" class="middle-column h-full">
        <div class="middle-info h-full">
          <BotServiceManage />
          <div class="global-info">
            <BotStatusConfig scope="global" />
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8" :span="8" class="right-column h-full">
        <div class="plugin-info h-full">
          <LKPluginConfig />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import LeftInfo from '@/components/command/LeftInfo.vue'
import BotServiceManage from '@/components/command/BotServiceManage.vue'
import BotStatusConfig from '@/components/command/BotStatusConfig.vue'
import LKPluginConfig from '@/components/command/LKPluginConfig.vue'
import { getHeaderHeight } from '@/utils/utils'

const windowHeight = ref(window.innerHeight)

const computedHeight = computed(() => {
  return windowHeight.value - getHeaderHeight()
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

function handleResize() {
  windowHeight.value = window.innerHeight
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.base {
  overflow: auto;
  padding: 0.75rem;
}

.el-row {
  justify-content: stretch;
}

.el-col.left-column {
  flex: 0 1 340px;
  width: auto;
  max-width: none;
}

.el-col.middle-column {
  flex: 0 1 400px;
  width: auto;
  max-width: none;
}

.el-col.right-column {
  flex: 1 1 0;
  width: auto;
  max-width: none;
  min-width: 300px;
}

.base-info,
.plugin-info {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: transparent;
}

.middle-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
  overflow-y: auto;
  padding: 0.125rem;
}

.middle-info .plugin-section {
  flex: 1 0 auto;
}

.global-info {
  min-height: 0;
  flex: 0 0 auto;
}

@media (max-width: 1024px) {
  .base {
    overflow: auto;
    padding: 0.5rem;
  }

  .el-row.h-full,
  .el-col > div,
  .base-info > *,
  .middle-info > *,
  .plugin-info > * {
    height: auto !important;
  }

  .el-row.h-full {
    min-height: 0;
  }

  .el-col.h-full {
    flex: none;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .middle-info {
    overflow: visible;
    padding: 0;
  }

  .base-info,
  .middle-info,
  .global-info,
  .plugin-info {
    margin-bottom: 0.75rem;
  }

  .plugin-info :deep(.lk-plugin-config) {
    min-height: 240px;
  }

  .global-info :deep(.status-config) {
    margin-bottom: 0;
  }
}

@media (max-width: 768px) {
  .el-row {
    flex-direction: column;
  }
}
</style>
