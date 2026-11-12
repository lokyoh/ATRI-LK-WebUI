<template>
  <div class="main flex flex-col min-h-0" :style="{ background: 'var(--el-bg-color)' }">
    <!-- 标题部分 -->
    <div class="title text-center mb-4">
      <h1 class="text-2xl md:text-3xl font-semibold" :style="{ color: 'var(--el-color-primary)' }">
        <span class="inline-block transform rotate-3">✨</span>
        插件商店
        <span class="inline-block transform -rotate-3">✨</span>
      </h1>
      <div class="mt-1 text-sm" :style="{ color: 'var(--el-color-primary-light-3)' }">
        发现更多有趣的功能吧~
      </div>
    </div>

    <!-- 筛选部分 -->
    <div
      class="filter mb-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
    >
      <!-- 搜索框 -->
      <div class="search-input w-full lg:w-1/2">
        <el-input
          v-model="search"
          placeholder="搜索插件..."
          clearable
          size="default"
          class="rounded-full"
        >
          <template #prefix>
            <el-icon class="search-icon">
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>

      <!-- 右侧按钮组 -->
      <div class="search-actions flex flex-wrap items-center gap-3 justify-end w-full lg:w-auto">
        <!-- 重启按钮 -->
        <div class="restart-button">
          <my-button
            icon="refresh"
            text="重启"
            :iconHeight="18"
            :height="34"
            :width="84"
            @click="handleRestart"
            type="warning"
            rounded="full"
            :style="{
              borderColor: 'var(--el-border-color)',
            }"
          />
        </div>

        <!-- 类型筛选 -->
        <div class="search-tag">
          <el-select
            v-model="typeFilter"
            placeholder="全部类型"
            clearable
            size="default"
            class="store-filter-select"
            popper-class="store-filter-popper"
          >
            <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value">
              <span class="filter-option">
                <span>{{ t.label }}</span>
                <span class="filter-option__count">{{ t.count }}</span>
              </span>
            </el-option>
          </el-select>
        </div>

        <!-- 兼容筛选 -->
        <div class="search-tag">
          <el-select
            v-model="compatFilter"
            placeholder="全部兼容性"
            clearable
            size="default"
            class="store-filter-select"
            popper-class="store-filter-popper"
          >
            <el-option
              v-for="c in compatOptions"
              :key="c.value"
              :label="c.label"
              :value="c.value"
            >
              <span class="filter-option">
                <span>{{ c.label }}</span>
                <span class="filter-option__count">{{ c.count }}</span>
              </span>
            </el-option>
          </el-select>
        </div>

        <!-- 作者筛选 -->
        <div class="search-tag">
          <el-dropdown
            @command="handleCommand"
            trigger="click"
            teleported
            popper-class="store-dropdown-popper"
            class="cursor-pointer"
          >
            <div
              class="filter-button flex items-center px-3 py-1.5 rounded-full transition-all duration-300"
              :style="{
                backgroundColor: 'var(--el-fill-color-blank)',
                border: '1px solid var(--el-border-color-darker)',
                boxShadow: 'var(--el-box-shadow)',
              }"
            >
              <svg-icon
                :name="authorIcon"
                class="mr-1.5"
                :color="'var(--el-color-primary)'"
                :style="{ width: '20px', height: '20px' }"
              />
              <span
                :style="{
                  color: 'var(--el-text-color-primary)',
                  fontWeight: 500,
                }"
                >作者筛选</span
              >
              <svg-icon
                name="arrow-down"
                class="ml-1.5 transform transition-transform duration-300"
                :style="{ width: '20px', height: '20px' }"
                :color="'var(--el-color-primary)'"
              />
            </div>

            <template #dropdown>
              <el-dropdown-menu
                class="author-dropdown"
                :style="{
                  backgroundColor: 'var(--el-bg-color-overlay)',
                  border: '1px solid var(--el-border-color-darker)',
                  borderRadius: '8px',
                  boxShadow: 'var(--el-box-shadow)',
                  padding: '4px',
                }"
              >
                <el-dropdown-item
                  v-for="(v, i) in authorList"
                  :key="i"
                  :command="v"
                  class="author-item"
                >
                  <div
                    class="flex items-center py-2 px-3 rounded-md"
                    :style="{ color: 'var(--el-text-color-primary)' }"
                  >
                    <svg-icon name="user" class="mr-2" :color="'var(--el-color-primary)'" />
                    {{ v }}
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 卡片列表 -->
    <div class="plugin-card-container store-content-panel flex flex-col flex-1 min-h-0">
      <div
        class="plugin-card-list flex-1 min-h-0"
        :style="{
          background: 'var(--el-bg-color)',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: 'var(--el-box-shadow-light)',
          border: '1px solid var(--el-border-color-light)',
        }"
      >
        <div v-if="filterTableData.length" class="card-grid">
          <div v-for="plugin in paginatedTableData" :key="plugin.name" class="plugin-card">
            <div class="plugin-card__header">
              <div class="plugin-card__title">
                <a
                  v-if="plugin.github_url"
                  :href="plugin.github_url"
                  target="_blank"
                  class="plugin-card__link"
                >
                  <svg-icon
                    class="github-icon"
                    :style="{ color: 'var(--el-text-color-regular)' }"
                    name="github"
                  />
                </a>
                <div class="plugin-card__name-wrap">
                  <div class="plugin-card__name">{{ plugin.name }}</div>
                  <div class="plugin-card__meta">
                    <el-tag size="small" effect="plain" class="plugin-card__tag version-tag">
                      {{ getPluginVersionLabel(plugin) }}
                    </el-tag>
                    <el-tag
                      :type="getPluginStatus(plugin).type"
                      size="small"
                      effect="plain"
                      class="plugin-card__tag"
                    >
                      {{ getPluginStatus(plugin).label }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>

            <div class="plugin-card__body">
              <div class="plugin-card__row">
                <span class="plugin-card__label">作者</span>
                <span class="plugin-card__value">{{ plugin.author }}</span>
              </div>
              <div class="plugin-card__row">
                <span class="plugin-card__label">类型</span>
                <el-tag
                  v-if="plugin.plugin_type"
                  :type="getPluginTypeColor(plugin.plugin_type)"
                  size="small"
                  effect="dark"
                >
                  {{ plugin.plugin_type }}
                </el-tag>
                <span v-else class="plugin-card__value plugin-card__value--muted"> 未声明 </span>
              </div>
              <div v-if="hasRequirement(plugin)" class="plugin-card__row">
                <span class="plugin-card__label">基于</span>
                <div class="plugin-card__req">
                  <el-tag
                    v-for="req in requirementTags(plugin)"
                    :key="req"
                    size="small"
                    effect="plain"
                    class="plugin-card__tag"
                  >
                    {{ req }}
                  </el-tag>
                </div>
              </div>
              <div class="plugin-card__desc">
                {{ plugin.description || '暂无介绍' }}
              </div>
              <div v-if="plugin.compat_status && plugin.compat_status !== 'supported'" class="plugin-card__warn">
                <el-tag :type="compatTagType(plugin.compat_status)" size="small" effect="plain">
                  {{ plugin.compat_label }}
                </el-tag>
                <span class="plugin-card__warn-text">{{ compatDetail(plugin) }}</span>
              </div>
              <div v-if="plugin.lkapi_note" class="plugin-card__note">
                <el-tag type="warning" size="small" effect="plain"> lkapi </el-tag>
                <span class="plugin-card__note-text">{{ plugin.lkapi_note }}</span>
              </div>
            </div>

            <div class="plugin-card__actions">
              <my-button
                v-if="!installPlugin.includes(plugin.name)"
                icon="download"
                text="安装"
                :iconSize="16"
                :height="28"
                :width="72"
                @click="handleInstall(0, plugin)"
                type="primary"
                rounded="full"
                :style="{
                  borderColor: 'var(--el-border-color)',
                }"
              />
              <my-button
                v-if="installPlugin.includes(plugin.name)"
                icon="update"
                :text="plugin.need_update ? '更新' : '重装'"
                :iconSize="16"
                :height="28"
                :width="72"
                @click="handleUpdate(0, plugin)"
                type="warning"
                rounded="full"
                :style="{
                  borderColor: 'var(--el-border-color)',
                }"
              />
              <my-button
                v-if="installPlugin.includes(plugin.name)"
                icon="remove"
                text="删除"
                :iconSize="16"
                :height="28"
                :width="72"
                @click="handleRemove(0, plugin)"
                type="danger"
                rounded="full"
                :style="{
                  borderColor: 'var(--el-border-color)',
                }"
              />
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-state__icon">✨</div>
          <div class="empty-state__text">暂无匹配的插件</div>
          <el-button v-if="hasActiveFilter" text type="primary" @click="clearFilters">
            清除筛选条件
          </el-button>
        </div>
      </div>
      <el-config-provider :locale="zhCn">
        <el-pagination
          v-if="filterTableData.length"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 48, 96]"
          :total="filterTableData.length"
          layout="total, sizes, prev, pager, next"
          class="store-pagination"
          background
        />
      </el-config-provider>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject, h, render, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import MyButton from '../ui/MyButton.vue'
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'
import CuteConfirm from '../ui/CuteConfirm.vue'
import { getRequest, postRequest } from '@/utils/api'
import { message } from '@/utils/message'
import { getLoading } from '@/utils/loading'

const prefix = inject<string>('prefix', '')

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

interface PluginListData {
  plugin_list: PluginData[]
  install_plugin: string[]
}

interface APIResponse {
  suc: boolean
  info?: string
  warning?: string
  data?: PluginListData | unknown
}

interface ProgressItem {
  name: string
  action: string
  stage: string
  stage_label?: string
  detail?: string
  done?: boolean
  elapsed?: number
}

interface PluginData {
  id: string
  name: string
  author: string
  version: string
  plugin_type: string
  description: string
  github_url?: string
  need_update?: boolean
  local_version?: string
  remote_version?: string
  /** 插件开发所依据的框架版本（单一版本号）；空串表示未声明 */
  require_framework?: string
  /** 插件所依赖的 lkapi 接口版本；null 表示未声明 */
  require_lkapi?: number | null
  /** 当前框架版本 */
  framework_version?: string
  /** 当前框架的兼容区间，如 `0.24-0.25` */
  supported_framework?: string
  /** 当前 lkapi 版本 */
  lkapi_version?: number | null
  /** 与当前环境是否兼容（仅标注，不拦截安装） */
  compatible?: boolean
  /** 兼容状态：supported / unknown / outdated / newer */
  compat_status?: string
  /** 兼容状态的中文标签 */
  compat_label?: string
  /** 不兼容原因 */
  compat_reason?: string
  /** lkapi 版本变动提示 */
  lkapi_note?: string
  module: string
  [key: string]: unknown
}

const authorIcon = ref('author-red')
const authorList = ref<string[]>([])
const tableData = ref<PluginData[]>([])
const search = ref('')
const installPlugin = ref<string[]>([])
const currentPage = ref(1)
const pageSize = ref(12)
const typeFilter = ref('')
const compatFilter = ref('')

/** 兼容筛选项定义；顺序即展示顺序 */
const COMPAT_FILTERS = [
  { value: 'supported', label: '兼容' },
  { value: 'outdated', label: '版本过时' },
  { value: 'newer', label: '版本过新' },
  { value: 'unknown', label: '未知兼容性' },
]

const pluginType = (plugin: PluginData) => plugin.plugin_type || ''

const compatStatus = (plugin: PluginData) => plugin.compat_status || 'unknown'

/** 类型筛选项：只列出当前数据里真实出现的类型，并带数量 */
const typeOptions = computed(() => {
  const counts = new Map<string, number>()
  for (const plugin of tableData.value) {
    const key = pluginType(plugin)
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
})

/** 兼容筛选项：带数量，0 项仍保留以便用户确认「确实没有这类」 */
const compatOptions = computed(() =>
  COMPAT_FILTERS.map((item) => ({
    ...item,
    count: tableData.value.filter((p) => compatStatus(p) === item.value).length,
  })),
)

const filterTableData = computed(() => {
  const searchValue = search.value.trim()
  return tableData.value.filter((v) => {
    if (searchValue && !(v.author.includes(searchValue) || v.name.includes(searchValue))) {
      return false
    }
    if (typeFilter.value && pluginType(v) !== typeFilter.value) {
      return false
    }
    if (compatFilter.value && compatStatus(v) !== compatFilter.value) {
      return false
    }
    return true
  })
})

const hasActiveFilter = computed(
  () => Boolean(search.value.trim() || typeFilter.value || compatFilter.value),
)

const clearFilters = () => {
  search.value = ''
  typeFilter.value = ''
  compatFilter.value = ''
}

const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filterTableData.value.slice(start, start + pageSize.value)
})

watch([search, typeFilter, compatFilter], () => {
  currentPage.value = 1
})

watch(
  [() => filterTableData.value.length, pageSize],
  ([total]) => {
    const lastPage = Math.max(1, Math.ceil(total / pageSize.value))
    if (currentPage.value > lastPage) {
      currentPage.value = lastPage
    }
  },
)

onMounted(() => {
  getPluginList()
})

const getPluginTypeColor = (type: string) => {
  const typeMap: Record<string, string> = {
    系统服务: 'danger',
    LK扩展服务: 'success',
    功能性服务: 'success',
    娱乐服务: 'warning',
    游戏服务: 'primary',
    订阅服务: 'info',
    其他服务: 'info',
    隐藏服务: 'info',
    功能: 'success',
    娱乐: 'warning',
    工具: 'info',
    管理: 'danger',
    其他插件: 'info',
    其他: 'info',
  }
  return typeMap[type] || 'info'
}

/** 插件是否声明了种类之外的要求（框架 / lkapi） */
const hasRequirement = (plugin: PluginData) =>
  Boolean(plugin.require_framework) || plugin.require_lkapi != null

/** 把框架 / lkapi 要求拆成标签数组 */
const requirementTags = (plugin: PluginData) => {
  const tags: string[] = []
  if (plugin.require_framework) {
    tags.push(`框架 ${plugin.require_framework}`)
  }
  if (plugin.require_lkapi != null) {
    tags.push(`lkapi ${plugin.require_lkapi}`)
  }
  return tags
}

const compatTagType = (status?: string) => {
  if (status === 'outdated' || status === 'newer') {
    return 'danger'
  }
  return 'info'
}

const compatDetail = (plugin: PluginData) => {
  if (plugin.compat_status === 'unknown') {
    return '未声明所基于的框架版本'
  }
  return plugin.compat_reason || ''
}

const getPluginStatus = (plugin: PluginData) => {
  const installed = installPlugin.value.includes(plugin.name)
  if (installed) {
    return plugin.need_update
      ? { label: '可更新', type: 'warning' }
      : { label: '已安装', type: 'success' }
  }
  return { label: '未安装', type: 'info' }
}

const getPluginVersionLabel = (plugin: PluginData) => {
  if (plugin.need_update && plugin.local_version && plugin.remote_version) {
    return `v${plugin.local_version} -> v${plugin.remote_version}`
  }
  return `v${plugin.version}`
}

const progressText = ref('')
let progressTimer: ReturnType<typeof setInterval> | null = null
let activeLoading: { setText: (t: string) => void } | null = null

const handleRestart = async () => {
  const result = await showCuteConfirm({
    title: '重启确认',
    message: `确定要重启系统吗？`,
    cancelButtonText: '我再想想',
    confirmButtonText: '确认重启',
    type: 'warning',
  })

  if (result) {
    const loading = getLoading('.store-content-panel')

    postRequest(`${prefix}/configure/restart`, {})
      .then((response) => {
        loading.close()
        stopProgressPolling()
        const resp = response.data as APIResponse
        if (resp.suc) {
          message?.success({ message: resp.info || '重启命令已执行!' })
        } else {
          message?.error({ message: resp.info || '重启失败' })
        }
      })
      .catch((error) => {
        loading.close()
        stopProgressPolling()
        message?.error({ message: '重启过程中发生错误：' + (error.message || error) })
        console.error('[StoreTemplate] Restart error:', error)
      })
  } else {
    message?.info({ message: '已取消重启' })
  }
}

const handleUpdate = async (_i: number, data: PluginData) => {
  const isLatest = !data.need_update
  const result = await showCuteConfirm({
    title: isLatest ? '重装确认' : '更新确认',
    message: isLatest
      ? `该插件已是最新版本，确定要重新下载安装吗？`
      : `确定要更新这个插件吗`,
    cancelButtonText: '我再想想',
    confirmButtonText: '无视风险强制更新',
    type: 'warning',
  })

  if (result) {
    pollProgress(data.name)
    const loading = getLoading('.store-content-panel', { text: '正在处理喵...' })
    activeLoading = loading

    // 确认框的按钮文案是「无视风险强制更新」，这里如实传 force：
    // 否则「已是最新」时点了也更新不了，按钮名不副实
    postRequest(`${prefix}/store/update_plugin`, {
      service: data.name,
      force: true,
    })
      .then((response) => {
        loading.close()
        stopProgressPolling()
        const resp = response.data as APIResponse
        if (resp.suc) {
          if (resp.warning) {
            message?.warning({ message: resp.warning })
          } else {
            message?.success({ message: resp.info || '插件更新成功!' })
            getPluginList()
          }
        } else {
          message?.error({ message: resp.info || '插件更新失败' })
        }
      })
      .catch((error) => {
        loading.close()
        stopProgressPolling()
        message?.error({ message: '更新过程中发生错误：' + (error.message || error) })
        console.error('[Plugin Store] Update error:', error)
      })
  } else {
    message?.info({ message: '已取消更新' })
  }
}

const handleRemove = async (_i: number, data: PluginData) => {
  const result = await showCuteConfirm({
    title: '移除确认',
    message: `确定要移除这个插件吗`,
    cancelButtonText: '我再想想',
    confirmButtonText: '坚定不移必须移除',
    type: 'warning',
  })
  if (result) {
    pollProgress(data.name)
    const loading = getLoading('.store-content-panel', { text: '正在处理喵...' })
    activeLoading = loading

    postRequest(`${prefix}/store/remove_plugin`, {
      service: data.name,
    })
      .then((response) => {
        loading.close()
        stopProgressPolling()
        const resp = response.data as APIResponse
        if (resp.suc) {
          if (resp.warning) {
            message?.warning({ message: resp.warning })
          } else {
            message?.success({ message: resp.info || '插件移除成功!' })
            getPluginList()
          }
        } else {
          message?.error({ message: resp.info || '插件移除失败' })
        }
      })
      .catch((error) => {
        loading.close()
        stopProgressPolling()
        message?.error({ message: '移除过程中发生错误：' + (error.message || error) })
        console.error('[Plugin Store] Remove error:', error)
      })
  } else {
    message?.info({ message: '已取消移除' })
  }
}

const handleInstall = async (_i: number, data: PluginData) => {
  const result = await showCuteConfirm({
    title: '安装确认',
    message: `确定要安装这个插件吗？`,
    cancelButtonText: '我再想想',
    confirmButtonText: '无视风险继续安装',
    type: 'warning',
  })
  if (result) {
    pollProgress(data.name)
    const loading = getLoading('.store-content-panel', { text: '正在处理喵...' })
    activeLoading = loading

    postRequest(`${prefix}/store/install_plugin`, {
      service: data.name,
    })
      .then((response) => {
        loading.close()
        stopProgressPolling()
        const resp = response.data as APIResponse
        if (resp.suc) {
          if (resp.warning) {
            message?.warning({ message: resp.warning })
          } else {
            message?.success({ message: resp.info || '插件安装成功!' })
            getPluginList()
          }
        } else {
          message?.error({ message: resp.info || '插件安装失败' })
        }
      })
      .catch((error) => {
        loading.close()
        stopProgressPolling()
        message?.error({ message: '安装过程中发生错误：' + (error.message || error) })
        console.error('[Plugin Store] Install error:', error)
      })
  } else {
    message?.info({ message: '已取消安装' })
  }
}

const handleCommand = (s: string) => {
  search.value = s
  message?.success(`已筛选作者：${s}`)
}


/** 安装/更新期间轮询后端进度，把当前阶段显示在 loading 文案里。 */
const stopProgressPolling = () => {
  if (progressTimer !== null) {
    clearInterval(progressTimer)
    progressTimer = null
  }
  progressText.value = ''
  activeLoading = null
}

const pollProgress = (pluginName: string) => {
  stopProgressPolling()
  const tick = () => {
    getRequest(`${prefix}/store/get_store_progress`)
      .then((response) => {
        const resp = response.data as APIResponse
        const list = Array.isArray(resp?.data) ? (resp.data as ProgressItem[]) : []
        const mine = list.find((p) => p.name === pluginName)
        if (mine) {
          progressText.value = mine.done ? '' : mine.stage_label || ''
          if (!mine.done && progressText.value && activeLoading) {
            activeLoading.setText(`(${mine.stage_label}) 正在处理喵...`)
          }
        }
      })
      .catch(() => {
        /* 进度是尽力而为，失败不影响主流程 */
      })
  }
  tick()
  progressTimer = setInterval(tick, 800)
}

onUnmounted(stopProgressPolling)

const getPluginList = () => {
  const loading = getLoading('.store-content-panel')
  getRequest(`${prefix}/store/get_plugin_store`)
    .then((response) => {
      loading.close()
      const resp = response.data as APIResponse
      if (resp && resp.suc) {
        if (resp.warning) {
          message?.warning({ message: resp.warning })
        } else {
          message?.success({ message: resp.info || '获取插件商店列表成功!' })
          const pluginData = resp.data as PluginListData
          tableData.value = Array.isArray(pluginData?.plugin_list) ? pluginData.plugin_list : []
          installPlugin.value = pluginData?.install_plugin || []
          authorList.value = []

          if (Array.isArray(pluginData?.plugin_list)) {
            for (const v of pluginData.plugin_list) {
              if (v && v.author && !authorList.value.includes(v.author)) {
                authorList.value.push(v.author)
              }
            }
          }
        }
      } else {
        const errorMsg = resp ? resp.info : '无法获取插件商店列表，请检查网络连接或后端服务。'
        message?.error({ message: errorMsg || '获取插件商店列表失败' })
        tableData.value = []
        installPlugin.value = []
        authorList.value = []
      }
    })
    .catch((error) => {
      loading.close()
      message?.error({ message: `获取插件商店列表时出错：${error.message || error}` })
      console.error('[StoreTemplate Error] getPluginList catch:', error)
      tableData.value = []
      installPlugin.value = []
      authorList.value = []
    })
}
</script>

<style lang="scss" scoped>
.main {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0.75rem 1rem 1rem;
}

.title {
  margin-bottom: 0.5rem;

  h1 {
    transition: color 0.3s ease;
    font-size: 1.6rem;
    line-height: 1.25;

    span {
      display: inline-block;
      transition: transform 0.3s ease;
    }
  }

  div {
    margin-top: 0.125rem;
    font-size: 0.8rem;
    line-height: 1.25;
  }
}

.filter-button {
  transition: all 0.3s ease;

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);
  }
}

.search-actions {
  flex-wrap: nowrap;
  gap: 0.5rem;

  .filter-button {
    white-space: nowrap;
  }
}

.restart-button {
  display: flex;
  align-items: center;

  :deep(.my-button) {
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--el-box-shadow);
    }

    &:active {
      transform: translateY(1px);
    }
  }
}

.author-dropdown {
  .author-item {
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }
  }
}

.table-container {
  .table-border {
    transition: all 0.3s ease;
  }

  :deep(.el-table) {
    --el-table-border-color: var(--el-border-color-lighter);
    --el-table-header-bg-color: var(--el-fill-color-light);
    --el-table-row-hover-bg-color: var(--el-fill-color);

    th {
      background: var(--el-fill-color-light);
      color: var(--el-color-primary);
      font-weight: bold;
      border-bottom: 2px solid var(--el-border-color);
    }

    td {
      color: var(--el-text-color-regular);
    }
  }

  .name-border {
    .github-icon {
      transition: all 0.3s ease;

      &:hover {
        color: var(--el-color-primary) !important;
      }
    }
  }

  .is-install {
    transition: all 0.3s ease;
  }
}

// 暗色主题适配
:root[data-theme='dark'] {
  .main {
    background: var(--el-bg-color-overlay);
  }

  .filter-button {
    background: var(--el-bg-color);
    border-color: var(--el-border-color-darker);

    &:hover {
      background: var(--el-fill-color-dark);
    }
  }

  .table-container {
    .table-border {
      background: var(--el-bg-color);
      border-color: var(--el-border-color-darker);
    }

    :deep(.el-table) {
      --el-table-border-color: var(--el-border-color-darker);
      --el-table-header-bg-color: var(--el-fill-color-dark);
      --el-table-row-hover-bg-color: var(--el-fill-color-darker);

      th {
        background: var(--el-fill-color-dark);
      }
    }
  }
}

.table-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.table-border {
  transition: height 0.3s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.el-table) {
    flex: 1;

    .el-table__body-wrapper {
      overflow-y: auto;
    }
  }
}

.main {
  .title {
    h1 {
      text-shadow: 1px 1px 2px var(--el-color-primary-light-8);
    }
  }

  .search-input {
    width: 100%;

    :deep(.el-input__inner) {
      border-radius: 9999px;
      border: 1px solid var(--el-border-color);
      padding-left: 42px;
      background-color: var(--el-bg-color-overlay);
      transition: all 0.3s;

      &:focus {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
      }
    }

    .search-icon {
      color: var(--el-color-primary-light-3);
    }
  }

  .filter {
    margin-bottom: 0.75rem;
  }

  .table-border {
    :deep(.el-table) {
      th {
        font-weight: bold;
        color: var(--el-color-primary);
        background: var(--el-fill-color-light);
      }

      td {
        border-bottom: 1px solid var(--el-border-color-light);
      }

      .el-table__body tr.installed-row {
        background-color: var(--el-color-success-light-9);

        &:hover {
          background-color: var(--el-color-success-light-8) !important;
        }
      }

      .el-table__body tr.el-table__row--striped {
        background-color: var(--el-fill-color-lighter);

        &.installed-row {
          background-color: var(--el-color-success-light-8);
        }
      }
    }
  }
}

// 二次元风格弹窗
.confirm-box {
  border-radius: 16px !important;
  border: 2px solid var(--el-border-color-light) !important;
  background-color: var(--el-bg-color) !important;
}

.confirm-box .el-message-box__header {
  background-color: var(--el-fill-color-light);
  border-radius: 14px 14px 0 0;
  padding: 15px 20px;
}

.confirm-box .el-message-box__header .el-message-box__title {
  color: var(--el-color-primary);
  font-weight: bold;
}

.confirm-box .el-message-box__content {
  padding: 20px;
  color: var(--el-text-color-primary);
}

.confirm-box .el-message-box__btns {
  padding: 15px 20px;
}

.confirm-box .el-message-box__btns .el-button {
  border-radius: 9999px;
  padding: 10px 20px;
  font-weight: bold;
}

.confirm-box .el-message-box__btns .el-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}

// 卡片列表样式
.plugin-card-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.plugin-card-list {
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 420px));
  gap: 0.75rem;
  overflow-y: auto;
  padding-right: 0.25rem;
  justify-content: center;
  align-content: start;
  flex: 1;
  min-height: 0;
}

.store-pagination {
  flex: none;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

.plugin-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 14px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
  box-shadow: var(--el-box-shadow-light);
  width: 100%;
  max-width: 420px;
  justify-self: center;
}

.plugin-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.plugin-card__title {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
}

.plugin-card__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.1rem;

  .github-icon {
    width: 1rem;
    height: 1rem;
    transition: all 0.3s ease;
  }

  &:hover .github-icon {
    color: var(--el-color-primary) !important;
    transform: scale(1.08);
  }
}

.plugin-card__name-wrap {
  min-width: 0;
}

.plugin-card__name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.4rem;
}

.plugin-card__tag {
  margin: 0;
}

.version-tag {
  border: 1px solid var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.plugin-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.plugin-card__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.plugin-card__label {
  color: var(--el-text-color-secondary);
}

.plugin-card__value {
  color: var(--el-text-color-primary);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-card__value--muted {
  color: var(--el-text-color-placeholder);
}

.plugin-card__req {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.25rem;
}

.plugin-card__warn {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
}

.plugin-card__warn-text {
  color: var(--el-color-danger);
  font-size: 0.8rem;
  line-height: 1.4;
}

.plugin-card__note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-7);
}

.plugin-card__note-text {
  color: var(--el-color-warning);
  font-size: 0.8rem;
  line-height: 1.4;
}

.plugin-card__desc {
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plugin-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: auto;

  :deep(.my-button) {
    flex: 0 0 72px;
  }
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  gap: 0.5rem;
}

.empty-state__icon {
  font-size: 1.5rem;
}

.empty-state__text {
  font-size: 0.95rem;
}

.store-filter-select {
  width: 140px;

  :deep(.el-select__wrapper) {
    border-radius: 9999px;
    box-shadow: var(--el-box-shadow);
  }
}

// 响应式调整
@media (max-width: 1024px) {
  .main {
    padding: 1rem;

    .title h1 {
      font-size: 2rem;
    }

    .filter {
      flex-direction: column;
      align-items: stretch;

      .search-input,
      .search-actions {
        width: 100%;
      }

      .search-actions {
        justify-content: flex-start;
      }
    }
  }
}

@media (max-width: 768px) {
  .main {
    padding: 0.75rem;

    .title h1 {
      font-size: 1.7rem;
    }

    .filter {
      gap: 0.75rem;
    }

    .plugin-card-list {
      padding: 0.75rem;
    }

    .store-pagination {
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .card-grid {
      grid-template-columns: minmax(0, 420px);
      gap: 0.75rem;
    }

    .plugin-card {
      padding: 0.9rem;
    }

    .plugin-card__actions {
      gap: 0.4rem;

      :deep(.my-button) {
        width: 72px !important;
      }
    }
  }
}

// 动画效果
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

.animate-bounce {
  animation: bounce 2s infinite;
}

.filter-button {
  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--el-box-shadow);
    border-color: var(--el-color-primary);
    background-color: var(--el-fill-color-light) !important;
  }

  &:active {
    transform: translateY(1px);
    background-color: var(--el-fill-color-darker) !important;
  }
}

.author-dropdown {
  :deep(.el-dropdown-menu__item) {
    margin: 2px 0;
    padding: 0;
    border-radius: 6px;

    &:hover,
    &:focus {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }

    &:active {
      background-color: var(--el-color-primary-light-7);
    }
  }
}

.author-item {
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(4px);
  }
}
</style>

<style lang="scss">
.store-filter-popper {
  .filter-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .filter-option__count {
    color: var(--el-text-color-secondary);
    font-size: 0.8rem;
  }
}
</style>
