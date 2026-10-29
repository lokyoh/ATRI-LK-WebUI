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

      <el-table
        v-loading="loading"
        :data="functionCallings"
        :row-class-name="rowClassName"
        stripe
        empty-text="暂无已注册的功能调用"
      >
        <el-table-column prop="name" label="功能名" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.name }}</span>
            <el-tag v-if="row.always_enabled" type="primary" size="small" class="core-tag">
              核心
            </el-tag>
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
import { computed, inject, onMounted, ref } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import type { FunctionCallingArgInfo, FunctionCallingInfo } from '@/types/agent'
import { getRequest, postRequest } from '@/utils/api'
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
const pending = ref(new Set<string>())

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
      // 插件内功能在「功能插件」页单独管理，这里只留独立功能
      functionCallings.value = all.filter((item) => !item.plugin)
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

.state-effective {
  color: var(--el-color-success);
}

.state-inactive {
  color: var(--el-text-color-secondary);
}

.core-tag {
  margin-left: 6px;
}
</style>
