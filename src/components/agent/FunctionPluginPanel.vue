<template>
  <el-config-provider :locale="zhCn">
    <div class="function-plugin-panel">
      <div class="panel-header">
        <h4>功能插件</h4>
        <el-button size="small" :loading="loading" @click="loadPlugins">刷新</el-button>
      </div>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="功能插件把技能与功能调用打包成一个整体开关。插件关掉时，它名下的技能与功能调用同时失效；插件里的技能只能开关，不能增删改。"
      />

      <el-empty v-if="!loading && !plugins.length" description="暂无已注册的功能插件" />

      <el-card v-for="plugin in plugins" :key="plugin.name" shadow="never" class="plugin-card">
        <template #header>
          <div class="plugin-header">
            <div class="plugin-title">
              <span class="plugin-name">{{ plugin.name }}</span>
              <el-tag v-if="!plugin.enabled" type="info" size="small">已关闭</el-tag>
            </div>
            <el-switch
              :model-value="plugin.enabled"
              :loading="pending.has(`plugin:${plugin.name}`)"
              active-text="启用"
              @change="(value: boolean) => togglePlugin(plugin, value)"
            />
          </div>
          <div v-if="plugin.description" class="plugin-desc">{{ plugin.description }}</div>
        </template>

        <div class="member-section">
          <div class="section-title">技能（{{ plugin.skills.length }}）</div>
          <el-table
            v-if="plugin.skills.length"
            :data="plugin.skills"
            size="small"
            :row-class-name="memberRowClass(plugin)"
            empty-text="—"
          >
            <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ row.name }}</span>
                <el-tag v-if="row.missing" type="danger" size="small" class="core-tag">
                  未找到
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="description"
              label="描述"
              min-width="240"
              show-overflow-tooltip
            />
            <el-table-column label="启用" width="90" align="center">
              <template #default="{ row }">
                <el-tooltip
                  :disabled="plugin.enabled"
                  content="插件已关闭，成员开关不生效"
                  placement="top"
                >
                  <span>
                    <el-switch
                      :model-value="row.enabled"
                      :disabled="!plugin.enabled || row.missing"
                      :loading="pending.has(`skill:${row.name}`)"
                      @change="(value: boolean) => toggleSkill(row, value)"
                    />
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="empty-hint">无</div>
        </div>

        <div class="member-section">
          <div class="section-title">功能调用（{{ plugin.functions.length }}）</div>
          <el-table
            v-if="plugin.functions.length"
            :data="plugin.functions"
            size="small"
            :row-class-name="memberRowClass(plugin)"
          >
            <el-table-column prop="name" label="功能名" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ row.name }}</span>
                <el-tag v-if="row.missing" type="danger" size="small" class="core-tag">
                  未注册
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="description"
              label="说明"
              min-width="260"
              show-overflow-tooltip
            />
            <el-table-column label="环境可用性" width="130">
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
            <el-table-column label="启用" width="90" align="center">
              <template #default="{ row }">
                <el-tooltip
                  v-if="!plugin.enabled"
                  content="插件已关闭，成员开关不生效"
                  placement="top"
                >
                  <span>
                    <el-switch :model-value="row.enabled" disabled />
                  </span>
                </el-tooltip>
                <el-tooltip
                  v-else-if="row.always_enabled"
                  content="核心功能，始终启用，不能关闭"
                  placement="top"
                >
                  <span>
                    <el-switch :model-value="row.enabled" disabled />
                  </span>
                </el-tooltip>
                <el-switch
                  v-else
                  :model-value="row.enabled"
                  :disabled="row.missing"
                  :loading="pending.has(`function:${row.name}`)"
                  @change="(value: boolean) => toggleFunction(row, value)"
                />
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="empty-hint">无</div>
        </div>

        <div class="member-section">
          <div class="section-title">不常用功能调用（{{ plugin.rare_functions.length }}）</div>
          <el-table
            v-if="plugin.rare_functions.length"
            :data="plugin.rare_functions"
            size="small"
            :row-class-name="memberRowClass(plugin)"
          >
            <el-table-column prop="name" label="功能名" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ row.name }}</span>
                <el-tag v-if="row.missing" type="danger" size="small" class="core-tag">
                  未注册
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="description"
              label="说明"
              min-width="260"
              show-overflow-tooltip
            />
            <el-table-column label="环境可用性" width="130">
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
            <el-table-column label="启用" width="90" align="center">
              <template #default="{ row }">
                <el-tooltip
                  v-if="!plugin.enabled"
                  content="插件已关闭，成员开关不生效"
                  placement="top"
                >
                  <span>
                    <el-switch :model-value="row.enabled" disabled />
                  </span>
                </el-tooltip>
                <el-tooltip
                  v-else-if="row.always_enabled"
                  content="核心功能，始终启用，不能关闭"
                  placement="top"
                >
                  <span>
                    <el-switch :model-value="row.enabled" disabled />
                  </span>
                </el-tooltip>
                <el-switch
                  v-else
                  :model-value="row.enabled"
                  :disabled="row.missing"
                  :loading="pending.has(`function:${row.name}`)"
                  @change="(value: boolean) => toggleFunction(row, value)"
                />
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="empty-hint">无</div>
          <div class="section-hint">
            不常用功能不进入提示词，由智能体通过 call 功能按需调用；用法通常写在技能正文里。
          </div>
        </div>
      </el-card>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import type {
  FunctionPluginInfo,
  PluginFunctionInfo,
  PluginSkillInfo,
} from '@/types/agent'
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
const plugins = ref<FunctionPluginInfo[]>([])
const pending = ref(new Set<string>())

const markPending = (key: string, on: boolean) => {
  if (on) {
    pending.value.add(key)
  } else {
    pending.value.delete(key)
  }
  pending.value = new Set(pending.value)
}

// 插件关闭时，成员整行灰显，避免误以为"成员开关还生效"
const memberRowClass = (plugin: FunctionPluginInfo) => (row: { missing?: boolean }) =>
  !plugin.enabled || row.missing ? 'row-inactive' : ''

const loadPlugins = async () => {
  loading.value = true
  try {
    const response = await getRequest(`${prefix}/agent/get_function_plugins`)
    const payload = response.data as ResultResponse<FunctionPluginInfo[]>
    if (payload.suc) {
      plugins.value = payload.data || []
    } else {
      message.error(payload.info || '获取功能插件失败')
    }
  } catch (error) {
    console.error('loadPlugins error', error)
    message.error('获取功能插件失败，请检查接口状态')
  } finally {
    loading.value = false
  }
}

const togglePlugin = async (plugin: FunctionPluginInfo, enabled: boolean) => {
  const previous = plugin.enabled
  plugin.enabled = enabled
  markPending(`plugin:${plugin.name}`, true)
  try {
    const response = await postRequest(`${prefix}/agent/set_function_plugin`, {
      name: plugin.name,
      enabled,
    })
    const payload = response.data as ResultResponse<{ name: string; enabled: boolean }>
    if (payload.suc && payload.data) {
      plugin.enabled = payload.data.enabled
      message.success(enabled ? '已启用' : '已关闭')
    } else {
      plugin.enabled = previous
      message.error(payload.info || '设置失败')
    }
  } catch (error) {
    console.error('togglePlugin error', error)
    plugin.enabled = previous
    message.error('设置失败，请检查接口状态')
  } finally {
    markPending(`plugin:${plugin.name}`, false)
  }
}

const toggleSkill = async (skill: PluginSkillInfo, enabled: boolean) => {
  const previous = skill.enabled
  skill.enabled = enabled
  markPending(`skill:${skill.name}`, true)
  try {
    const response = await postRequest(`${prefix}/agent/set_plugin_skill_state`, {
      name: skill.name,
      enabled,
    })
    const payload = response.data as ResultResponse<FunctionPluginInfo>
    if (payload.suc && payload.data) {
      const index = plugins.value.findIndex((item) => item.name === payload.data!.name)
      if (index >= 0) plugins.value[index] = payload.data
      message.success(enabled ? '已启用' : '已关闭')
    } else {
      skill.enabled = previous
      message.error(payload.info || '设置失败')
    }
  } catch (error) {
    console.error('toggleSkill error', error)
    skill.enabled = previous
    message.error('设置失败，请检查接口状态')
  } finally {
    markPending(`skill:${skill.name}`, false)
  }
}

const toggleFunction = async (func: PluginFunctionInfo, enabled: boolean) => {
  const previous = func.enabled
  func.enabled = enabled
  markPending(`function:${func.name}`, true)
  try {
    const response = await postRequest(`${prefix}/agent/set_plugin_function_state`, {
      name: func.name,
      enabled,
    })
    const payload = response.data as ResultResponse<FunctionPluginInfo>
    if (payload.suc && payload.data) {
      const index = plugins.value.findIndex((item) => item.name === payload.data!.name)
      if (index >= 0) plugins.value[index] = payload.data
      message.success(enabled ? '已启用' : '已关闭')
    } else {
      func.enabled = previous
      message.error(payload.info || '设置失败')
    }
  } catch (error) {
    console.error('toggleFunction error', error)
    func.enabled = previous
    message.error('设置失败，请检查接口状态')
  } finally {
    markPending(`function:${func.name}`, false)
  }
}

onMounted(loadPlugins)
</script>

<style scoped>
.function-plugin-panel {
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

.plugin-card + .plugin-card {
  margin-top: 12px;
}

.plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.plugin-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plugin-name {
  font-weight: 600;
}

.plugin-desc {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.member-section + .member-section {
  margin-top: 16px;
}

.section-title {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
}

.section-hint {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.empty-hint {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.core-tag {
  margin-left: 6px;
}

.function-plugin-panel :deep(.row-inactive) {
  color: var(--el-text-color-placeholder);
}
</style>
