<template>
  <el-popover
    placement="bottom-start"
    :width="260"
    trigger="click"
    popper-class="rounded-xl shadow-xl overflow-hidden transition-all duration-300 text-md"
  >
    <div class="max-h-96 overflow-y-auto custom-scrollbar">
      <div
        v-for="bot in botList"
        :key="bot.self_id"
        class="flex items-center p-3 cursor-pointer transition-all duration-300"
        :style="{
          backgroundColor: bot.is_select ? 'var(--bg-color-hover)' : 'transparent',
        }"
        @click="handleSelect(bot)"
      >
        <el-image
          :src="bot.ava_url"
          class="w-10 h-10 rounded-full object-cover border-2 transition-all duration-300"
          :style="{ borderColor: 'var(--primary-color-light)' }"
        />
        <div class="ml-3">
          <p class="font-medium" :style="{ color: 'var(--text-color)' }">
            {{ bot.nickname }}
          </p>
          <span class="text-xs" :style="{ color: 'var(--text-color-secondary)' }">
            {{ bot.self_id }}
          </span>
        </div>
      </div>
      <div
        v-if="!botList.length"
        class="p-4 text-center text-sm"
        :style="{ color: 'var(--text-color-secondary)' }"
      >
        暂无可切换的账号
      </div>
    </div>

    <template #reference>
      <button class="bot-switcher-trigger" type="button">
        <el-icon color="var(--el-color-primary)">
          <switch-icon />
        </el-icon>
        <span>切换账号</span>
      </button>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { inject, ref, type Ref } from 'vue'
import { Switch as SwitchIcon } from '@element-plus/icons-vue'
import type { BotInfo } from '@/types/bot'

// botList 与切换动作由 HomePage 提供：切换逻辑（rvKey 刷新等）保持在原处
const botList = inject<Ref<BotInfo[]>>('botList', ref<BotInfo[]>([]))
const switchBot = inject<(botId: string) => void>('switchBot')

function handleSelect(bot: BotInfo) {
  switchBot?.(bot.self_id)
}
</script>

<style scoped>
.bot-switcher-trigger {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--border-color-light);
  border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--primary-color-light-9),
    var(--primary-color-light-8)
  );
  color: var(--primary-color);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bot-switcher-trigger:hover {
  filter: brightness(0.97);
}
</style>
