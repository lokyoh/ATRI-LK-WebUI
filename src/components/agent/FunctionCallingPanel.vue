<template>
  <el-config-provider :locale="zhCn">
    <div class="function-calling-panel">
      <div class="panel-header">
        <h4>功能调用</h4>
        <el-button size="small" :loading="loading" @click="loadFunctionCallings">刷新</el-button>
      </div>

      <el-alert
        v-if="!listSkillsEnabled"
        type="warning"
        :closable="false"
        show-icon
        title="list_skills 已关闭：非内嵌技能将无法被智能体查询。"
      />

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="属于功能插件的功能调用在「功能插件」页管理，不在此页展示。"
      />

      <div class="explain-box">
        <div class="explain-header">
          <span class="explain-title">权限查询</span>
          <span class="explain-sub"
            >查某个等级 / 某个用户为什么能用或不能用某个功能，走后端同一条求值链，不会写日志。</span
          >
        </div>
        <div class="explain-form">
          <el-select
            v-model="explainForm.function"
            size="small"
            filterable
            allow-create
            default-first-option
            placeholder="功能名"
            class="explain-function"
          >
            <el-option v-for="item in allNames" :key="item" :label="item" :value="item" />
          </el-select>
          <el-select v-model="explainForm.level" size="small" class="explain-level">
            <el-option
              v-for="level in LEVEL_ORDER"
              :key="level"
              :label="LEVEL_LABELS[level]"
              :value="level"
            />
            <el-option label="系统（无对话人）" value="system" />
          </el-select>
          <el-input
            v-model="explainForm.userId"
            size="small"
            clearable
            placeholder="用户 ID（可空）"
            class="explain-input"
          />
          <el-input
            v-model="explainForm.groupId"
            size="small"
            clearable
            placeholder="群号（可空）"
            class="explain-input"
          />
          <el-input
            v-model="explainForm.action"
            size="small"
            clearable
            placeholder="动作（可空）"
            class="explain-input"
          />
          <el-checkbox v-model="explainForm.isPrivate" size="small">私聊</el-checkbox>
          <el-button
            size="small"
            type="primary"
            :loading="explainLoading"
            :disabled="!explainForm.function.trim()"
            @click="runExplain"
            >查询</el-button
          >
        </div>
        <div v-if="explainResult" class="explain-result">
          <el-tag size="small" :type="explainResult.allowed ? 'success' : 'danger'">
            {{ explainResult.allowed ? '允许' : '拒绝' }}
          </el-tag>
          <span class="explain-reason">{{ explainResult.reason }}</span>
          <el-tag size="small" effect="plain">
            作用域 {{ SCOPE_LABELS[explainResult.scope] || explainResult.scope }}
          </el-tag>
          <el-tag v-if="explainResult.action" size="small" effect="plain">
            动作 {{ explainResult.action }}
          </el-tag>
          <ol v-if="explainResult.chain.length" class="explain-chain">
            <li v-for="(step, index) in explainResult.chain" :key="index">{{ step }}</li>
          </ol>
          <div v-else class="explain-chain-empty">后端没有给出求值链。</div>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="functionCallings"
        :row-class-name="rowClassName"
        :tooltip-options="overflowTooltipOptions"
        stripe
        empty-text="暂无已注册的功能调用"
      >
        <el-table-column prop="name" label="功能名" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.name }}</span>
            <el-tag v-if="row.always_enabled" type="primary" size="small" class="core-tag">
              核心
            </el-tag>
            <el-tooltip
              v-if="row.rare"
              content="不常用功能：不进提示词，只能经 call 调用"
              placement="top"
            >
              <el-tag type="warning" size="small" class="core-tag">不常用</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          prop="description"
          label="说明"
          min-width="260"
          show-overflow-tooltip
        />
        <el-table-column label="参数摘要" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatArgs(row.args) }}
          </template>
        </el-table-column>
        <el-table-column label="手动开关" width="110" align="center">
          <template #default="{ row }">
            <el-tooltip
              :disabled="!row.always_enabled"
              content="核心功能，始终启用，不能关闭"
              placement="top"
            >
              <span>
                <el-switch
                  :model-value="row.manually_enabled"
                  :loading="pending.has(row.name)"
                  :disabled="row.always_enabled"
                  @change="(value: boolean) => toggleFunctionCalling(row.name, value)"
                />
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="默认权限" min-width="230">
          <template #default="{ row }">
            <div class="permission-cell">
              <el-tooltip
                v-for="level in LEVEL_ORDER"
                :key="level"
                :disabled="!row.permission?.[level]?.chain?.length"
                placement="top"
              >
                <template #content>
                  <div class="permission-chain">
                    {{ (row.permission?.[level]?.chain || []).join(' → ') }}
                  </div>
                </template>
                <el-tag
                  size="small"
                  :type="row.permission?.[level]?.allowed ? 'success' : 'info'"
                >
                  {{ LEVEL_LABELS[level] }}
                </el-tag>
              </el-tooltip>
              <span class="scope-label">{{ SCOPE_LABELS[row.scope] || row.scope }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="环境可用性" min-width="130">
          <template #default="{ row }">
            <el-tag v-if="row.can_enable" type="success" size="small">可用</el-tag>
            <el-tooltip
              v-else
              :content="row.can_enable_reason || '当前环境不支持该功能'"
              placement="top"
            >
              <el-tag type="info" size="small">不可用</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="生效状态" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="isEffective(row)" class="state-effective">已生效</span>
            <span v-else class="state-inactive">
              {{
                !row.manually_enabled
                  ? '当前不会出现在智能体功能列表中（手动关闭）'
                  : '当前不会出现在智能体功能列表中（环境不可用）'
              }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import {
  LEVEL_LABELS,
  LEVEL_ORDER,
  SCOPE_LABELS,
  type FunctionCallingArgInfo,
  type FunctionCallingInfo,
  type PermissionDecisionInfo,
} from '@/types/agent'
import { getRequest, postRequest } from '@/utils/api'
import { overflowTooltipOptions } from '@/utils/table'
import { message } from '@/utils/message'

interface ResultResponse<T> {
  suc: boolean
  code: number
  info: string
  data?: T
}

const prefix = inject<string>('prefix', '/atri/api')
const loading = ref(false)
const functionCallings = ref<FunctionCallingInfo[]>([])
const allFunctionNames = ref<string[]>([])
const pending = ref(new Set<string>())

const allNames = computed(() => {
  const seen = new Set(allFunctionNames.value)
  for (const item of functionCallings.value) seen.add(item.name)
  return [...seen].sort()
})

const explainLoading = ref(false)
const explainResult = ref<PermissionDecisionInfo | null>(null)
const explainForm = reactive({
  function: '',
  level: 'user',
  userId: '',
  groupId: '',
  action: '',
  isPrivate: false,
})

async function runExplain() {
  const name = explainForm.function.trim()
  if (!name) return
  explainLoading.value = true
  try {
    const response = await getRequest(`${prefix}/agent/explain_permission`, {
      function: name,
      level: explainForm.level,
      user_id: explainForm.userId.trim(),
      group_id: explainForm.groupId.trim(),
      action: explainForm.action.trim(),
      is_private: explainForm.isPrivate,
    })
    const payload = response.data as ResultResponse<PermissionDecisionInfo>
    explainResult.value = payload.suc ? payload.data || null : null
    if (!payload.suc) message.error(payload.info || '权限查询失败')
  } catch (error) {
    console.error('explainPermission error', error)
    explainResult.value = null
    message.error('权限查询失败，请检查接口状态')
  } finally {
    explainLoading.value = false
  }
}

const listSkillsEnabled = computed(() => {
  const target = functionCallings.value.find((item) => item.name === 'list_skills')
  // 未注册时不提示（避免误导）
  return target ? target.manually_enabled && target.can_enable : true
})

const formatArgs = (args: FunctionCallingArgInfo[]) =>
  args.length ? args.map((arg) => `${arg.name}:${arg.type}`).join(', ') : '—'

const isEffective = (row: FunctionCallingInfo) => row.manually_enabled && row.can_enable

const rowClassName = ({ row }: { row: FunctionCallingInfo }) =>
  isEffective(row) ? '' : 'row-inactive'

const loadFunctionCallings = async () => {
  loading.value = true
  try {
    const response = await getRequest(`${prefix}/agent/get_function_callings`)
    const payload = response.data as ResultResponse<FunctionCallingInfo[]>
    if (payload.suc) {
      const all = payload.data || []
      allFunctionNames.value = all.map((item) => item.name)
      // 插件内常用功能在「功能插件」页管理；不常用功能只在这里可见，
      // 否则「call 能调什么」在 UI 上完全没有入口。
      functionCallings.value = all.filter((item) => !item.plugin || item.rare)
    } else {
      message.error(payload.info || '获取功能调用失败')
    }
  } catch (error) {
    console.error('loadFunctionCallings error', error)
    message.error('获取功能调用失败，请检查接口状态')
  } finally {
    loading.value = false
  }
}

const toggleFunctionCalling = async (name: string, enabled: boolean) => {
  const target = functionCallings.value.find((item) => item.name === name)
  if (!target) return
  // 核心功能（stop_thinking / send_message）后端不允许关闭，这里也直接拦下
  if (target.always_enabled && !enabled) {
    message.warning('核心功能不能关闭')
    return
  }
  const previous = target.manually_enabled
  // 乐观更新
  target.manually_enabled = enabled
  pending.value.add(name)
  pending.value = new Set(pending.value)
  try {
    const response = await postRequest(`${prefix}/agent/set_function_calling`, {
      name,
      enabled,
    })
    const payload = response.data as ResultResponse<{
      name: string
      manually_enabled: boolean
    }>
    if (payload.suc && payload.data) {
      target.manually_enabled = payload.data.manually_enabled
      message.success(enabled ? '已开启' : '已关闭')
    } else {
      target.manually_enabled = previous
      message.error(payload.info || '设置失败')
    }
  } catch (error) {
    console.error('toggleFunctionCalling error', error)
    target.manually_enabled = previous
    message.error('设置失败，请检查接口状态')
  } finally {
    pending.value.delete(name)
    pending.value = new Set(pending.value)
  }
}

onMounted(loadFunctionCallings)
</script>

<style scoped>
.function-calling-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
}

.function-calling-panel :deep(.row-inactive) {
  color: var(--el-text-color-placeholder);
}

.permission-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.scope-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.permission-chain {
  max-width: 320px;
  line-height: 1.5;
}

.state-effective {
  color: var(--el-color-success);
}

.state-inactive {
  color: var(--el-text-color-secondary);
}

.core-tag {
  margin-left: 6px;
}

.explain-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--bg-color);
}

.explain-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.explain-title {
  font-weight: 600;
  font-size: 14px;
}

.explain-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.explain-form {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.explain-function {
  width: 180px;
}

.explain-level {
  width: 140px;
}

.explain-input {
  width: 150px;
}

.explain-result {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 6px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.explain-reason {
  font-size: 13px;
}

.explain-chain {
  margin: 4px 0 0;
  padding-left: 20px;
  width: 100%;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.explain-chain-empty {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
