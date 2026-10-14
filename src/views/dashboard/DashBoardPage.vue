<template>
  <div
    class="base"
    :style="{ background: 'var(--el-bg-color-page)' }"
  >
    <el-row :gutter="16" class="dashboard-grid h-full">
      <el-col :xs="24" :sm="24" :md="8" :lg="6" class="h-full">
        <div class="dashboard-panel base-info h-full">
          <LeftInfo class="h-full" />
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="16" :lg="12" class="h-full">
        <div class="dashboard-panel main-info h-full">
          <MidInfo class="h-full" />
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="24" :lg="6" class="h-full">
        <div class="dashboard-panel config-info h-full">
          <RightInfo class="h-full" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import LeftInfo from '@/components/dashboard/LeftInfo.vue'
import MidInfo from '@/components/dashboard/MidInfo.vue'
import RightInfo from '@/components/dashboard/RightInfo.vue'
</script>

<style lang="scss" scoped>
.base {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
}

.dashboard-panel,
.base-info,
.main-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.dashboard-panel {
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.dashboard-panel:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color-light));
}

.el-col > div {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.base-info > *,
.main-info > *,
.config-info > * {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

/* 响应式设计 */
@media (max-width: 1280px) {
  .base {
    height: auto;
    min-height: 100%;
    overflow: auto;
    padding: 0.625rem;
  }

  .dashboard-grid {
    height: auto;
  }

  .el-col {
    &:nth-child(1) {
      width: 100%;
      padding-right: 0;
    }

    &:nth-child(2) {
      width: 100%;
      padding-left: 0;
      padding-right: 0;
    }

    &:nth-child(3) {
      width: 100%;
      padding-left: 0;
    }
  }
}

@media (max-width: 768px) {
  .el-row {
    display: flex;
    flex-direction: column;
  }

  .el-col {
    width: 100%;
    height: auto;
    padding: 0.5rem 0;

    &:nth-child(1),
    &:nth-child(2),
    &:nth-child(3) {
      height: auto;
    }
  }

  .base {
    padding: 0.5rem;
  }

  .dashboard-panel {
    border-radius: 0.875rem;
  }
}

@media (max-width: 1280px) {
  .el-row.h-full,
  .el-col.h-full,
  .el-col > div,
  .base-info > *,
  .main-info > *,
  .config-info > * {
    height: auto !important;
  }

  .el-row.h-full {
    min-height: 0;
  }

  .el-col.h-full {
    flex: none;
  }

  .dashboard-panel {
    min-height: 18rem;
  }
}
</style>
