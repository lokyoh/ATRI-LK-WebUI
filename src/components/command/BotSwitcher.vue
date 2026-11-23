<template>
  <el-popover
    placement="bottom-start"
    :width="288"
    trigger="click"
    popper-class="bot-switcher-popper rounded-xl shadow-xl overflow-hidden transition-all duration-300 text-md"
  >
    <div class="switcher-header">切换到其他账号</div>
    <div class="switcher-list custom-scrollbar">
      <button
        v-for="bot in botList"
        :key="bot.self_id"
        type="button"
        class="switcher-item"
        :class="{ 'is-active': bot.is_select }"
        @click="handleSelect(bot)"
      >
        <el-image
          :src="bot.ava_url"
          class="switcher-avatar"
          :class="{ 'is-active': bot.is_select }"
          fit="cover"
        />
        <div class="switcher-meta">
          <p class="switcher-name">{{ bot.nickname }}</p>
          <span class="switcher-id">{{ bot.self_id }}</span>
        </div>
        <el-icon
          v-if="bot.is_select"
          class="switcher-check"
          color="var(--primary-color)"
        >
          <select-icon />
        </el-icon>
      </button>
      <div v-if="!botList.length" class="switcher-empty">暂无可切换的账号</div>
    </div>

    <template #reference>
      <button class="bot-switcher-trigger" type="button">
        <el-icon color="var(--el-color-primary)">
          <switch-icon />
        </el-icon>
        <span>切换账号</span>
        <el-icon class="trigger-arrow" color="var(--text-color-secondary)">
          <arrow-down />
        </el-icon>
      </button>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { inject, ref, type Ref } from 'vue'
import { ArrowDown, Select as SelectIcon, Switch as SwitchIcon } from '@element-plus/icons-vue'
import type { BotInfo } from '@/types/bot'

// botList 与切换动作由 HomePage 提供：切换逻辑（rvKey 刷新等）保持在原处
const botList = inject<Ref<BotInfo[]>>('botList', ref<BotInfo[]>([]))
const switchBot = inject<(botId: string) => void>('switchBot')

function handleSelect(bot: BotInfo) {
  switchBot?.(bot.self_id)
}
</script>

<style scoped>
/* 触发按钮：信息卡底部通栏，负 margin 贴齐卡片边缘（卡片 p-6 = 24px） */
.bot-switcher-trigger {
  width: auto;
  margin: 20px -24px -24px;
  height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 24px;
  border: none;
  border-top: 1px solid var(--border-color-light);
  border-radius: 0 0 12px 12px;
  background: transparent;
  color: var(--primary-color);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.bot-switcher-trigger:hover {
  background: var(--bg-color-hover);
}

.trigger-arrow {
  margin-left: auto;
  transition: transform 0.2s ease;
}

.bot-switcher-trigger:hover .trigger-arrow {
  transform: translateY(2px);
}

/* 弹层：el-popover 内容仍带本组件 scoped 属性，样式可用 */
.switcher-header {
  padding: 10px 14px 8px;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--text-color-secondary);
  border-bottom: 1px solid var(--border-color-light);
}

.switcher-list {
  max-height: 320px;
  overflow-y: auto;
  padding: 6px;
}

.switcher-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s ease;
}

.switcher-item:hover {
  background: var(--bg-color-hover);
}

.switcher-item.is-active {
  background: var(--primary-color-light-9);
}

.switcher-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid var(--primary-color-light);
  transition: border-color 0.2s ease;
}

.switcher-avatar.is-active {
  border-color: var(--primary-color);
}

.switcher-meta {
  min-width: 0;
  flex: 1;
}

.switcher-name {
  margin: 0;
  font-weight: 500;
  font-size: 14px;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.switcher-id {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.switcher-check {
  flex-shrink: 0;
}

.switcher-empty {
  padding: 18px 12px;
  text-align: center;
  font-size: 13px;
  color: var(--text-color-secondary);
}

/* 弹层列表的自定义滚动条（scoped 对本组件渲染的弹层内容生效） */
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
</style>
