<template>
  <div class="left-info-container p-4 h-full" ref="leftInfoContainer"
    :style="{ backgroundColor: 'var(--el-fill-color-light)' }">
    <el-row ref="firstRow">
      <el-col :span="24">
        <div class="top-text flex items-center" :style="{ color: 'var(--el-color-primary)' }">
          <el-icon class="icon-bot">
            <Avatar />
          </el-icon>
          在线bot（{{ botList.length }}）
        </div>
        <div class="bot-list" :style="{
          backgroundColor: 'var(--el-bg-color)',
        }">
          <div v-for="bot in botList" :key="bot.self_id" class="bot-item"
            :style="{ backgroundColor: 'var(--el-bg-color)' }">
            <div style="width: 100%">
              <div class="item-ava">
                <el-image :src="bot.ava_url" class="ava-img" :preview-src-list="[bot.ava_url]">
                  <template v-slot:error>
                    <div class="image-slot">
                      <i class="el-icon-picture-outline"></i>
                    </div>
                  </template>
                </el-image>
                <div class="item-info">
                  <div class="info-name">
                    <span class="line-line" :style="{ backgroundColor: 'var(--el-color-primary)' }"></span>
                    <span class="bot-name" :style="{ color: 'var(--el-text-color-primary)' }">{{ bot.nickname }}</span>
                  </div>
                  <div class="info-id">
                    <span class="line-line" :style="{
                      backgroundColor: 'var(--el-color-primary-light-3)',
                    }"></span>
                    <span class="purple-text" :style="{ color: 'var(--el-color-primary-light-3)' }">ID: {{ bot.self_id
                      }}</span>
                  </div>
                </div>
              </div>
              <div class="info-gf rounded-lg p-3 shadow-sm mt-3" :style="{ backgroundColor: 'var(--el-bg-color)' }">
                <div class="flex space-x-3">
                  <div class="gf-item flex-1 flex items-center justify-between rounded-md p-2"
                    :style="{ backgroundColor: 'var(--el-fill-color-lighter)' }">
                    <div class="flex items-center">
                      <el-icon class="blue-icon mr-2" color="var(--el-color-primary)">
                        <User />
                      </el-icon>
                      <span class="text-gray-600" :style="{ color: 'var(--el-text-color-regular)' }">好友</span>
                    </div>
                    <span class="gf-value font-semibold" :style="{ color: 'var(--el-color-primary)' }">{{
                      bot.friend_count }}</span>
                  </div>
                  <div class="gf-item flex-1 flex items-center justify-between rounded-md p-2"
                    :style="{ backgroundColor: 'var(--el-fill-color-lighter)' }">
                    <div class="flex items-center">
                      <el-icon icon-class="group" class="green-icon mr-2" color="var(--el-color-success)">
                        <ChatDotRound />
                      </el-icon>
                      <span class="text-gray-600" :style="{ color: 'var(--el-text-color-regular)' }">群组</span>
                    </div>
                    <span class="gf-value font-semibold" :style="{ color: 'var(--el-color-success)' }">{{
                      bot.group_count }}</span>
                  </div>
                </div>
              </div>
            </div>
            <el-divider class="custom-divider" />
            <div class="bot-detail-info">
              <div class="detail-row">
                <div class="message" :style="{ backgroundColor: 'var(--el-fill-color-lighter)' }">
                  <el-icon icon-class="call" class="pink-icon" color="var(--el-color-primary)">
                    <Phone />
                  </el-icon>
                  <div class="message-content">
                    <span class="message-title" :style="{ color: 'var(--el-text-color-secondary)' }">今日调用</span>
                    <span class="message-value" :style="{ color: 'var(--el-text-color-primary)' }">{{ bot.day_call
                      }}</span>
                  </div>
                </div>
                <div class="message" :style="{ backgroundColor: 'var(--el-fill-color-lighter)' }">
                  <el-icon class="pink-icon" color="var(--el-color-primary)">
                    <Message />
                  </el-icon>
                  <div class="message-content">
                    <span class="message-title" :style="{ color: 'var(--el-text-color-secondary)' }">今日消息</span>
                    <span class="message-value" :style="{ color: 'var(--el-text-color-primary)' }">{{
                      bot.received_messages
                      }}</span>
                  </div>
                </div>
              </div>
              <div class="detail-row">
                <div class="message" :style="{ backgroundColor: 'var(--el-fill-color-lighter)' }">
                  <el-icon class="pink-icon" color="var(--el-color-primary)">
                    <Platform />
                  </el-icon>
                  <div class="message-content">
                    <span class="message-title" :style="{ color: 'var(--el-text-color-secondary)' }">所属平台</span>
                    <span class="message-value" :style="{ color: 'var(--el-text-color-primary)' }">{{ bot.platform
                      }}</span>
                  </div>
                </div>
                <div class="message" :style="{ backgroundColor: 'var(--el-fill-color-lighter)' }">
                  <el-icon class="pink-icon" color="var(--el-color-primary)">
                    <Clock />
                  </el-icon>
                  <div class="message-content">
                    <span class="message-title" :style="{ color: 'var(--el-text-color-secondary)' }">连接时长</span>
                    <span class="message-value" :style="{ color: 'var(--el-text-color-primary)' }">{{ bot.connectTime
                      }}</span>
                  </div>
                </div>
              </div>
              <div class="connect-date" :style="{ backgroundColor: 'var(--el-fill-color-lighter)' }">
                <el-icon class="yellow-icon" :style="{ color: 'var(--el-color-warning)' }">
                  <Calendar />
                </el-icon>
                <span :style="{ color: 'var(--el-text-color-primary)' }">连接日期: {{ bot.connect_date }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang='ts'>
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { message } from "@/utils/message"
import { getRequest } from '@/utils/api'
import { Calendar, Message, Clock, Platform, Avatar, User, ChatDotRound, Phone } from '@element-plus/icons-vue';

const prefix = inject<string>('prefix');

interface BotInfo {
  self_id: string
  nickname: string
  ava_url: string
  platform: string
  friend_count: number
  group_count: number
  received_messages: number
  day_call: number
  connect_time: number
  connect_date: string
  connectTime?: string
}

interface GetBotInfoResponse {
  suc: boolean;
  code: number;
  info: string;
  warning?: string;
  data: BotInfo[];
}

const botList = ref<BotInfo[]>([])
const conTimes = ref<number[]>([])

onMounted(() => {
  getBotList()
})


function formateSeconds(endTime: number): string {
  let secondTime = endTime
  let min = 0
  let h = 0
  let result = ""
  if (secondTime > 60) {
    min = Math.floor(secondTime / 60)
    secondTime = secondTime % 60
    if (min > 60) {
      h = Math.floor(min / 60)
      min = min % 60
    }
  }
  result = `${h.toString().padStart(2, "0")}:${min
    .toString()
    .padStart(2, "0")}:${secondTime.toString().padStart(2, "0")}`
  return result
}

function addInterval(bot: BotInfo) {
  const timerId = setInterval(() => {
    const time = Math.floor(new Date().getTime() / 1000)
    bot.connectTime = formateSeconds(time - bot.connect_time)
  }, 1000)
  conTimes.value.push(timerId)
}

function getBotList() {
  getRequest(`${prefix}/dashboard/get_bot_list`).then(
    (resp: { data: GetBotInfoResponse }) => {
      if (resp.data.suc) {
        if (resp.data.warning) {
          message.warning(resp.data.warning)
        } else {
          message.success(resp.data.info)
          botList.value = resp.data.data
          for (const bot of botList.value) {
            bot.connectTime = "00:00"
            addInterval(bot)
          }
        }
      } else {
        message.error(resp.data.info)
      }
    }
  )
}

onUnmounted(() => {
  if (conTimes.value) {
    for (const timer of conTimes.value) {
      clearInterval(timer)
    }
  }
})
</script>

<style scoped>
.left-info-container {
  height: 100%;
  font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
  font-size: var(--font-size-md);
}

.top-text {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  border-left: 4px solid var(--el-color-primary);
}

.icon-bot {
  width: 1em;
  height: 1em;
  margin-right: 0.5em;
  color: var(--el-color-primary);
}

.bot-list {
  overflow: auto;
  padding: 1em;
  border-radius: 0.75em;
  box-shadow: var(--el-box-shadow-light);
}

.bot-item {
  margin-bottom: 1.25em;
  padding: 1em;
  border-radius: 0.625em;
  box-shadow: var(--el-box-shadow-lighter);
  transition: all 0.3s ease;
}

.bot-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}

.item-ava {
  display: flex;
  align-items: flex-start;
}

.ava-img {
  width: 6.25em;
  height: 6.25em;
  border-radius: 0.75em;
  margin-right: 1em;
  border: 0.1875em solid var(--el-color-primary-light-8);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.ava-img:hover {
  transform: scale(1.05);
  border-color: var(--el-color-primary);
}

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.item-info {
  flex-grow: 1;
  min-width: 0;
}

.info-name {
  display: flex;
  align-items: center;
  margin-bottom: 0.5em;
}

.line-line {
  width: 0.25em;
  height: 1.125em;
  border-radius: 0.25em;
  margin-right: 0.625em;
}

.bot-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-id {
  display: flex;
  align-items: center;
  font-size: var(--font-size-sm);
  margin-bottom: 0.625em;
}

.info-gf {
  width: 100%;
}

.gf-item {
  font-size: var(--font-size-sm);
  width: 100%;
  transition: all 0.3s ease;
}

.gf-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--el-box-shadow-lighter);
}

.gf-value {
  font-weight: 600;
  font-size: var(--font-size-md);
}

.custom-divider {
  margin: 0.75em 0;
  background-color: var(--el-border-color-light);
}

.bot-detail-info {
  padding-top: 0.625em;
}

.detail-row {
  display: flex;
  gap: 1em;
  margin-bottom: 0.75em;
}

.message {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0.5em 0.75em;
  border-radius: 0.5em;
  transition: all 0.3s ease;
}

.message:hover {
  background: var(--el-fill-color-light);
}

.pink-icon,
.purple-icon {
  width: 1.25em;
  height: 1.25em;
  margin-right: 0.625em;
}

.message-content {
  display: flex;
  flex-direction: column;
}

.message-title {
  font-size: var(--font-size-sm);
  margin-bottom: 0.125em;
}

.message-value {
  font-size: var(--font-size-md);
  font-weight: 600;
}

.connect-date {
  display: flex;
  align-items: center;
  padding: 0.5em 0.75em;
  border-radius: 0.5em;
  font-size: var(--font-size-sm);
  margin-top: 0.625em;
}

.connect-log {
  margin-top: 1.1em;
  padding: 1em;
  border-radius: 0.75em;
  box-shadow: var(--el-box-shadow-light);
  box-sizing: border-box;
}

.base-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: 1em;
  display: flex;
  align-items: center;
  padding-bottom: 0.5em;
  border-bottom: 1px dashed var(--el-border-color-light);
}

.icon-log {
  margin-right: 0.5em;
  color: var(--el-color-primary);
  width: 1em;
  height: 1em;
}

.log-table {
  border-radius: 0.5em;
  overflow: hidden;
}

.custom-tag {
  border-radius: 0.75em;
  padding: 0 0.625em;
  height: 1.625em;
  line-height: 1.625em;
  min-width: 3.75em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pagination {
  margin-top: 1em;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .left-info-container {
    padding: 0.625em 0.625em 1.25em;
  }

  .bot-item {
    padding: 0.625em;
  }

  .item-ava {
    flex-direction: column;
    align-items: flex-start;
  }

  .ava-img {
    width: 5em;
    height: 5em;
    margin-right: 0;
    margin-bottom: 0.625em;
  }

  .detail-row {
    flex-direction: column;
    gap: 0.5em;
  }

  .el-pagination button,
  .el-pagination li {
    margin: 0 0.125em;
  }

  .el-pagination .btn-prev,
  .el-pagination .btn-next,
  .el-pagination .number {
    min-width: 1.75em;
    height: 1.75em;
    line-height: 1.75em;
  }
}

@media (max-width: 480px) {
  .left-info-container {
    padding: 0.75em 0.5em 1.5em;
  }

  .ava-img {
    width: 4em;
    height: 4em;
  }

  .message {
    padding: 0.375em 0.5em;
  }

  .connect-log {
    padding: 0.75em;
  }
}
</style>
