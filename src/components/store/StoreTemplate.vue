<template>
  <div class="main p-4 md:p-6 flex flex-col min-h-0" :style="{ background: 'var(--el-bg-color)' }">
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
    <div class="filter mb-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <!-- 搜索框 -->
      <div class="search-input w-full lg:w-1/2">
        <el-input v-model="search" placeholder="搜索插件..." clearable size="default" class="rounded-full">
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
          <my-button icon="refresh" text="重启" :iconHeight="20" :height="36" :width="100" @click="handleRestart"
            type="warning" rounded="full" :style="{
              borderColor: 'var(--el-border-color)',
            }" />
        </div>

        <!-- 作者筛选 -->
        <div class="search-tag">
          <el-dropdown @command="handleCommand" trigger="click" teleported popper-class="store-dropdown-popper"
            class="cursor-pointer">
            <div class="filter-button flex items-center px-4 py-2 rounded-full transition-all duration-300" :style="{
              backgroundColor: 'var(--el-fill-color-blank)',
              border: '1px solid var(--el-border-color-darker)',
              boxShadow: 'var(--el-box-shadow)',
            }">
              <svg-icon :name="authorIcon" class="mr-2" :color="'var(--el-color-primary)'" />
              <span :style="{
                color: 'var(--el-text-color-primary)',
                fontWeight: 500,
              }">作者筛选</span>
              <svg-icon name="arrow-down" class="ml-2 transform transition-transform duration-300"
                :color="'var(--el-color-primary)'" />
            </div>

            <template #dropdown>
              <el-dropdown-menu class="author-dropdown" :style="{
                backgroundColor: 'var(--el-bg-color-overlay)',
                border: '1px solid var(--el-border-color-darker)',
                borderRadius: '8px',
                boxShadow: 'var(--el-box-shadow)',
                padding: '4px',
              }">
                <el-dropdown-item v-for="(v, i) in authorList" :key="i" :command="v" class="author-item">
                  <div class="flex items-center py-2 px-3 rounded-md"
                    :style="{ color: 'var(--el-text-color-primary)' }">
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
    <div class="plugin-card-container flex flex-col flex-1 min-h-0">
      <div class="plugin-card-list flex-1 min-h-0" :style="{
        background: 'var(--el-bg-color)',
        borderRadius: '12px',
        padding: '1rem',
        boxShadow: 'var(--el-box-shadow-light)',
        border: '1px solid var(--el-border-color-light)',
      }">
        <div v-if="filterTableData.length" class="card-grid">
          <div v-for="plugin in filterTableData" :key="plugin.name" class="plugin-card">
            <div class="plugin-card__header">
              <div class="plugin-card__title">
                <a v-if="plugin.github_url" :href="plugin.github_url" target="_blank" class="plugin-card__link">
                  <svg-icon class="github-icon" :style="{ color: 'var(--el-text-color-regular)' }" name="github" />
                </a>
                <div class="plugin-card__name-wrap">
                  <div class="plugin-card__name">{{ plugin.name }}</div>
                  <div class="plugin-card__meta">
                    <el-tag size="small" effect="plain" class="plugin-card__tag version-tag">
                      v{{ plugin.version }}
                    </el-tag>
                    <el-tag :type="getPluginStatus(plugin).type" size="small" effect="plain" class="plugin-card__tag">
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
                <el-tag :type="getPluginTypeColor(plugin.plugin_type)" size="small" effect="dark">
                  {{ plugin.plugin_type }}
                </el-tag>
              </div>
              <div class="plugin-card__desc">
                {{ plugin.description || '暂无介绍' }}
              </div>
            </div>

            <div class="plugin-card__actions">
              <my-button icon="download" text="安装" :iconHeight="20" :height="32" :width="74"
                @click="handleInstall(0, plugin)" type="primary" :disabled="installPlugin.includes(plugin.name)"
                rounded="full" :style="{
                  borderColor: 'var(--el-border-color)',
                }" />
              <my-button icon="update" text="更新" :iconHeight="20" :height="32" :width="74"
                @click="handleUpdate(0, plugin)" type="warning"
                :disabled="!installPlugin.includes(plugin.name) || !plugin.need_update" rounded="full" :style="{
                  borderColor: 'var(--el-border-color)',
                }" />
              <my-button icon="remove" text="删除" :iconHeight="20" :height="32" :width="74"
                @click="handleRemove(0, plugin)" type="danger" :disabled="!installPlugin.includes(plugin.name)"
                rounded="full" :style="{
                  borderColor: 'var(--el-border-color)',
                }" />
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-state__icon">✨</div>
          <div class="empty-state__text">暂无匹配的插件</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, h, render } from 'vue'
import { Search } from '@element-plus/icons-vue'
import MyButton from "../ui/MyButton.vue"
import SvgIcon from "@/components/SvgIcon/SvgIcon.vue"
import CuteConfirm from "../ui/CuteConfirm.vue"
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
  type?: "info" | "warning" | "error"
}): Promise<boolean> => {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const props = ref({
      visible: true,
      ...options
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
      }
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

interface PluginData {
  id: string
  name: string
  author: string
  version: string
  plugin_type: string
  description: string
  github_url?: string
  need_update?: boolean
  module: string
  [key: string]: unknown
}



const authorIcon = ref("author-red")
const authorList = ref<string[]>([])
const tableData = ref<PluginData[]>([])
const search = ref("")
const installPlugin = ref<string[]>([])

const filterTableData = computed(() => {
  const searchValue = search.value.trim()
  if (searchValue) {
    return tableData.value.filter((v) => {
      return v.author.includes(searchValue) || v.name.includes(searchValue)
    })
  } else {
    return tableData.value
  }
})

onMounted(() => {
  getPluginList()
})

const getPluginTypeColor = (type: string) => {
  const typeMap: Record<string, string> = {
    "功能": "success",
    "娱乐": "warning",
    "工具": "info",
    "管理": "danger",
    "其他插件": "info",
    "其他": "info",
  }
  return typeMap[type] || "info"
}

const getPluginStatus = (plugin: PluginData) => {
  const installed = installPlugin.value.includes(plugin.name)
  if (installed) {
    return plugin.need_update ? { label: "可更新", type: "warning" } : { label: "已安装", type: "success" }
  }
  return { label: "未安装", type: "info" }
}

const handleRestart = async () => {
  const result = await showCuteConfirm({
    title: "重启确认",
    message: `确定要重启系统吗？`,
    cancelButtonText: "我再想想",
    confirmButtonText: "确认重启",
    type: "warning"
  })

  if (result) {
    const loading = getLoading(".table-border")

    postRequest(`${prefix}/configure/restart`, {})
      .then((response) => {
        loading.close()
        const resp = response.data as APIResponse
        if (resp.suc) {
          message?.success({ message: resp.info || "重启命令已执行!" })
        } else {
          message?.error({ message: resp.info || "重启失败" })
        }
      })
      .catch((error) => {
        loading.close()
        message?.error({ message: "重启过程中发生错误：" + (error.message || error) })
        console.error("[StoreTemplate] Restart error:", error)
      })
  } else {
    message?.info({ message: "已取消重启" })
  }
}

const handleUpdate = async (_i: number, data: PluginData) => {
  const result = await showCuteConfirm({
    title: "更新确认",
    message: `确定要更新这个插件吗`,
    cancelButtonText: "我再想想",
    confirmButtonText: "无视风险强制更新",
    type: "warning"
  })

  if (result) {
    const loading = getLoading(".table-border")

    postRequest(`${prefix}/store/update_plugin`, {
      service: data.name,
    })
      .then((response) => {
        loading.close()
        const resp = response.data as APIResponse
        if (resp.suc) {
          if (resp.warning) {
            message?.warning({ message: resp.warning })
          } else {
            message?.success({ message: resp.info || "插件更新成功!" })
            getPluginList()
          }
        } else {
          message?.error({ message: resp.info || "插件更新失败" })
        }
      })
      .catch((error) => {
        loading.close()
        message?.error({ message: "更新过程中发生错误：" + (error.message || error) })
        console.error("[Plugin Store] Update error:", error)
      })
  } else {
    message?.info({ message: "已取消更新" })
  }
}

const handleRemove = async (_i: number, data: PluginData) => {
  const result = await showCuteConfirm({
    title: "移除确认",
    message: `确定要移除这个插件吗`,
    cancelButtonText: "我再想想",
    confirmButtonText: "坚定不移必须移除",
    type: "warning"
  })
  if (result) {
    const loading = getLoading(".table-border")

    postRequest(`${prefix}/store/remove_plugin`, {
      service: data.name,
    })
      .then((response) => {
        loading.close()
        const resp = response.data as APIResponse
        if (resp.suc) {
          if (resp.warning) {
            message?.warning({ message: resp.warning })
          } else {
            message?.success({ message: resp.info || "插件移除成功!" })
            getPluginList()
          }
        } else {
          message?.error({ message: resp.info || "插件移除失败" })
        }
      })
      .catch((error) => {
        loading.close()
        message?.error({ message: "移除过程中发生错误：" + (error.message || error) })
        console.error("[Plugin Store] Remove error:", error)
      })
  } else {
    message?.info({ message: "已取消移除" })
  }
}

const handleInstall = async (_i: number, data: PluginData) => {
  const result = await showCuteConfirm({
    title: "安装确认",
    message: `确定要安装这个插件吗？`,
    cancelButtonText: "我再想想",
    confirmButtonText: "无视风险继续安装",
    type: "warning"
  })
  if (result) {
    const loading = getLoading(".table-border")

    postRequest(`${prefix}/store/install_plugin`, {
      service: data.name,
    })
      .then((response) => {
        loading.close()
        const resp = response.data as APIResponse
        if (resp.suc) {
          if (resp.warning) {
            message?.warning({ message: resp.warning })
          } else {
            message?.success({ message: resp.info || "插件安装成功!" })
            getPluginList()
          }
        } else {
          message?.error({ message: resp.info || "插件安装失败" })
        }
      })
      .catch((error) => {
        loading.close()
        message?.error({ message: "安装过程中发生错误：" + (error.message || error) })
        console.error("[Plugin Store] Install error:", error)
      })
  } else {
    message?.info({ message: "已取消安装" })
  }
}

const handleCommand = (s: string) => {
  search.value = s
  message?.success(`已筛选作者：${s}`)
}

const getPluginList = () => {
  const loading = getLoading(".table-border")
  getRequest(`${prefix}/store/get_plugin_store`)
    .then((response) => {
      loading.close()
      const resp = response.data as APIResponse
      if (resp && resp.suc) {
        if (resp.warning) {
          message?.warning({ message: resp.warning })
        } else {
          message?.success({ message: resp.info || "获取插件商店列表成功!" })
          const pluginData = resp.data as PluginListData
          tableData.value = Array.isArray(pluginData?.plugin_list)
            ? pluginData.plugin_list
            : []
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
        const errorMsg = resp
          ? resp.info
          : "无法获取插件商店列表，请检查网络连接或后端服务。"
        message?.error({ message: errorMsg || "获取插件商店列表失败" })
        tableData.value = []
        installPlugin.value = []
        authorList.value = []
      }
    })
    .catch((error) => {
      loading.close()
      message?.error({ message: `获取插件商店列表时出错：${error.message || error}` })
      console.error("[StoreTemplate Error] getPluginList catch:", error)
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
}

.title {
  margin-bottom: 1rem;

  h1 {
    transition: color 0.3s ease;
    font-size: 1.8rem;

    span {
      display: inline-block;
      transition: transform 0.3s ease;
    }
  }

  div {
    margin-top: 0.25rem;
    font-size: 0.9rem;
  }
}

.filter-button {
  transition: all 0.3s ease;

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);
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
:root[data-theme="dark"] {
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  overflow-y: auto;
  padding-right: 0.25rem;
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
  gap: 0.5rem;
  margin-top: auto;
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

    .card-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .plugin-card {
      padding: 0.9rem;
    }

    .plugin-card__actions {
      gap: 0.4rem;

      :deep(.my-button) {
        width: calc(50% - 0.2rem) !important;
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
