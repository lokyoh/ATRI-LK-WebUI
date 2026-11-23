<template>
  <header
    class="home-header backdrop-blur-sm shadow-sm px-4 flex items-center justify-between sticky top-0 z-30"
    :style="{ backgroundColor: 'var(--bg-color-secondary)' }"
  >
    <!-- 移动端菜单按钮 -->
    <button
      @click="emit('toggle-menu')"
      class="header-icon-trigger inline-flex md:hidden rounded-full transition-all duration-300 text-md"
      :style="{ backgroundColor: 'var(--bg-color-hover)' }"
    >
      <el-icon color="var(--el-color-primary)">
        <Fold v-if="mobile ? show : !collapsed" />
        <Expand v-else />
      </el-icon>
    </button>

    <!-- 左侧功能区 -->
    <div class="header-actions flex items-center">
      <!-- 桌面端菜单展开/收起按钮 -->
      <button
        v-if="!mobile"
        @click="emit('toggle-collapse')"
        class="header-icon-trigger hidden md:flex items-center rounded-full transition-all duration-300 text-md"
        :style="{ backgroundColor: 'var(--bg-color-hover)' }"
      >
        <el-icon color="var(--el-color-primary)">
          <Fold v-if="!collapsed" />
          <Expand v-else />
        </el-icon>
      </button>

      <!-- API地址设置按钮 -->
      <router-link
        :to="{ name: 'MyApi' }"
        class="header-link hidden md:flex items-center rounded-full transition-all duration-300 shadow-sm text-md"
        :style="{
          background: `linear-gradient(to right, var(--primary-color-light-9), var(--primary-color-light-8))`,
          color: 'var(--primary-color)',
        }"
      >
        <el-icon color="var(--el-color-primary)">
          <connection />
        </el-icon>
        <span>地址设置</span>
      </router-link>

      <!-- 文档链接 -->
      <a
        href="https://lokyoh.github.io/ATRI-LK-docs/"
        target="_blank"
        rel="noopener noreferrer"
        class="header-link hidden md:flex items-center rounded-full transition-all duration-300 shadow-sm text-md"
        :style="{
          background: `linear-gradient(to right, var(--primary-color-light-9), var(--primary-color-light-8))`,
          color: 'var(--primary-color)',
        }"
      >
        <el-icon color="var(--el-color-primary)">
          <document />
        </el-icon>
        <span>文档</span>
      </a>
    </div>

    <!-- 右侧功能区 -->
    <div class="header-actions flex items-center">
      <el-tooltip
        v-if="versionInfo"
        :content="
          versionInfo.has_update
            ? `${versionInfo.current} → ${versionInfo.latest}${versionInfo.notes ? ` · ${firstLine(versionInfo.notes)}` : ''}`
            : `当前版本 ${versionInfo.current}`
        "
        placement="bottom"
      >
        <el-button
          class="header-update-button"
          size="small"
          :type="versionInfo.has_update ? 'warning' : 'primary'"
          :loading="versionInfo.has_update ? updating : checkingVersion"
          @click="versionInfo.has_update ? handleUpdate() : checkForUpdates()"
        >
          <el-icon class="mr-1">
            <top v-if="versionInfo.has_update" />
            <refresh v-else />
          </el-icon>
          {{ versionInfo.has_update ? '立即更新' : '检查更新' }}
        </el-button>
      </el-tooltip>

      <!-- 主题切换 -->
      <el-dropdown
        @command="handleThemeChange"
        trigger="click"
        class="rounded-full transition-all duration-300 text-md"
        :style="{ backgroundColor: 'var(--bg-color-hover)' }"
      >
        <span class="el-dropdown-link header-icon-trigger inline-flex cursor-pointer">
          <el-icon color="var(--el-color-primary)">
            <brush-filled />
          </el-icon>
        </span>
        <template v-slot:dropdown>
          <el-dropdown-menu
            class="shadow-lg rounded-xl overflow-hidden transition-all duration-300 text-md"
          >
            <el-dropdown-item
              v-for="theme in themes"
              :key="theme.value"
              :command="theme.value"
              class="flex items-center px-4 py-2 transition-all duration-200"
              :style="{ backgroundColor: 'var(--bg-color-hover)' }"
            >
              <el-icon :color="theme.color">
                <component :is="theme.icon" />
              </el-icon>
              <span :style="{ color: 'var(--text-color)' }">{{ theme.label }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 退出登录（切换账号已移至 BOT控制台左侧信息卡） -->
      <button
        class="header-logout flex items-center rounded-full transition-all duration-300 shadow-sm text-md"
        :style="{
          background: `linear-gradient(to right, var(--primary-color-light-9), var(--primary-color-light-8))`,
          color: 'var(--danger-color)',
        }"
        @click="handleLogout"
      >
        <el-icon color="var(--danger-color)">
          <switch-button />
        </el-icon>
        <span>退出登录</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import { message } from '@/utils/message'
import { clearCookie, postRequest } from '@/utils/api'
import { useTheme } from '@/composables/useTheme'
import { useVersionCheck } from '@/composables/useVersionCheck'
import {
  BrushFilled,
  Connection,
  Document,
  Expand,
  Fold,
  Refresh,
  SwitchButton,
  Top,
} from '@element-plus/icons-vue'

defineProps<{
  mobile: boolean
  collapsed: boolean
  /** 移动端抽屉是否展开（控制菜单按钮图标方向） */
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-menu'): void
  (e: 'toggle-collapse'): void
}>()

const router = useRouter()
const prefix = inject<string>('prefix', '/atri/api')
const { themes, handleThemeChange } = useTheme()
const { versionInfo, updating, checkingVersion, getVersionInfo, checkForUpdates, firstLine, handleUpdate } =
  useVersionCheck()

getVersionInfo()

function handleLogout() {
  // 后端吊销当前 token（退出登录真正生效），失败不阻塞本地清理
  postRequest(`${prefix}/logout`).catch(() => {})
  clearCookie('tokenStr')
  window.sessionStorage.removeItem('isAuthenticated') // 清除登录状态
  message.success('已退出登录！')
  router.push('/')
}
</script>

<style scoped>
.home-header {
  height: 56px;
  min-height: 56px;
  gap: 12px;
}

.header-actions {
  gap: 8px;
}

.header-icon-trigger {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
}

.header-link,
.header-update-button,
.header-logout {
  height: 36px;
}

.header-link {
  gap: 6px;
  padding: 0 12px;
}

.header-update-button {
  padding: 0 12px;
}

.header-logout {
  gap: 6px;
  padding: 0 12px;
  cursor: pointer;
  border: none;
}
</style>
