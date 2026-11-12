<template>
  <section class="status-config">
    <header class="config-header">
      <div>
        <h2>{{ scope === 'global' ? '机器人全局配置' : '机器人专项配置' }}</h2>
        <p>
          {{
            scope === 'global'
              ? '对所有机器人生效；机器人专项规则会在全局规则之后继续校验。'
              : '仅对当前机器人生效；规则与全局配置同时生效。'
          }}
        </p>
      </div>
      <el-button :loading="loading" :disabled="saving || (!isGlobal && !botId)" @click="loadConfig">
        刷新
      </el-button>
    </header>

    <div v-loading="loading" class="config-content">
      <div class="config-row">
        <span>启用机器人</span>
        <el-switch v-model="config.enable" />
      </div>

      <div class="rule-field">
        <div class="field-header">
          <span>用户规则</span>
          <el-select v-model="config.is_user_black_list" aria-label="用户规则模式" size="small">
            <el-option label="黑名单" :value="true" />
            <el-option label="白名单" :value="false" />
          </el-select>
        </div>
        <div class="list-editor">
          <div v-for="(item, index) in userList" :key="index" class="list-editor-row">
            <el-input
              :model-value="item"
              placeholder="用户 ID"
              @update:model-value="updateUser(index, $event)"
            />
            <el-button
              type="danger"
              plain
              :icon="Delete"
              circle
              aria-label="删除用户"
              @click="removeUser(index)"
            />
          </div>
          <el-button class="config-add-button" type="primary" plain :icon="Plus" @click="addUser">
            添加
          </el-button>
        </div>
      </div>

      <div class="rule-field">
        <div class="field-header">
          <span>群组规则</span>
          <el-select v-model="config.is_group_black_list" aria-label="群组规则模式" size="small">
            <el-option label="黑名单" :value="true" />
            <el-option label="白名单" :value="false" />
          </el-select>
        </div>
        <div class="list-editor">
          <div v-for="(item, index) in groupList" :key="index" class="list-editor-row">
            <el-input
              :model-value="item"
              placeholder="群组 ID"
              @update:model-value="updateGroup(index, $event)"
            />
            <el-button
              type="danger"
              plain
              :icon="Delete"
              circle
              aria-label="删除群组"
              @click="removeGroup(index)"
            />
          </div>
          <el-button class="config-add-button" type="primary" plain :icon="Plus" @click="addGroup">
            添加
          </el-button>
        </div>
      </div>
    </div>

    <footer class="config-footer">
      <el-button
        type="primary"
        :loading="saving"
        :disabled="loading || saving || (!isGlobal && !botId)"
        @click="saveConfig"
      >
        保存配置
      </el-button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import { getRequest, postRequest } from '@/utils/api'
import { message } from '@/utils/message'

type ConfigScope = 'bot' | 'global'

interface Props {
  scope: ConfigScope
  botId?: string
}

interface StatusConfig {
  enable: boolean
  is_group_black_list: boolean
  is_user_black_list: boolean
  group_black_list: string[]
  user_black_list: string[]
  group_white_list: string[]
  user_white_list: string[]
}

interface ApiResult<T> {
  suc: boolean
  info: string
  warning?: string
  data?: T
}

const props = defineProps<Props>()
const prefix = inject<string>('prefix') as string
const loading = ref(false)
const saving = ref(false)
const isGlobal = computed(() => props.scope === 'global')
const config = ref<StatusConfig>(createEmptyConfig())

//: 当前模式对应的实际列表。黑/白名单是两份独立数据，
//: 切换模式只换「在编辑哪一份」，不能互相覆盖。
const userList = computed(() =>
  config.value.is_user_black_list
    ? config.value.user_black_list
    : config.value.user_white_list,
)

const groupList = computed(() =>
  config.value.is_group_black_list
    ? config.value.group_black_list
    : config.value.group_white_list,
)

function setUserList(next: string[]) {
  const cleaned = next.map((item) => item.trim())
  if (config.value.is_user_black_list) {
    config.value.user_black_list = cleaned
  } else {
    config.value.user_white_list = cleaned
  }
}

function setGroupList(next: string[]) {
  const cleaned = next.map((item) => item.trim())
  if (config.value.is_group_black_list) {
    config.value.group_black_list = cleaned
  } else {
    config.value.group_white_list = cleaned
  }
}

function addUser() {
  setUserList([...userList.value, ''])
}

function removeUser(index: number) {
  setUserList(userList.value.filter((_, i) => i !== index))
}

function updateUser(index: number, value: string) {
  const next = [...userList.value]
  next[index] = value
  setUserList(next)
}

function addGroup() {
  setGroupList([...groupList.value, ''])
}

function removeGroup(index: number) {
  setGroupList(groupList.value.filter((_, i) => i !== index))
}

function updateGroup(index: number, value: string) {
  const next = [...groupList.value]
  next[index] = value
  setGroupList(next)
}

watch(
  () => (props.scope === 'global' ? 'global' : props.botId),
  () => void loadConfig(),
  { immediate: true },
)

function createEmptyConfig(): StatusConfig {
  return {
    enable: true,
    is_group_black_list: true,
    is_user_black_list: true,
    group_black_list: [],
    user_black_list: [],
    group_white_list: [],
    user_white_list: [],
  }
}

async function loadConfig() {
  if (!isGlobal.value && !props.botId) {
    config.value = createEmptyConfig()
    return
  }

  loading.value = true
  try {
    const endpoint = isGlobal.value ? '/main/get_global_config' : '/main/get_bot_config'
    const params = isGlobal.value ? undefined : { bot_id: props.botId }
    const resp = await getRequest(`${prefix}${endpoint}`, params)
    const result = resp.data as ApiResult<StatusConfig>
    if (!result.suc || !result.data) {
      message.error(result.info || '获取机器人配置失败')
      return
    }
    config.value = { ...createEmptyConfig(), ...result.data }
  } catch (error) {
    console.error('获取机器人配置失败:', error)
    message.error(error instanceof Error ? `获取配置失败：${error.message}` : '获取配置失败')
  } finally {
    loading.value = false
  }
}

/** 空行是「点了添加还没填」，存进去会变成一条无意义的空 ID。 */
function compact(list: string[]): string[] {
  return list.map((item) => item.trim()).filter(Boolean)
}

async function saveConfig() {
  if (!isGlobal.value && !props.botId) return

  const payload: StatusConfig = {
    ...config.value,
    user_black_list: compact(config.value.user_black_list),
    user_white_list: compact(config.value.user_white_list),
    group_black_list: compact(config.value.group_black_list),
    group_white_list: compact(config.value.group_white_list),
  }

  saving.value = true
  try {
    const endpoint = isGlobal.value ? '/main/update_global_config' : '/main/update_bot_config'
    const data = isGlobal.value
      ? payload
      : {
          bot_id: props.botId,
          config: payload,
        }
    const resp = await postRequest(`${prefix}${endpoint}`, data)
    const result = resp.data as ApiResult<unknown>
    if (result.suc) {
      message.success(result.info || '机器人配置已保存')
    } else {
      message.error(result.info || '保存机器人配置失败')
    }
  } catch (error) {
    console.error('保存机器人配置失败:', error)
    message.error(error instanceof Error ? `保存配置失败：${error.message}` : '保存配置失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.status-config {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1.125rem;
  border: 1px solid var(--border-color-light);
  border-radius: 1rem;
  background-color: var(--bg-color-secondary);
  box-shadow: var(--el-box-shadow-light);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.status-config:hover {
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--border-color-light));
}

.config-header,
.field-header,
.config-row,
.config-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.config-header h2 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1rem;
  font-weight: 700;
}

.config-header p {
  margin: 0.35rem 0 0;
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  line-height: 1.4;
}

.config-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-row,
.rule-field {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.rule-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 与「LK插件配置」里的列表编辑器保持同一套观感 */
.list-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-editor-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-editor-row :deep(.el-input) {
  flex: 1;
}

.config-add-button {
  align-self: flex-start;
}

.config-footer {
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .config-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
