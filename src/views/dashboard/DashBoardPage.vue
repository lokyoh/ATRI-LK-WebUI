<template>
  <div class="base" :style="{
    height: computedHeight + 'px',
    background: 'var(--el-bg-color-page)',
  }">
    <el-row :gutter="1" class="h-full">
      <el-col :xs="24" :sm="24" :md="8" :lg="6" class="h-full">
        <div class="base-info h-full pr-0 md:pr-0" :style="{ backgroundColor: 'var(--el-bg-color)' }">
          <LeftInfo class="h-full" />
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="16" :lg="12" class="h-full">
        <div class="main-info h-full px-0 md:px-0" :style="{ backgroundColor: 'var(--el-bg-color)' }">
          <MidInfo class="h-full" />
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="24" :lg="6" class="h-full">
        <div class="config-info h-full pl-0 md:pl-0" :style="{ backgroundColor: 'var(--el-bg-color)' }">
          <RightInfo class="h-full" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import LeftInfo from "@/components/dashboard/LeftInfo.vue"
import MidInfo from "@/components/dashboard/MidInfo.vue"
import RightInfo from "@/components/dashboard/RightInfo.vue"
import { getHeaderHeight } from "@/utils/utils"
import { ref, computed, onMounted } from "vue"

const windowHeight = ref(window.innerHeight)
const computedHeight = computed(() => {
  return windowHeight.value - getHeaderHeight() + 70
})

onMounted(() => {
  window.addEventListener("resize", handleResize)
})
function handleResize() {
  windowHeight.value = window.innerHeight
}
</script>

<style lang="scss" scoped>
.base {
  transition: all 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.base-info {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
}

.main-info {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
}

.config-info {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
}

/* Ensure the inner column content stretches and becomes independently scrollable */
.el-col>div {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.base-info>*,
.main-info>*,
.config-info>* {
  flex: 1 1 auto;
  min-height: 0;
  /* allow overflow to work inside flex */
  overflow: auto;
}

/* 响应式设计 */
@media (max-width: 1280px) {
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

  .base-info,
  .main-info,
  .config-info {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}
</style>
