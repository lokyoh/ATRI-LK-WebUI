<template>
  <div class="home-panel">
    <div class="panel-header">
      <h4>亚托莉的家</h4>
      <div class="header-actions">
        <el-button size="small" :loading="loading" @click="load">刷新</el-button>
        <el-button size="small" type="primary" plain :loading="generating" @click="generate">
          让她扩写
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="summary"
      type="info"
      :closable="false"
      class="summary-alert"
      title="提示词里她看到的版本"
    >
      <pre class="summary-text">{{ summary }}</pre>
    </el-alert>

    <div class="section-grid">
      <div v-for="section in textSections" :key="section.key" class="section-card">
        <div class="section-head">
          <span class="section-title">{{ section.key }}</span>
          <span class="section-hint">{{ section.hint }}</span>
        </div>
        <el-input
          :model-value="sections[section.key] || ''"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 8 }"
          :disabled="saving === section.key"
          @update:model-value="(value: string) => (sections[section.key] = value)"
        />
        <el-button
          size="small"
          type="primary"
          :loading="saving === section.key"
          @click="saveSection(section.key)"
        >
          保存本节
        </el-button>
      </div>
    </div>

    <div class="section-card">
      <div class="section-head">
        <span class="section-title">房间</span>
        <span class="section-hint">房间名会进提示词，描述不会</span>
        <el-button size="small" plain @click="addRoom">新增房间</el-button>
      </div>
      <div class="room-list">
        <div v-for="(room, index) in rooms" :key="index" class="room-row">
          <el-input v-model="room.name" size="small" class="room-name" placeholder="房间名" />
          <el-input
            v-model="room.body"
            size="small"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="这个房间有什么"
          />
          <el-button
            size="small"
            type="danger"
            plain
            :disabled="rooms.length <= 1"
            @click="rooms.splice(index, 1)"
          >
            删除
          </el-button>
        </div>
      </div>
      <el-button
        size="small"
        type="primary"
        :loading="saving === '房间'"
        @click="saveRooms"
      >
        保存房间
      </el-button>
    </div>

    <div class="section-card">
      <div class="section-head">
        <span class="section-title">容器</span>
        <span class="section-hint">衣柜、冰箱、相册这类能装东西的地方；不进提示词</span>
        <el-button size="small" plain @click="addContainer">新增容器</el-button>
      </div>
      <div v-for="(container, index) in containers" :key="index" class="container-card">
        <div class="container-head">
          <el-input v-model="container.name" size="small" class="container-name" placeholder="容器名" />
          <el-button
            size="small"
            type="danger"
            plain
            :disabled="containers.length <= 1"
            @click="containers.splice(index, 1)"
          >
            删除容器
          </el-button>
        </div>
        <div v-for="(item, itemIndex) in container.items" :key="itemIndex" class="item-row">
          <el-input
            v-model="container.items[itemIndex]"
            size="small"
            class="item-input"
            placeholder="名称：说明"
          />
          <el-button
            size="small"
            type="danger"
            plain
            @click="container.items.splice(itemIndex, 1)"
          >
            删除
          </el-button>
        </div>
        <el-button size="small" plain @click="container.items.push('')">添加物品</el-button>
      </div>
      <el-button
        size="small"
        type="primary"
        :loading="saving === '容器'"
        @click="saveContainers"
      >
        保存容器
      </el-button>
    </div>

    <el-collapse class="raw-collapse">
      <el-collapse-item name="raw">
        <template #title>
          <span class="section-title">完整文件</span>
          <span class="section-hint raw-hint">生成穿搭时会读「衣柜」容器的物品</span>
        </template>
        <pre class="raw-text">{{ content }}</pre>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<script setup lang="ts">
import { computed, inject, reactive, ref } from 'vue'
import { getRequest, postRequest } from '@/utils/api'
import { message } from '@/utils/message'
import { HOME_TEXT_SECTIONS, type HomeContainer, type HomeInfo, type HomeRoom } from '@/types/agent-home'

const prefix = inject<string>('prefix')
const loading = ref(false)
const generating = ref(false)
const saving = ref('')
const content = ref('')
const summary = ref('')
const sections = reactive<Record<string, string>>({})
const rooms = reactive<HomeRoom[]>([])
const containers = reactive<HomeContainer[]>([])

const textSections = computed(() => HOME_TEXT_SECTIONS)

function apply(data: HomeInfo) {
  content.value = data.content
  summary.value = data.summary
  for (const { key } of HOME_TEXT_SECTIONS) {
    sections[key] = data.sections?.[key] ?? ''
  }
  rooms.splice(0, rooms.length, ...(data.rooms ?? []).map((room) => ({ ...room })))
  containers.splice(
    0,
    containers.length,
    ...(data.containers ?? []).map((item) => ({ name: item.name, items: [...item.items] })),
  )
}

async function load() {
  loading.value = true
  try {
    const response = await getRequest(`${prefix}/agent/get_life`)
    if (response.data.suc) apply(response.data.data.home)
    else message?.error(response.data.info)
  } catch (error) {
    console.error('读取家的内容失败:', error)
    message?.error('读取家的内容失败')
  } finally {
    loading.value = false
  }
}

async function submit(action: string, section = '', body = '') {
  const response = await postRequest(`${prefix}/agent/set_home`, { action, section, content: body })
  if (!response.data.suc) {
    message?.error(response.data.info)
    return false
  }
  apply(response.data.data)
  message?.success(response.data.info)
  return true
}

async function saveSection(key: string) {
  saving.value = key
  try {
    await submit('replace', key, sections[key] ?? '')
  } catch (error) {
    console.error('保存家失败:', error)
    message?.error('保存失败')
  } finally {
    saving.value = ''
  }
}

/** 房间按「### 名称 + 描述」重写整节，容器同理；这样增删都只是重排文本。 */
function roomsMarkdown() {
  return rooms
    .filter((room) => room.name.trim())
    .map((room) => `### ${room.name.trim()}\n${room.body.trim()}\n`)
    .join('\n')
}

async function saveRooms() {
  if (!rooms.filter((room) => room.name.trim()).length) {
    message?.warning('至少留一个房间')
    return
  }
  saving.value = '房间'
  try {
    await submit('replace', '房间', roomsMarkdown())
  } catch (error) {
    console.error('保存房间失败:', error)
    message?.error('保存房间失败')
  } finally {
    saving.value = ''
  }
}

function containersMarkdown() {
  return containers
    .filter((item) => item.name.trim())
    .map((item) => {
      const lines = item.items
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `- ${line}`)
        .join('\n')
      return `### ${item.name.trim()}\n${lines}\n`
    })
    .join('\n')
}

async function saveContainers() {
  saving.value = '容器'
  try {
    await submit('replace', '容器', containersMarkdown())
  } catch (error) {
    console.error('保存容器失败:', error)
    message?.error('保存容器失败')
  } finally {
    saving.value = ''
  }
}

function addRoom() {
  rooms.push({ name: '', body: '' })
}

function addContainer() {
  containers.push({ name: '', items: [''] })
}

async function generate() {
  generating.value = true
  try {
    await submit('generate')
  } catch (error) {
    console.error('生成家失败:', error)
    message?.error('生成失败')
  } finally {
    generating.value = false
  }
}

load()
</script>

<style scoped>
.home-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.summary-alert :deep(.el-alert__description) {
  margin: 0;
}

.summary-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.section-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.section-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-bg-color-overlay);
}

.section-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.section-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-hint {
  flex: 1;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.section-card > .el-button {
  align-self: flex-start;
}

.room-list,
.container-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.container-card {
  padding: 10px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}

.room-row,
.item-row,
.container-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.item-input {
  flex: 1;
  min-width: 0;
}

.raw-collapse :deep(.el-collapse-item__header) {
  gap: 10px;
}

.raw-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.room-name,
.container-name {
  flex: 0 0 140px;
}

.raw-text {
  margin: 0;
  padding: 12px;
  overflow-x: auto;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  line-height: 1.7;
}
</style>
