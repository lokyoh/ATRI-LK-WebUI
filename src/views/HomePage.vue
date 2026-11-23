<template>
  <div class="min-h-screen" :style="{ background: 'var(--bg-color)' }">
    <div class="flex">
      <!-- 侧边栏 -->
      <AppSidebar
        :menus="menus"
        :active="curSelectMenu"
        :collapsed="isCollapsed"
        :mobile="isMobile"
        :show="asideShow"
        @select="handleSelect"
      />

      <!-- 主内容区 -->
      <div
        class="flex-1 flex flex-col transition-all duration-500 ease-in-out"
        :style="{
          overflow: 'hidden',
        }"
      >
        <!-- 顶部导航 -->
        <AppHeader
          :mobile="isMobile"
          :collapsed="isCollapsed"
          :show="asideShow"
          @toggle-menu="toggleMenu"
          @toggle-collapse="toggleCollapse"
        />

        <!-- 主内容 -->
        <main
          class="flex-1 h-full p-0"
          :style="{
            backgroundColor: 'var(--bg-color)',
            height: computedHeight + 'px',
          }"
          @click="handleMainClick"
        >
          <!--
            这里不能加 backdrop-blur（backdrop-filter）：它会为 fixed 定位的后代
            建立新的包含块，Element Plus 的表格溢出提示、tooltip、下拉浮层都用
            strategy:fixed 来逃出 .el-table 的 overflow:hidden。一旦包含块变成
            这个路由容器，坐标就整体偏移一个顶栏高度，表现为「浮层错位」。
            背景本身是不透明的 --bg-color-secondary，模糊也没有可见效果。
          -->
          <router-view
            class="rounded-xl p-6 h-full"
            :style="{
              backgroundColor: 'var(--bg-color-secondary)',
              height: computedHeight + 'px',
            }"
            :key="rvKey"
          />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, provide, nextTick, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from '@/utils/message'
import EventBus from '@/utils/event-bus'
import { getRequest } from '@/utils/api'
import { useMainStore } from '@/stores/main'
import type { BotInfo } from '@/types/bot'
import type { MenuItem } from '@/types/menu'
import { getContentViewportHeight } from '@/utils/utils'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

interface MenuData {
  bot_type: string
  menus: MenuItem[]
}

interface GetMenusResponse {
  suc: boolean
  code: number
  info: string
  warning?: string
  data: MenuData
}

interface GetBaseInfoResponse {
  suc: boolean
  code: number
  info: string
  warning?: string
  data: BotInfo[]
}

const router = useRouter()
const route = useRoute()
const prefix = inject<string>('prefix')
const store = useMainStore()

const asideShow = ref(false)
const isCollapsed = ref(false)
const isMobile = ref(false)
const rvKey = ref(0)
const menus = ref<MenuItem[]>([])
const botList = ref<BotInfo[]>([])
const botInfo = ref<BotInfo | null>(null)
const curSelectMenu = ref('')
const firstLoad = ref(true)
const windowHeight = ref(window.innerHeight)
let currentScreenMode: 'small' | 'medium' | 'wide' | null = null

const computedHeight = computed(() => {
  return getContentViewportHeight(windowHeight.value)
})

// BOT控制台左侧信息卡的「切换账号」：数据与动作由 HomePage 提供，
// 切换逻辑（getBotInfo 的 rvKey 刷新等）保持单一来源
provide('botList', botList)
provide('switchBot', (botId: string) => getBotInfo(botId))

function handleResize() {
  windowHeight.value = window.innerHeight
  checkScreenSize()
}

function checkScreenSize() {
  const width = window.innerWidth
  const screenMode = width <= 768 ? 'small' : width <= 1500 ? 'medium' : 'wide'
  windowHeight.value = window.innerHeight
  isMobile.value = screenMode === 'small'

  if (screenMode === currentScreenMode) {
    return
  }

  currentScreenMode = screenMode
  document.body.style.overflow = ''
  if (screenMode === 'small') {
    asideShow.value = false
    isCollapsed.value = false
  } else {
    isCollapsed.value = screenMode === 'medium'
    asideShow.value = !isCollapsed.value
  }
}

function handleMainClick() {
  if (isMobile.value) {
    // 如果是移动端且菜单显示，点击主内容应该关闭菜单
    if (asideShow.value) {
      asideShow.value = false
      document.body.style.overflow = ''
    }
  }
}

function handleSelect(index: string) {
  if (isMobile.value) {
    asideShow.value = false
  }
  if (index.charAt(0) !== '/') {
    index = '/' + index
  }
  curSelectMenu.value = index
  router.replace(index)
}

function toggleMenu() {
  asideShow.value = !asideShow.value
  if (isMobile.value) {
    document.body.style.overflow = asideShow.value ? 'hidden' : ''
  }
}
function toggleCollapse() {
  if (!isMobile.value) {
    isCollapsed.value = !isCollapsed.value
    localStorage.setItem('menuCollapsed', isCollapsed.value.toString())

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
        if (route.path == '/') {
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
      if (['/command', '/manage'].includes(route.path)) {
        if (route.path == '/command' && firstLoad.value) {
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

watch(asideShow, () => {
  EventBus.emit('sidebar-aside', {
    asideShow: asideShow.value,
    timestamp: Date.now(),
  })
})

onMounted(() => {
  getMenus()
  getBotInfo()
  window.addEventListener('resize', handleResize)
  checkScreenSize()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
