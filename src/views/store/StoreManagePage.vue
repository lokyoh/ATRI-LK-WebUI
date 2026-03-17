<template>
  <div class="plugin-list-container p-4 md:p-6 rounded-2xl flex flex-col"
    :style="{ backgroundColor: 'var(--bg-color)' }">
    <!-- 添加可爱的顶部装饰 -->
    <div class="decoration-top absolute top-0 left-0 right-0 h-6 flex justify-center shrink-0">
      <div class="w-full max-w-4xl flex justify-between px-4">
        <span :style="{ color: 'var(--el-color-primary-light-5)' }" class="text-xl">✧･ﾟ: *✧･ﾟ:*</span>
        <span :style="{ color: 'var(--el-color-primary-light-5)' }" class="text-xl">*:･ﾟ✧*:･ﾟ✧</span>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content flex-1 min-h-0 relative z-10">
      <StoreTemplate />
    </div>

    <!-- 添加可爱的底部装饰 -->
    <div class="decoration-bottom absolute bottom-0 left-0 right-0 h-6 flex justify-center shrink-0">
      <div class="w-full max-w-4xl flex justify-between px-4">
        <span :style="{ color: 'var(--el-color-primary-light-5)' }" class="text-xl">⋆.˚✮⋆.˚</span>
        <span :style="{ color: 'var(--el-color-primary-light-5)' }" class="text-xl">˚.⋆✮˚.⋆</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StoreTemplate from "@/components/store/StoreTemplate.vue"
</script>

<style lang="scss" scoped>
.plugin-list-container {
  position: relative;
  width: 100%;
  background: linear-gradient(135deg,
      var(--el-bg-color) 0%,
      var(--el-fill-color-light) 50%,
      var(--el-fill-color) 100%);

  // 添加可爱的背景图案
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.1;
    pointer-events: none;
    background-image: radial-gradient(var(--el-color-primary-light-5) 1px,
        transparent 1px),
      radial-gradient(var(--el-color-primary-light-5) 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: 0 0, 20px 20px;
  }

  .main-content {
    position: relative;
    z-index: 10;

    // 添加可爱的边框效果
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      border: 2px dashed var(--el-border-color);
      border-radius: 16px;
    }
  }

  // 响应式调整
  @media (max-width: 768px) {
    .main-content {
      padding: 0.5rem;

      &::after {
        border-radius: 12px;
      }
    }
  }
}
</style>
