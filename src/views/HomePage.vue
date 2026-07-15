<template>
  <div class="min-h-screen" :style="{ background: 'var(--bg-color)' }">
    <div class="flex">
      <!-- 侧边栏 -->
      <aside
        class="backdrop-blur-sm shadow-xl fixed md:relative z-50 h-screen flex flex-col transition-all duration-500 ease-in-out"
        :style="{
          width: getMenuWidth(),
          transform: getTransform(),
          backgroundColor: 'var(--bg-color-secondary)',
        }">
        <div class="flex flex-col h-full overflow-hidden">
          <!-- 顶部内容 -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 flex justify-center" style="height: 130px; margin-top: 20px">
              <img v-if="!isCollapsed"
                class="w-48 h-24 object-contain animate-bounce-slow transition-opacity duration-300"
                src="../assets/image/logo.png" alt="Logo" />
            </div>

            <div class="px-2 pb-4">
              <el-menu class="border-0 transition-all duration-300" @select="handleSelect"
                :background-color="'transparent'" :text-color="'var(--text-color-secondary)'"
                :active-text-color="'var(--primary-color)'" :collapse="isCollapsed" :collapse-transition="false">
                <el-menu-item v-for="menu in menus" :key="menu.module" :index="menu.router"
                  class="group rounded-lg my-1 transition-all duration-300 flex justify-center" :style="{
                    backgroundColor:
                      curSelectMenu === menu.router
                        ? 'var(--bg-color-hover)'
                        : 'transparent',
                  }">
                  <div class="flex items-center w-full">
                    <span class="h-8 w-1 rounded-full mr-4 transition-all duration-300" :style="{
                      backgroundColor:
                        curSelectMenu === menu.router
                          ? 'var(--primary-color)'
                          : 'transparent',
                    }"></span>
                    <SvgIcon :name="menu.icon" size="24" :color="primaryColor" />
                    <span v-if="!isCollapsed" class="ml-3 text-lg font-medium transition-all duration-300" :style="{
                      color:
                        curSelectMenu === menu.router
                          ? 'var(--primary-color)'
                          : 'var(--text-color)',
                      fontWeight:
                        curSelectMenu === menu.router ? 'bold' : 'normal',
                    }">{{ menu.name }}</span>
                    <el-tooltip v-else effect="light" :content="menu.name" placement="right" popper-class="shadow-lg">
                      <span></span>
                    </el-tooltip>
                  </div>
                </el-menu-item>
              </el-menu>
            </div>
          </div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <div class="flex-1 flex flex-col transition-all duration-500 ease-in-out" :style="{
        width: isCollapsed ? 'calc(100% - 5.5rem)' : 'calc(100% - 18.5rem)',
        overflow: 'hidden',
      }">
        <!-- 顶部导航 -->
        <header class="backdrop-blur-sm shadow-sm p-4 flex items-center justify-between sticky top-0 z-30"
          :style="{ backgroundColor: 'var(--bg-color-secondary)' }">
          <!-- 移动端菜单按钮 -->
          <button @click="toggleMenu" class="md:hidden p-2 rounded-full transition-all duration-300 text-md"
            :style="{ backgroundColor: 'var(--bg-color-hover)' }">
            <el-icon color="var(--el-color-primary)">
              <Fold v-if="!isCollapsed" />
              <Expand v-else />
            </el-icon>
          </button>

          <!-- 左侧功能区 -->
          <div class="flex items-center space-x-4">
            <!-- 桌面端菜单展开/收起按钮 -->
            <button v-if="!isMobile" @click="toggleCollapse"
              class="hidden md:flex items-center p-2 rounded-full transition-all duration-300 text-md"
              :style="{ backgroundColor: 'var(--bg-color-hover)' }">
              <el-icon color="var(--el-color-primary)">
                <Fold v-if="!isCollapsed" />
                <Expand v-else />
              </el-icon>
            </button>

            <!-- API地址设置按钮 -->
            <router-link :to="{ name: 'MyApi' }"
              class="hidden md:flex items-center px-4 py-2 rounded-full transition-all duration-300 shadow-sm text-md"
              :style="{
                background: `linear-gradient(to right, var(--primary-color-light-9), var(--primary-color-light-8))`,
                color: 'var(--primary-color)',
              }">
              <el-icon color="var(--el-color-primary)">
                <connection />
              </el-icon>
              <span>地址设置</span>
            </router-link>
          </div>

          <!-- 右侧功能区 -->
          <div class="flex items-center space-x-4">
            <!-- 主题切换 -->
            <el-dropdown @command="handleThemeChange" trigger="click"
              class="rounded-full p-2 transition-all duration-300 text-md"
              :style="{ backgroundColor: 'var(--bg-color-hover)' }">
              <span class="el-dropdown-link cursor-pointer">
                <el-icon color="var(--el-color-primary)">
                  <brush-filled />
                </el-icon>
              </span>
              <template v-slot:dropdown>
                <el-dropdown-menu class="shadow-lg rounded-xl overflow-hidden transition-all duration-300 text-md">
                  <el-dropdown-item v-for="theme in themes" :key="theme.value" :command="theme.value"
                    class="flex items-center px-4 py-2 transition-all duration-200"
                    :style="{ backgroundColor: 'var(--bg-color-hover)' }">
                    <el-icon :color="theme.color">
                      <component :is="theme.icon" />
                    </el-icon>
                    <span :style="{ color: 'var(--text-color)' }">{{
                      theme.label
                      }}</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <!-- 账号切换 -->
            <el-popover placement="bottom-end" width="280" trigger="hover"
              popper-class="rounded-xl shadow-xl overflow-hidden transition-all duration-300 text-md">
              <div class="max-h-96 overflow-y-auto custom-scrollbar">
                <div v-for="bot in botList" :key="bot.self_id" @click="getBotInfo(bot.self_id)"
                  class="flex items-center p-3 cursor-pointer transition-all duration-300" :style="{
                    backgroundColor: bot.is_select
                      ? 'var(--bg-color-hover)'
                      : 'transparent',
                  }">
                  <el-image :src="bot.ava_url"
                    class="w-10 h-10 rounded-full object-cover border-2 transition-all duration-300"
                    :style="{ borderColor: 'var(--primary-color-light)' }" />
                  <div class="ml-3">
                    <p :style="{ color: 'var(--text-color)' }" class="font-medium">
                      {{ bot.nickname }}
                    </p>
                    <span :style="{ color: 'var(--text-color-secondary)' }" class="text-xs">{{ bot.self_id }}</span>
                  </div>
                </div>
              </div>

              <template #reference>
                <div class="flex items-center cursor-pointer group">
                  <span class="mr-2 transition-all duration-300 text-md" :style="{ color: 'var(--text-color)' }">
                    切换账号
                  </span>
                  <el-image :src="botInfo?.ava_url"
                    class="w-10 h-10 rounded-full object-cover border-2 shadow-sm transition-all duration-300"
                    :style="{ borderColor: 'var(--primary-color)' }" />
                </div>
              </template>
            </el-popover>

            <!-- 用户下拉菜单 -->
            <el-dropdown @command="dropdownClick" trigger="click"
              class="rounded-full p-2 transition-all duration-300 text-md"
              :style="{ backgroundColor: 'var(--bg-color-hover)' }">
              <span class="el-dropdown-link cursor-pointer flex items-center">
                <span class="font-medium mx-2 transition-all duration-300" :style="{ color: 'var(--text-color)' }">{{
                  botInfo?.nickname || "用户" }}</span>
                <el-icon color="var(--el-color-primary)">
                  <arrow-down />
                </el-icon>
              </span>
              <template v-slot:dropdown>
                <el-dropdown-menu class="shadow-lg rounded-xl overflow-hidden transition-all duration-300">
                  <el-dropdown-item command="logout" class="flex items-center px-4 py-2 transition-all duration-200"
                    :style="{ backgroundColor: 'var(--bg-color-hover)' }">
                    <el-icon color="var(--el-color-primary)">
                      <Switch />
                    </el-icon>
                    <span :style="{ color: 'var(--danger-color)' }">退出登录</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </header>

        <!-- 主内容 -->
        <main class="flex-1 h-full p-0" :style="{
          backgroundColor: 'var(--bg-color)',
          height: computedHeight + 'px',
        }" @click="handleMainClick">
          <router-view class="backdrop-blur-sm rounded-xl p-6 h-full" :style="{
            backgroundColor: 'var(--bg-color-secondary)',
            height: computedHeight + 'px',
          }" :key="rvKey" />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, nextTick, watch, computed, onMounted, onUnmounted, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from "@/utils/message"
import EventBus from "@/utils/event-bus"
import { getRequest } from '@/utils/api'
import { useMainStore } from '@/stores/main'
import { getHeaderHeight } from "@/utils/utils"
import {
  Fold,
  Expand,
  Connection,
  BrushFilled,
  ArrowDown,
  Switch,
  MagicStick,
  Moon,
  Sunny,
  Monitor,
} from '@element-plus/icons-vue'
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'

interface MenuItem {
  module: string;
  name: string;
  router: string;
  icon: string;
  default: boolean;
}

interface MenuData {
  bot_type: string;
  menus: MenuItem[];
}

interface GetMenusResponse {
  suc: boolean;
  code: number;
  info: string;
  warning?: string;
  data: MenuData;
}

interface BaseInfo {
  self_id: string;
  nickname: string;
  ava_url: string;
  friend_count: number;
  group_count: number;
  received_messages: number;
  connect_time: number;
  connect_date: string;
  connect_count: number;
  status: boolean;
  is_select: boolean;
  day_call: number;
  version: string;
}

interface GetBaseInfoResponse {
  suc: boolean;
  code: number;
  info: string;
  warning?: string;
  data: BaseInfo[];
}

const router = useRouter();
const route = useRoute();
const prefix = inject<string>('prefix');
const setAppTheme = inject('setAppTheme')
const store = useMainStore()

const asideShow = ref(false)
const isCollapsed = ref(false)
const isMobile = ref(false)
const rvKey = ref(0)
const menus = ref<MenuItem[]>([])
const botList = ref<BaseInfo[]>([])
const botInfo = ref<BaseInfo | null>(null)
const curSelectMenu = ref('')
const firstLoad = ref(true)
const windowHeight = ref(window.innerHeight)
const themes = ref([
  {
    value: "pink",
    label: "可爱少女",
    icon: markRaw(MagicStick),
    color: "#F59E0B",
  },
  {
    value: "dark",
    label: "暗黑模式",
    icon: markRaw(Moon),
    color: "#6B7280",
  },
  {
    value: "light",
    label: "亮色模式",
    icon: markRaw(Sunny),
    color: "#F59E0B",
  },
  {
    value: "one-dark",
    label: "One Dark",
    icon: markRaw(Monitor),
    color: "#7C3AED",
  },
])

const primaryColor = ref('')

const updatePrimaryColor = () => {
  const style = getComputedStyle(document.documentElement)
  primaryColor.value = style.getPropertyValue('--primary-color').trim()
}
const computedHeight = computed(() => {
  return windowHeight.value - getHeaderHeight() + 7
})

function dropdownClick(command: string) {
  if (command === 'logout') {
    window.sessionStorage.removeItem("isAuthenticated") // 清除登录状态
    message.success("已退出登录！")
    router.push("/")
  }
}

function getMenuWidth() {
  if (isCollapsed.value) {
    return isMobile.value ? "0rem" : "6.5rem"
  }
  return "20rem"
}

function getTransform() {
  if (isMobile.value) {
    return asideShow.value ? "translateX(0)" : "translateX(-100%)"
  }
  return asideShow.value ? "translateX(0)" : "translateX(-1%)"
}

function handleResize() {
  windowHeight.value = window.innerHeight
  checkScreenSize()
}

function checkScreenSize() {
  isMobile.value = window.innerWidth <= 768

  // 如果是移动设备或从桌面切换到移动设备
  if (isMobile.value) {
    nextTick(() => { })
    asideShow.value = false // 移动端默认隐藏菜单
    isCollapsed.value = false // 移动端不折叠菜单
  } else {
    // 桌面端根据折叠状态显示菜单
    asideShow.value = !isCollapsed.value
    if (window.innerWidth <= 1500) {
      toggleCollapse()
    }
  }
}

function handleMainClick() {
  if (isMobile.value) {
    // 如果是移动端且菜单显示，点击主内容应该关闭菜单
    if (asideShow.value) {
      asideShow.value = false
      document.body.style.overflow = ""
    }
  }
}

function handleSelect(index: string) {
  if (isMobile.value) {
    asideShow.value = false
  }
  if (index.charAt(0) !== "/") {
    index = "/" + index
  }
  curSelectMenu.value = index
  router.replace(index)
}

function toggleMenu() {
  asideShow.value = !asideShow.value
  if (isMobile.value) {
    document.body.style.overflow = asideShow.value ? "hidden" : ""
  }
}
function toggleCollapse() {
  if (!isMobile.value) {
    isCollapsed.value = !isCollapsed.value
    localStorage.setItem("menuCollapsed", isCollapsed.value.toString())

    // 确保主内容宽度正确更新
    nextTick(() => {
      asideShow.value = !isCollapsed.value
    })
  }
}

function getMenus() {
  getRequest(`${prefix}/menu/get_menus`).then((resp: { data: GetMenusResponse }) => {
    if (resp.data.suc) {
      if (resp.data.warning) {
        message.warning(resp.data.warning)
      } else {
        message.success(resp.data.info)
        menus.value = resp.data.data.menus
        store.setBotType(resp.data.data.bot_type)
        if (route.path == "/") {
          for (const menu of menus.value) {
            if (menu.default) {
              curSelectMenu.value = menu.router
              break
            }
          }
        } else {
          for (const menu of menus.value) {
            if (menu.router == route.path) {
              curSelectMenu.value = menu.router
            }
          }
        }
      }
    } else {
      message.error(resp.data.info)
    }
  })
}
async function getBotInfo(bot_id: string | null = null) {
  getRequest(`${prefix}/main/get_base_info`, {
    bot_id,
  }).then((resp: { data: GetBaseInfoResponse }) => {
    if (resp.data.suc) {
      if (resp.data.warning) {
        message.warning(resp.data.warning)
      } else {
        message.success(resp.data.info)
        botList.value = resp.data.data
        if (!botList.value.length) {
          botInfo.value = null
        } else {
          if (store.botInfo) {
            let is_in = false
            for (const bot of botList.value) {
              if (bot.self_id == store.botInfo.self_id) {
                is_in = true
                break
              }
            }
            if (!is_in) {
              store.botInfo = null
            }
          }
          if (store.botInfo && !bot_id) {
            botInfo.value = store.botInfo
            for (const bot of botList.value) {
              bot.is_select = bot.self_id == botInfo.value.self_id
              if (bot.is_select) {
                botInfo.value = bot
                store.setBot(bot)
              }
            }
          } else {
            for (const bot of botList.value) {
              if (bot.is_select) {
                botInfo.value = bot
                store.setBot(bot)
                break
              }
            }
          }
        }
      }
      store.clearChat()
      if (["/command", "/manage"].includes(route.path)) {
        if (route.path == "/command" && firstLoad.value) {
          firstLoad.value = false
        } else {
          rvKey.value++
        }
      }
      curSelectMenu.value = route.path
    } else {
      message.error(resp.data.info)
    }
  })
}
function handleThemeChange(command: string) {
  if (typeof setAppTheme === "function") {
    setAppTheme(command)
    updatePrimaryColor()
    EventBus.emit("change-theme", {
      timestamp: Date.now(),
    })
  } else {
    console.error("setAppTheme function not provided/injected correctly.")
  }
}

watch(asideShow, () => {
  EventBus.emit("sidebar-aside", {
    asideShow: asideShow.value,
    timestamp: Date.now(),
  })
})

onMounted(() => {
  updatePrimaryColor()
  getMenus()
  getBotInfo()
  window.addEventListener("resize", handleResize)
  checkScreenSize()
})

onUnmounted(() => {
  window.removeEventListener("resize", handleResize)
})
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--primary-color-light-9);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--primary-color-light-7);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color-light-5);
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

/* 菜单项悬停效果 */
:deep(.el-menu-item:hover) {
  background-color: var(--bg-color-hover) !important;
}

:deep(.el-menu-item.is-active) {
  background-color: var(--bg-color-hover) !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .el-dropdown-link span {
    display: none;
  }
}

/* 折叠菜单样式 */
:deep(.el-menu--collapse) {
  width: 73px;
}

:deep(.el-menu--collapse .el-menu-item) {
  display: flex;
  justify-content: center;
  padding: 0 10px !important;
}

:deep(.el-menu--collapse .el-menu-item) {
  margin-right: 0;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 旋转动画 */
.rotate-180 {
  transform: rotate(180deg);
}

.aside-enter-active,
.aside-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.aside-enter,
.aside-leave-to {
  transform: translateX(-100%);
}

/* 菜单项动画 */
.menu-item-animate {
  transition: all 0.3s ease;
  transform-origin: left center;
}

/* 优化后的弹跳动画 */
@keyframes smooth-bounce {

  0%,
  100% {
    transform: translateY(0) scale(1);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }

  50% {
    transform: translateY(-12px) scale(1.05);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

.animate-smooth-bounce {
  animation: smooth-bounce 3s infinite;
}

/* 优化过渡曲线 */
.smooth-transition {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content {
  width: calc(100% - var(--sidebar-width));
  margin-left: var(--sidebar-width);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    margin-left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .main-content {
    width: 100%;
    margin-left: 0;
  }
}
</style>
