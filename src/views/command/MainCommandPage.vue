<template>
  <div class="base" :style="{
    height: computedHeight + 'px',
    background:
      'linear-gradient(to bottom right, var(--bg-color), var(--bg-color-hover))',
  }">
    <el-row :gutter="1" class="h-full">
      <el-col :xs="24" :sm="24" :md="8" :lg="6" class="h-full">
        <div class="base-info h-full pr-0 md:pr-0">
          <LeftInfo class="h-full" />
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="16" :lg="12" class="h-full">
        <div class="main-info h-full px-0 md:px-0">
          <MidInfo class="h-full" />
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="24" :lg="6" class="h-full">
        <div class="config-info h-full pl-0 md:pl-0">
          <RightInfo class="h-full" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import LeftInfo from "@/components/command/LeftInfo.vue"
import MidInfo from "@/components/command/MidInfo.vue"
import RightInfo from "@/components/command/RightInfo.vue"
import { getHeaderHeight } from "@/utils/utils"

const windowHeight = ref(window.innerHeight)

const computedHeight = computed(() => {
  return windowHeight.value - getHeaderHeight()
})

onMounted(() => {
  window.addEventListener("resize", handleResize)
})

function handleResize() {
  windowHeight.value = window.innerHeight
}

onUnmounted(() => {
  window.removeEventListener("resize", handleResize)
})
</script>

<style scoped>
.base {
  transition: all 0.3s;
  overflow: auto;
}

.base-info {
  border-radius: 0.5rem;
  background-color: color-mix(in srgb, var(--bg-color-secondary) 70%, transparent);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid var(--border-color-light);
}

.main-info {
  border-radius: 0.5rem;
  background-color: color-mix(in srgb, var(--bg-color-secondary) 70%, transparent);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid var(--border-color-light);
}

.config-info {
  border-radius: 0.5rem;
  background-color: color-mix(in srgb, var(--bg-color-secondary) 70%, transparent);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid var(--border-color-light);
}

/* 自定义二次元风格阴影 */
.shadow-cute {
  box-shadow: 0 4px 15px var(--el-box-shadow-light),
    0 2px 5px var(--el-box-shadow-lighter);
}

/* 响应式设计 */
@media (max-width: 1024px) {

  .el-col:nth-child(1),
  .el-col:nth-child(2),
  .el-col:nth-child(3) {
    height: auto;
  }

  .base-info,
  .main-info,
  .config-info {
    margin-bottom: 0.5rem;
  }
}

@media (max-width: 768px) {
  .el-row {
    flex-direction: column;
  }

  .base-info,
  .main-info,
  .config-info {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}
</style>
