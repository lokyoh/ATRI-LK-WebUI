<template>
  <div
    class="left-info-container p-4 h-full overflow-y-auto"
  >
    <!-- 头像和信息区域 -->
    <div
      class="avatar-section rounded-xl p-6"
    >
      <div class="flex flex-col items-center">
        <!-- 头像 -->
        <el-image
          :src="botInfo?.ava_url"
          class="w-24 h-24 rounded-full border-4 shadow-md transition-all"
          :style="{ borderColor: 'var(--border-color)' }"
          fit="cover"
        >
          <template v-slot:error>
            <div
              class="w-full h-full flex items-center justify-center rounded-full"
              :style="{ backgroundColor: 'var(--el-fill-color)' }"
            >
              <i
                class="el-icon-picture-outline text-3xl"
                :style="{ color: 'var(--primary-color)' }"
              ></i>
            </div>
          </template>
        </el-image>

        <!-- 昵称 -->
        <h2 class="mt-4 text-xl font-bold anime-font" :style="{ color: 'var(--primary-color)' }">
          {{ botInfo?.nickname }}
        </h2>

        <!-- ID -->
        <div
          class="mt-2 px-3 py-1 text-white rounded-full text-xs font-medium shadow-md"
          :style="{
            background:
              'linear-gradient(to right, var(--primary-color), var(--primary-color-light))',
          }"
        >
          ID: {{ botInfo?.self_id }}
        </div>

        <!-- 统计信息 -->
        <div
          class="w-full mt-6 grid grid-cols-3 divide-x"
          :style="{ borderColor: 'var(--border-color-light)' }"
        >
          <!-- 好友数量 -->
          <div class="text-center">
            <p class="text-xl font-bold" :style="{ color: 'var(--info-color)' }">
              {{ botInfo?.friend_count }}
            </p>
            <p class="text-xxs mt-1" :style="{ color: 'var(--text-color-secondary)' }">好友数量</p>
          </div>

          <!-- 开关 -->
          <div class="switch-border text-center cursor-pointer" @click="handleBotStatus">
            <svg-icon
              name="switch"
              class="text-lg"
              :color="botInfo?.status ? 'var(--success-color)' : 'var(--danger-color)'"
            />
            <p class="text-xxs mt-2" :style="{ color: 'var(--text-color-secondary)' }">全局开关</p>
          </div>

          <!-- 群组数量 -->
          <div class="text-center">
            <p class="text-xl font-bold" :style="{ color: 'var(--success-color)' }">
              {{ botInfo?.group_count }}
            </p>
            <p class="text-xxs mt-1" :style="{ color: 'var(--text-color-secondary)' }">群组数量</p>
          </div>
        </div>
      </div>
    </div>

    <BotStatusConfig scope="bot" :bot-id="botInfo?.self_id" />

  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import SvgIcon from '../SvgIcon/SvgIcon.vue'
import { getLoading } from '@/utils/loading'
import { postRequest } from '@/utils/api'
import BotStatusConfig from '@/components/command/BotStatusConfig.vue'
import { message } from '@/utils/message'
import { useMainStore } from '@/stores/main'

const store = useMainStore()
const prefix = inject('prefix') as string

interface ChangeBotStatusResponse {
  suc: boolean
  info: string
  warning?: string
}

const botInfo = computed(() => store.botInfo)

function handleBotStatus() {
  const loading = getLoading('.left-info-container')

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

</script>

<style scoped>
/* 自定义字体 */
@import url('https://fonts.googleapis.com/css2?family=Mochiy+Pop+P+One&display=swap');

.switch-border {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.left-info-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  gap: 16px;
  /* 设置两个部分之间的间距 */
}

.avatar-section {
  flex-shrink: 0;
  border: 1px solid var(--border-color-light);
  background-color: var(--bg-color-secondary);
  box-shadow: var(--el-box-shadow-light);
}

/* 使用全局字体变量 */
.anime-font {
  font-family: 'Mochiy Pop P One', sans-serif;
  font-size: var(--font-size-xl);
  line-height: var(--line-height-dense);
}
</style>
