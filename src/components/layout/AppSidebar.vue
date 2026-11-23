<template>
  <aside
    class="backdrop-blur-sm shadow-xl fixed md:relative z-50 h-screen flex flex-col transition-all duration-500 ease-in-out"
    :style="{
      width: menuWidth,
      transform: transform,
      backgroundColor: 'var(--bg-color-secondary)',
    }"
  >
    <div class="flex flex-col h-full overflow-hidden">
      <!-- 顶部内容 -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-4 flex justify-center" style="height: 130px; margin-top: 20px">
          <img
            v-if="!collapsed"
            class="w-48 h-24 object-contain animate-bounce-slow transition-opacity duration-300"
            src="../../assets/image/logo.webp"
            decoding="async"
            alt="Logo"
          />
        </div>

        <div class="px-2 pb-4">
          <el-menu
            class="border-0 transition-all duration-300"
            @select="handleSelect"
            :background-color="'transparent'"
            :text-color="'var(--text-color-secondary)'"
            :active-text-color="'var(--primary-color)'"
            :collapse="collapsed"
            :collapse-transition="false"
          >
            <el-menu-item
              v-for="menu in menus"
              :key="menu.module"
              :index="menu.router"
              class="group rounded-lg my-1 transition-all duration-300 flex justify-center"
              :style="{
                backgroundColor:
                  active === menu.router ? 'var(--bg-color-hover)' : 'transparent',
              }"
            >
              <div class="flex items-center w-full">
                <span
                  class="h-8 w-1 rounded-full mr-4 transition-all duration-300"
                  :style="{
                    backgroundColor:
                      active === menu.router ? 'var(--primary-color)' : 'transparent',
                  }"
                ></span>
                <SvgIcon :name="menu.icon" size="24" :color="primaryColor" />
                <span
                  v-if="!collapsed"
                  class="ml-3 text-lg font-medium transition-all duration-300"
                  :style="{
                    color:
                      active === menu.router
                        ? 'var(--primary-color)'
                        : 'var(--text-color)',
                    fontWeight: active === menu.router ? 'bold' : 'normal',
                  }"
                  >{{ menu.name }}</span
                >
                <el-tooltip
                  v-else
                  effect="light"
                  :content="menu.name"
                  placement="right"
                  popper-class="shadow-lg"
                >
                  <span></span>
                </el-tooltip>
              </div>
            </el-menu-item>
          </el-menu>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'
import type { MenuItem } from '@/types/menu'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{
  menus: MenuItem[]
  /** 当前选中的菜单路由 */
  active: string
  collapsed: boolean
  mobile: boolean
  /** 移动端抽屉是否展开 */
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'select', index: string): void
}>()

const { primaryColor } = useTheme()

const menuWidth = computed(() => {
  if (props.collapsed) {
    return props.mobile ? '0rem' : '5.5rem'
  }
  return '16rem'
})

const transform = computed(() => {
  if (props.mobile) {
    return props.show ? 'translateX(0)' : 'translateX(-100%)'
  }
  return props.show ? 'translateX(0)' : 'translateX(-1%)'
})

function handleSelect(index: string) {
  emit('select', index)
}
</script>

<style scoped>
:deep(.el-menu) {
  border-right: none;
}

/* 菜单项悬停效果 */
:deep(.el-menu-item:hover) {
  background-color: var(--bg-color-hover) !important;
}

:deep(.el-menu-item.is-active) {
  background-color: var(--bg-color-hover) !important;
}

/* 折叠菜单样式 */
:deep(.el-menu--collapse) {
  width: 100%;
}

:deep(.el-menu--collapse .el-menu-item) {
  display: flex;
  justify-content: center;
  padding: 0 10px !important;
  width: 100%;
}

:deep(.el-menu--collapse .el-menu-item) {
  margin-right: 0;
}

/* 缓慢弹跳动画 */
@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 3s infinite;
}

/* 缓慢弹跳动画：用户要求减少动态时直接关掉 */
@media (prefers-reduced-motion: reduce) {
  .animate-bounce-slow {
    animation: none;
  }
}
</style>
