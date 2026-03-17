<template>
  <div class="left-info-container p-4 h-full overflow-y-auto" :style="{ backgroundColor: 'var(--bg-color)' }"
    ref="leftInfoContainer">
    <!-- 头像和信息区域 -->
    <div class="avatar-section rounded-xl p-6 shadow-lg transform transition-all hover:scale-[1.01]"
      :style="{ backgroundColor: 'var(--bg-color-secondary)' }">
      <div class="flex flex-col items-center">
        <!-- 头像 -->
        <el-image :src="botInfo?.ava_url" class="w-24 h-24 rounded-full border-4 shadow-md transition-all"
          :style="{ borderColor: 'var(--border-color)' }" fit="cover">
          <template v-slot:error>
            <div class="w-full h-full flex items-center justify-center rounded-full"
              :style="{ backgroundColor: 'var(--el-fill-color)' }">
              <i class="el-icon-picture-outline text-3xl" :style="{ color: 'var(--primary-color)' }"></i>
            </div>
          </template>
        </el-image>

        <!-- 昵称 -->
        <h2 class="mt-4 text-xl font-bold anime-font" :style="{ color: 'var(--primary-color)' }">
          {{ botInfo?.nickname }}
        </h2>

        <!-- ID -->
        <div class="mt-2 px-3 py-1 text-white rounded-full text-xs font-medium shadow-md" :style="{
          background:
            'linear-gradient(to right, var(--primary-color), var(--primary-color-light))',
        }">
          ID: {{ botInfo?.self_id }}
        </div>

        <!-- 统计信息 -->
        <div class="w-full mt-6 grid grid-cols-3 divide-x" :style="{ borderColor: 'var(--border-color-light)' }">
          <!-- 好友数量 -->
          <div class="text-center">
            <p class="text-xl font-bold" :style="{ color: 'var(--info-color)' }">
              {{ botInfo?.friend_count }}
            </p>
            <p class="text-xxs mt-1" :style="{ color: 'var(--text-color-secondary)' }">
              好友数量
            </p>
          </div>

          <!-- 开关 -->
          <div class="switch-border text-center cursor-pointer" @click="handleBotStatus">
            <svg-icon name="switch" class="text-lg" :color="botInfo?.status ? 'var(--success-color)' : 'var(--danger-color)'
              " />
            <p class="text-xxs mt-2" :style="{ color: 'var(--text-color-secondary)' }">
              全局开关
            </p>
          </div>

          <!-- 群组数量 -->
          <div class="text-center">
            <p class="text-xl font-bold" :style="{ color: 'var(--success-color)' }">
              {{ botInfo?.group_count }}
            </p>
            <p class="text-xxs mt-1" :style="{ color: 'var(--text-color-secondary)' }">
              群组数量
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 插件管理区域 -->
    <div class="plugin-section" :style="{
      height: pluginSectionHeight + 'px',
      backgroundColor: 'var(--bg-color-secondary)',
    }">
      <h3 class="text-md font-bold mb-4 flex items-center" :style="{ color: 'var(--primary-color)' }">
        <svg-icon name="plugin" class="mr-2" color="var(--primary-color-light)" />
        Bot服务管理
      </h3>

      <div class="space-y-6">
        <!-- 全局禁用被动 -->
        <div class="grid grid-cols-12 gap-4 items-center">
          <label class="col-span-3 text-xs" :style="{ color: 'var(--text-color-secondary)' }">禁用被动</label>
          <div class="col-span-9">
            <el-select v-model="postData.blockTasks" multiple placeholder="请选择要禁用的被动" class="w-full"
              popper-class="cute-select-dropdown">
              <el-option v-for="task in botModuleData.allTasks" :key="task" :label="task" :value="task">
              </el-option>
            </el-select>
          </div>
        </div>

        <!-- 全局禁用插件 -->
        <div class="grid grid-cols-12 gap-4 items-center">
          <label class="col-span-3 text-xs" :style="{ color: 'var(--text-color-secondary)' }">禁用插件</label>
          <div class="col-span-9">
            <el-select v-model="postData.blockPlugins" multiple placeholder="请选择要禁用的插件" class="w-full"
              popper-class="cute-select-dropdown">
              <el-option v-for="n in botModuleData.allPlugins" :label="n" :value="n" :key="n"></el-option>
            </el-select>
          </div>
        </div>

        <!-- 应用按钮 -->
        <button @click="clickServiceManage"
          class="w-full py-2 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 text-sm"
          :style="{
            background:
              'linear-gradient(to right, var(--primary-color), var(--primary-color-light))',
          }">
          应用设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted, nextTick, inject } from "vue"
import SvgIcon from "../SvgIcon/SvgIcon.vue"
import { getLoading } from "@/utils/loading"
import { postRequest, getRequest } from "@/utils/api"
import type { BotInfo } from "@/stores/main"
import { message } from "@/utils/message"
import { useMainStore } from "@/stores/main"

const store = useMainStore()
const prefix = inject("prefix") as string

interface ChangeBotStatusResponse {
  suc: boolean
  info: string
  warning?: string
}

interface BotBlockModule {
  bot_id: string
  block_plugins: string[]
  block_tasks: string[]
  all_plugins: string[]
  all_tasks: string[]
}

interface GetBlockModuleResponse {
  suc: boolean
  info: string
  warning?: string
  data: BotBlockModule
}

interface UpdateServiceManageResponse {
  suc: boolean
  info: string
  warning?: string
}

const botModuleData = ref<{ allPlugins: string[], allTasks: string[] }>({
  allPlugins: [],
  allTasks: [],
})
const postData = ref<{ blockPlugins: string[], blockTasks: string[] }>({
  blockPlugins: [],
  blockTasks: [],
})
const botInfo = ref<BotInfo | null>(null)
const pluginSectionHeight = ref(0)
const leftInfoContainer = ref<HTMLDivElement | null>(null)

botInfo.value = store.botInfo

onMounted(() => {
  getModuleData()
  calculateHeights()
  window.addEventListener("resize", calculateHeights)
})

onUnmounted(() => {
  window.removeEventListener("resize", calculateHeights)
})

function calculateHeights() {
  nextTick(() => {
    const container = leftInfoContainer.value
    if (container) {
      const containerHeight = container.clientHeight
      const avatarSection = container.querySelector(".avatar-section")
      const avatarHeight = avatarSection ? avatarSection.clientHeight : 0
      const padding = 16 // 根据实际padding调整

      pluginSectionHeight.value = containerHeight - avatarHeight - padding
    }
  })
}

function handleBotStatus() {
  const loading = getLoading(".left-info-container")

  postRequest(`${prefix}/main/change_bot_status`, {
    bot_id: botInfo.value?.self_id,
    status: !botInfo.value?.status,
  }).then((resp: { data: ChangeBotStatusResponse }) => {
    if (resp.data.suc) {
      if (resp.data.warning) {
        message.warning(resp.data.warning)
      } else {
        message.success(resp.data.info)
        botInfo.value!.status = !botInfo.value!.status
      }
    } else {
      message.error(resp.data.info)
    }
    loading.close()
  })
}

function getModuleData() {
  const loading = getLoading(".left-info-container")
  getRequest(`${prefix}/main/get_block_module`)
    .then((resp: { data: GetBlockModuleResponse }) => {
      if (resp.data.suc) {
        if (resp.data.warning) {
          message.warning(resp.data.warning)
        } else {
          message.success(resp.data.info)
          botModuleData.value.allPlugins = resp.data.data.all_plugins
          botModuleData.value.allTasks = resp.data.data.all_tasks
          postData.value.blockPlugins = resp.data.data.block_plugins
          postData.value.blockTasks = resp.data.data.block_tasks
        }
      } else {
        message.error(resp.data.info)
      }
      loading.close()
    })
}

function clickServiceManage() {
  const loading = getLoading(".left-info-container")

  postRequest(`${prefix}/main/update_service_manage`, {
    block_plugins: postData.value.blockPlugins,
    block_tasks: postData.value.blockTasks,
  }).then((resp: { data: UpdateServiceManageResponse }) => {
    if (resp.data.suc) {
      if (resp.data.warning) {
        message.warning(resp.data.warning)
      } else {
        message.success(resp.data.info)
      }
    } else {
      message.error(resp.data.info)
    }
    loading.close()
  })
}
</script>

<style scoped>
/* 自定义字体 */
@import url("https://fonts.googleapis.com/css2?family=Mochiy+Pop+P+One&display=swap");

.switch-border {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.left-info-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  gap: 16px;
  /* 设置两个部分之间的间距 */
}

.avatar-section {
  border-radius: 0.75rem;
  /* rounded-xl */
  padding: 1.5rem;
  /* p-6 */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  /* shadow-lg */
  flex-shrink: 0;
  /* 防止压缩 */
}

.plugin-section {
  border-radius: 0.75rem;
  /* rounded-xl */
  padding: 1.5rem;
  /* p-6 */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  /* shadow-lg */
  overflow-y: auto;
  /* overflow-y-auto */
  flex-grow: 1;
  /* 填充剩余空间 */
  min-height: 300px;
  /* 设置最小高度 */
}

/* 使用全局字体变量 */
.anime-font {
  font-family: "Mochiy Pop P One", sans-serif;
  font-size: var(--font-size-xl);
  line-height: var(--line-height-dense);
}
</style>
