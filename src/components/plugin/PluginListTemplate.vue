<template>
  <div class="plugin-list-container h-full overflow-auto">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      <div
        v-for="data in dataList"
        :key="data.plugin_name"
        class="plugin-card relative rounded-xl p-4 transition-all duration-300 cursor-pointer"
        :class="{
          'border-2 border-transparent hover:border-opacity-50': true,
        }"
        :style="{
          borderColor: 'var(--border-color-light)',
          boxShadow: 'none',
          background: 'var(--bg-color-secondary)',
        }"
        @click="showDetail(data)"
      >
        <!-- 选中标记 - 已移除 -->

        <!-- 插件内容 -->
        <div class="flex flex-col h-full">
          <!-- 插件名称和版本 -->
          <div class="flex items-baseline mb-1">
            <h3 class="text-lg font-bold truncate" :style="{ color: 'var(--primary-color)' }">
              {{ data.plugin_name }}
            </h3>
            <span
              class="ml-2 text-xs px-1.5 py-0.5 rounded-full"
              :style="{
                color: 'var(--primary-color)',
                backgroundColor: 'var(--bg-color-hover)',
              }"
              >v{{ data.version }}</span
            >
          </div>

          <!-- 模块和作者 -->
          <p class="text-sm mb-2 truncate" :style="{ color: 'var(--text-color-secondary)' }">
            <span class="font-mono">{{ data.module }}</span>
            <span v-if="data.author" class="ml-2" :style="{ color: 'var(--primary-color-light)' }"
              >@{{ data.author }}</span
            >
          </p>

          <!-- 底部按钮区域 - 右侧横向排列 -->
          <div
            class="flex justify-end items-center mt-3 pt-2"
            :style="{ borderTop: '1px solid var(--border-color-light)' }"
          >
            <!-- 开关 -->
            <div
              v-if="data.allow_switch"
              class="flex items-center"
              title="切换插件状态"
              @click.stop
            >
              <MySwitch v-model="data.status" @change="onSwitchChange(data, $event)" />
              <span
                class="ml-2 text-xs"
                :style="{
                  color: data.status ? 'var(--el-color-success)' : 'var(--el-color-danger)',
                }"
                >{{ data.status ? '开启' : '关闭' }}</span
              >
            </div>

            <!-- 配置按钮 -->
            <NormalButton
              v-if="data.allow_setting"
              class="fas fa-cog text-lg"
              iconClass="setting"
              text="配置"
              title="插件配置"
              baseClass="hover:scale-110"
              activeClass="bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800"
              @click.stop="openSetting(data)"
            />

            <!-- 卸载按钮 -->
            <NormalButton
              v-if="!data.is_builtin"
              text="卸载"
              iconClass="uninstall-purple"
              title="卸载插件"
              :base-class="'hover:scale-110'"
              :active-class="'bg-purple-100 text-purple-600 hover:bg-purple-200 hover:text-purple-800'"
              @click="uninstallPlugin(data)"
            />
          </div>
        </div>
      </div>
    </div>

    <UpdateDialog
      v-if="dialogVisible"
      :service="pluginModule"
      v-model:visible="dialogVisible"
      @close="closeSetting(false)"
    />

    <!-- 插件详情对话框 -->
    <NeonDialog
      v-model:visible="detailDialogVisible"
      title="插件详情"
      icon-class="info"
      @confirm="handleDetailConfirm"
      class="detail-dialog"
      :close-on-click-modal="true"
    >
      <div v-if="currentPluginDetail" class="detail-content">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h4 class="font-bold mb-2" :style="{ color: 'var(--primary-color)' }">
            <i class="fas fa-info-circle mr-2"></i>基本信息
          </h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-500">插件名称：</span>
              <span :style="{ color: 'var(--primary-color)' }">{{
                currentPluginDetail.plugin_name
              }}</span>
            </div>
            <div>
              <span class="text-gray-500">版本：</span>
              <span>{{ currentPluginDetail.version }}</span>
            </div>
            <div v-if="currentPluginDetail.author">
              <span class="text-gray-500">作者：</span>
              <span>{{ currentPluginDetail.author }}</span>
            </div>
            <div>
              <span class="text-gray-500">类型：</span>
              <span>{{ currentPluginDetail.type }}</span>
            </div>
            <div>
              <span class="text-gray-500">状态：</span>
              <span
                :style="{
                  color: currentPluginDetail.status
                    ? 'var(--el-color-success)'
                    : 'var(--el-color-danger)',
                }"
                class="text-sm font-medium"
              >
                {{ currentPluginDetail.status ? '启用' : '禁用' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 描述信息 -->
        <div v-if="currentPluginDetail.docs" class="detail-section">
          <h4 class="font-bold mb-2" :style="{ color: 'var(--primary-color)' }">
            <i class="fas fa-align-left mr-2"></i>描述
          </h4>
          <p class="text-sm leading-relaxed" :style="{ color: 'var(--text-color)' }">
            {{ currentPluginDetail.docs }}
          </p>
        </div>

        <!-- 配置区域（所有插件都显示） -->
        <div class="detail-section">
          <h4 class="font-bold mb-2" :style="{ color: 'var(--primary-color)' }">
            <i class="fas fa-cog mr-2"></i>配置设置
          </h4>
          <div class="space-y-4">
            <!-- 第一行：启用状态和白名单模式 -->
            <div class="grid grid-cols-2 gap-4">
              <div
                class="flex items-center justify-between p-3 rounded-lg"
                :style="{ background: 'var(--bg-color)' }"
              >
                <span class="text-sm font-medium">启用状态</span>
                <MySwitch v-model="editData.configs.enabled" />
              </div>
              <div
                class="flex items-center justify-between p-3 rounded-lg"
                :style="{ background: 'var(--bg-color)' }"
              >
                <span class="text-sm font-medium">白名单模式</span>
                <MySwitch v-model="editData.configs.white_list_mode" />
              </div>
            </div>

            <!-- 禁用用户列表 -->
            <div>
              <label class="block text-sm font-medium mb-2">禁用用户列表</label>
              <TagInput
                v-model="editData.configs.disable_user"
                placeholder="输入用户 ID 后按回车添加"
              />
            </div>

            <!-- 禁用群组列表 -->
            <div>
              <label class="block text-sm font-medium mb-2">禁用群组列表</label>
              <TagInput
                v-model="editData.configs.disable_group"
                placeholder="输入群组 ID 后按回车添加"
              />
            </div>

            <!-- 白名单列表 -->
            <div>
              <label class="block text-sm font-medium mb-2">白名单列表</label>
              <TagInput
                v-model="editData.configs.white_list"
                placeholder="输入用户/群组 ID 后按回车添加"
              />
            </div>

            <!-- 运行时策略 -->
            <div class="pt-3 mt-1" :style="{ borderTop: '1px dashed var(--border-color-light)' }">
              <h5 class="text-sm font-bold mb-3" :style="{ color: 'var(--primary-color)' }">
                <i class="fas fa-bolt mr-2"></i>运行时策略
              </h5>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">冷却时间（秒）</label>
                  <NeonInput
                    :model-value="editData.configs.cd"
                    type="number"
                    placeholder="0 表示不限制"
                    @input="(v) => (editData.configs.cd = Math.max(0, Number(v) || 0))"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">次数上限</label>
                  <NeonInput
                    :model-value="editData.configs.max_count"
                    type="number"
                    placeholder="0 表示不限制"
                    @input="
                      (v) => (editData.configs.max_count = Math.max(0, Math.floor(Number(v) || 0)))
                    "
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">统计窗口（秒）</label>
                  <NeonInput
                    :model-value="editData.configs.limit_window"
                    type="number"
                    placeholder="0 表示不限制"
                    @input="(v) => (editData.configs.limit_window = Math.max(0, Number(v) || 0))"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">作用范围</label>
                  <NekoSelect
                    :value="editData.configs.limit_scope"
                    :options="limitScopeOptions"
                    @change="onLimitScopeChange"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">并发上限</label>
                  <NeonInput
                    :model-value="editData.configs.concurrency"
                    type="number"
                    placeholder="0 表示不限制"
                    @input="
                      (v) =>
                        (editData.configs.concurrency = Math.max(0, Math.floor(Number(v) || 0)))
                    "
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">撤回延迟（秒）</label>
                  <NeonInput
                    :model-value="editData.configs.withdraw_delay"
                    type="number"
                    placeholder="0 表示不撤回"
                    @input="(v) => (editData.configs.withdraw_delay = Math.max(0, Number(v) || 0))"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mt-3">
                <div
                  class="flex items-center justify-between p-3 rounded-lg"
                  :style="{ background: 'var(--bg-color)' }"
                >
                  <span class="text-sm font-medium">禁用私聊</span>
                  <MySwitch v-model="blockPrivate" />
                </div>
                <div
                  class="flex items-center justify-between p-3 rounded-lg"
                  :style="{ background: 'var(--bg-color)' }"
                >
                  <span class="text-sm font-medium">禁用群聊</span>
                  <MySwitch v-model="blockGroup" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label class="block text-sm font-medium mb-2">父插件</label>
                  <NeonInput
                    :model-value="editData.configs.parent ?? ''"
                    placeholder="留空表示无父插件"
                    @input="(v) => (editData.configs.parent = String(v) || null)"
                  />
                </div>
                <div
                  class="flex items-center justify-between p-3 rounded-lg"
                  :style="{ background: 'var(--bg-color)' }"
                >
                  <span class="text-sm font-medium">跳过调用统计</span>
                  <MySwitch v-model="editData.configs.ignore_statistics" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NeonDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, h, render } from 'vue'
import { useRouter } from 'vue-router'
import UpdateDialog from './UpdateDialog.vue'
import NormalButton from '@/components/ui/NormalButton.vue'
import MySwitch from '@/components/ui/MySwitch.vue'
import NeonDialog from '@/components/ui/NeonDialog.vue'
import NeonInput from '@/components/ui/NeonInput.vue'
import NekoSelect from '@/components/ui/NekoSelect.vue'
import TagInput from '@/components/ui/TagInput.vue'
import CuteConfirm from '@/components/ui/CuteConfirm.vue'
import { getRequest, postRequest } from '@/utils/api'
import { getLoading } from '@/utils/loading'
import { message } from '@/utils/message'

const prefix = inject<string>('prefix') as string
const router = useRouter()

// 创建确认对话框的辅助函数
const showCuteConfirm = (options: {
  title: string
  message: string
  cancelButtonText?: string
  confirmButtonText?: string
  type?: 'info' | 'warning' | 'error'
}): Promise<boolean> => {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const props = ref({
      visible: true,
      ...options,
    })

    const vnode = h(CuteConfirm, {
      ...props.value,
      onConfirm: () => {
        cleanup()
        resolve(true)
      },
      onCancel: () => {
        cleanup()
        resolve(false)
      },
    })

    const cleanup = () => {
      props.value.visible = false
      setTimeout(() => {
        render(null, container)
        document.body.removeChild(container)
      }, 300)
    }

    render(vnode, container)
  })
}

interface PluginData {
  id: string | number
  plugin_name: string
  docs: string
  version: string
  type: string
  author?: string
  status: boolean
  is_builtin: boolean
  allow_switch: boolean
  allow_setting: boolean
  configs?: {
    enabled?: boolean
    disable_user?: string[]
    disable_group?: string[]
    white_list_mode?: boolean
    white_list?: string[]
    cd?: number
    max_count?: number
    limit_window?: number
    limit_scope?: 'user' | 'group' | 'both'
    block_type?: string[]
    parent?: string | null
    ignore_statistics?: boolean
    withdraw_delay?: number
    concurrency?: number
  }
  [key: string]: unknown
}

const dataList = ref<PluginData[]>([])
const pluginModule = ref<string>('')
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentPluginDetail = ref<PluginData | null>(null)

// 编辑数据
interface EditData {
  configs: {
    enabled: boolean
    disable_user: string[]
    disable_group: string[]
    white_list_mode: boolean
    white_list: string[]
    cd: number
    max_count: number
    limit_window: number
    limit_scope: 'user' | 'group' | 'both'
    block_type: string[]
    parent: string | null
    ignore_statistics: boolean
    withdraw_delay: number
    concurrency: number
  }
}

const DEFAULT_CONFIGS = (): EditData['configs'] => ({
  enabled: true,
  disable_user: [],
  disable_group: [],
  white_list_mode: false,
  white_list: [],
  cd: 0,
  max_count: 0,
  limit_window: 0,
  limit_scope: 'user',
  block_type: [],
  parent: null,
  ignore_statistics: false,
  withdraw_delay: 0,
  concurrency: 0,
})

const editData = ref<EditData>({
  configs: DEFAULT_CONFIGS(),
})

const limitScopeOptions = [
  { value: 'user', label: '按用户' },
  { value: 'group', label: '按群聊' },
  { value: 'both', label: '用户 + 群聊' },
]

function onLimitScopeChange(value: string | number | object) {
  editData.value.configs.limit_scope = String(value) as 'user' | 'group' | 'both'
}

const blockPrivate = computed({
  get: () => editData.value.configs.block_type.includes('private'),
  set: (value: boolean) => toggleBlockType('private', value),
})

const blockGroup = computed({
  get: () => editData.value.configs.block_type.includes('group'),
  set: (value: boolean) => toggleBlockType('group', value),
})

function toggleBlockType(type: 'private' | 'group', enabled: boolean) {
  const types = new Set(editData.value.configs.block_type)
  if (enabled) {
    types.add(type)
  } else {
    types.delete(type)
  }
  editData.value.configs.block_type = [...types]
}

interface Props {
  pluginType?: string
}

const props = withDefaults(defineProps<Props>(), {
  pluginType: '',
})

onMounted(() => {
  getPluginList()
})

function getPluginList() {
  const loading = getLoading('.plugin-list-container')

  const params: Record<string, string | string[]> = {}
  if (props.pluginType) {
    params.plugin_type = [props.pluginType]
  }

  getRequest(`${prefix}/plugin/get_plugin_list`, params)
    .then((resp) => {
      if (resp.data.suc) {
        dataList.value = Array.isArray(resp.data.data) ? resp.data.data : []
        if (resp.data.warning) {
          message.warning(resp.data.warning)
        }
      } else {
        message.error(resp.data.info || '获取插件列表失败')
        dataList.value = []
      }
    })
    .catch((error) => {
      message.error('请求插件列表失败：' + error)
      dataList.value = []
    })
    .finally(() => loading.close())
}

function onSwitchChange(data: PluginData, newStatus: boolean) {
  postRequest(`${prefix}/plugin/change_switch`, {
    service: data.plugin_name,
    status: newStatus,
  }).then((resp) => {
    if (resp.data.suc) {
      message.success(resp.data.info)
      getPluginList()
    } else {
      message.error(resp.data.info)
    }
  })
}

function openSetting(data: PluginData) {
  if (data.plugin_name === 'agent') {
    router.push('/agent')
    return
  }
  pluginModule.value = data.plugin_name
  dialogVisible.value = true
}

function closeSetting(updated?: boolean) {
  if (updated) getPluginList()
}

async function uninstallPlugin(data: PluginData) {
  const result = await showCuteConfirm({
    title: '卸载确认',
    message: `确定要卸载插件 "${data.plugin_name}" 吗？`,
    cancelButtonText: '我再想想',
    confirmButtonText: '狠心卸载',
    type: 'warning',
  })

  if (result) {
    try {
      postRequest(`${prefix}/store/remove_plugin`, {
        id: data.id,
      }).then((resp) => {
        if (resp.data.suc) {
          if (resp.data.warning) {
            message.warning(resp.data.warning)
          } else {
            message.success(resp.data.info)
            getPluginList()
          }
        } else {
          message.error(resp.data.info || '卸载失败')
        }
      })
    } catch (error: unknown) {
      message.error('卸载失败：' + (error instanceof Error ? error.message : String(error)))
    }
  } else {
    console.log('取消卸载')
  }
}

function showDetail(data: PluginData) {
  currentPluginDetail.value = data
  detailDialogVisible.value = true

  // 单独请求获取插件配置数据
  fetchPluginConfig(data.plugin_name)
}

// 获取插件配置数据
function fetchPluginConfig(pluginName: string) {
  getRequest(`${prefix}/plugin/get_plugin`, { service: pluginName })
    .then((resp) => {
      if (resp.data.suc && resp.data.data) {
        const pluginData = resp.data.data
        // 初始化编辑数据 - 所有插件都显示配置信息
        if (pluginData.configs) {
          const configs = pluginData.configs
          editData.value = {
            configs: {
              enabled: configs.enabled ?? true,
              disable_user: [...(configs.disable_user ?? [])],
              disable_group: [...(configs.disable_group ?? [])],
              white_list_mode: configs.white_list_mode ?? false,
              white_list: [...(configs.white_list ?? [])],
              cd: configs.cd ?? 0,
              max_count: configs.max_count ?? 0,
              limit_window: configs.limit_window ?? 0,
              limit_scope: configs.limit_scope ?? 'user',
              block_type: [...(configs.block_type ?? [])],
              parent: configs.parent ?? null,
              ignore_statistics: configs.ignore_statistics ?? false,
              withdraw_delay: configs.withdraw_delay ?? 0,
              concurrency: configs.concurrency ?? 0,
            },
          }
        } else {
          console.warn('插件数据中没有 configs 字段')
          // 即使没有 configs 也初始化默认值
          editData.value = { configs: DEFAULT_CONFIGS() }
        }
      } else {
        console.warn('获取插件数据失败或无数据:', resp.data)
      }
    })
    .catch((error) => {
      console.error('获取插件配置失败:', error)
      // 错误时也初始化默认值
      editData.value = { configs: DEFAULT_CONFIGS() }
    })
}

// 处理详情对话框确认
async function handleDetailConfirm() {
  if (!currentPluginDetail.value) {
    detailDialogVisible.value = false
    return
  }

  // 直接使用 editData，无需转换
  const configs = {
    enabled: editData.value.configs.enabled,
    disable_user: editData.value.configs.disable_user,
    disable_group: editData.value.configs.disable_group,
    white_list_mode: editData.value.configs.white_list_mode,
    white_list: editData.value.configs.white_list,
    cd: editData.value.configs.cd,
    max_count: editData.value.configs.max_count,
    limit_window: editData.value.configs.limit_window,
    limit_scope: editData.value.configs.limit_scope,
    block_type: editData.value.configs.block_type,
    parent: editData.value.configs.parent,
    ignore_statistics: editData.value.configs.ignore_statistics,
    withdraw_delay: editData.value.configs.withdraw_delay,
    concurrency: editData.value.configs.concurrency,
  }

  try {
    const resp = await postRequest!(`${prefix}/plugin/update_plugin`, {
      service: currentPluginDetail.value.plugin_name,
      configs,
    })
    if (resp.data.suc) {
      if (resp.data.warning) {
        message?.warning(resp.data.warning)
      } else {
        message?.success(resp.data.info)
      }
      detailDialogVisible.value = false
      getPluginList()
    } else {
      message?.error(resp.data.info)
    }
  } catch (error) {
    console.error('更新插件失败:', error)
    message?.error('更新插件失败')
  }
}
</script>

<style scoped>
.plugin-card {
  box-shadow: var(--card-shadow);
  background-image:
    radial-gradient(circle at 10% 20%, var(--primary-color-light) 0%, var(--bg-color-hover) 90%),
    linear-gradient(to bottom right, var(--bg-color), var(--bg-color-secondary));
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-height: 140px;
}

.plugin-card .button-row {
  border-top: 1px dashed var(--border-color-light);
  padding-top: 8px;
  margin-top: 8px;
}

.plugin-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--primary-shadow);
}

/* 选中状态动画 */
.plugin-card.is-selected {
  animation: pulse 2s infinite;
  border-color: var(--primary-color);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 var(--primary-shadow);
  }

  70% {
    box-shadow: 0 0 0 12px transparent;
  }

  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

/* 按钮区域 */
.plugin-card .button-area {
  border-left: 1px dashed var(--border-color-light);
}

/* 移动端适配 */
@media (max-width: 640px) {
  /* 小屏幕下只显示图标 */
  .plugin-card button span {
    display: none;
  }

  .plugin-card button {
    padding: 6px;
    min-width: 32px;
  }
}

/* 二次元风格确认对话框 */
:deep(.anime-confirm-dialog) {
  border-radius: 16px;
  background: var(--bg-color-secondary);
  border: 2px solid var(--border-color-light);

  .el-message-box__header {
    background: var(--primary-color);
    border-radius: 14px 14px 0 0;
    padding: 10px 20px;

    .el-message-box__title {
      color: var(--bg-color);
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
    }
  }

  .el-message-box__content {
    padding: 20px;
    color: var(--primary-color);
  }

  .el-message-box__btns {
    padding: 10px 20px 20px;

    button {
      border-radius: 12px;
      padding: 8px 16px;

      &.el-button--primary {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: var(--bg-color);
      }

      &.el-button--default {
        background: var(--bg-color-hover);
        border-color: var(--border-color-light);
        color: var(--primary-color);
      }
    }
  }
}

/* 详情对话框样式 */
.detail-dialog :deep(.el-dialog) {
  width: 90% !important;
  max-width: 700px !important;
  margin-top: 8vh !important;
  margin-bottom: 8vh !important;
}

.detail-dialog :deep(.el-dialog__overlay) {
  cursor: pointer;
}

.detail-dialog .detail-content {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 8px;
}

.detail-dialog .detail-content::-webkit-scrollbar {
  width: 6px;
}

.detail-dialog .detail-content::-webkit-scrollbar-track {
  background: var(--bg-color);
  border-radius: 3px;
}

.detail-dialog .detail-content::-webkit-scrollbar-thumb {
  background: var(--border-color-light);
  border-radius: 3px;
}

.detail-dialog .detail-content::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color-light);
}

.detail-dialog .detail-section {
  padding: 16px;
  border-radius: 8px;
  background: var(--bg-color);
  border: 1px solid var(--border-color-light);
  transition: all 0.3s ease;
}

.detail-dialog .detail-section:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
