<template>
  <div class="main p-4 md:p-6" :style="{ background: 'var(--el-bg-color)' }">
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
        <el-input v-model="search" placeholder="搜索插件..." clearable size="medium" class="rounded-full">
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

    <!-- 表格部分 -->
    <div class="table-container flex flex-col flex-1 min-h-0" :style="{ height: getTableBorderHeight() + 'px' }">
      <div ref="tableWrapper" class="table-border flex-1 flex flex-col" :style="{
        background: 'var(--el-bg-color)',
        borderRadius: '12px',
        padding: '1rem',
        boxShadow: 'var(--el-box-shadow-light)',
        border: '1px solid var(--el-border-color-light)',
      }">
        <el-table :data="filterTableData" stripe :height="tableHeight" border style="width: 100%"
          class="rounded-lg overflow-hidden flex-1" :row-class-name="tableRowClassName" :key="tableKey">
          <el-table-column prop="name" label="插件" min-width="200" align="center" header-align="center">
            <template #header>
              <span :style="{
                color: 'var(--el-color-primary)',
                fontWeight: 'bold',
              }">名称</span>
            </template>
            <template #default="scope">
              <div class="name-border flex flex-col sm:flex-row sm:items-center justify-center gap-2">
                <div class="flex items-center justify-center min-w-0">
                  <a v-if="scope.row.github_url" :href="scope.row.github_url" target="_blank"
                    class="mr-2 hover:scale-110 transform transition-transform">
                    <svg-icon class="github-icon w-5 h-5" :style="{ color: 'var(--el-text-color-regular)' }"
                      name="github" />
                  </a>
                  <el-tooltip :content="scope.row.name" placement="top" effect="light">
                    <span class="truncate font-medium" :style="{ color: 'var(--el-text-color-primary)' }">
                      {{ scope.row.name }}
                    </span>
                  </el-tooltip>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="version" label="版本" width="110" align="center" header-align="center">
            <template #header>
              <span :style="{
                color: 'var(--el-color-primary)',
                fontWeight: 'bold',
              }">版本</span>
            </template>
            <template #default="scope">
              <el-tag size="small" effect="plain" :style="{
                border: '1px solid var(--el-color-primary-light-5)',
                background: 'var(--el-color-primary-light-9)',
                color: 'var(--el-color-primary)',
              }">
                v{{ scope.row.version }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="110" align="center" header-align="center">
            <template #header>
              <span :style="{
                color: 'var(--el-color-primary)',
                fontWeight: 'bold',
              }">状态</span>
            </template>
            <template #default="scope">
              <el-tag :type="getPluginStatus(scope.row).type" size="small" effect="plain">
                {{ getPluginStatus(scope.row).label }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="author" label="作者" width="160" header-align="center">
            <template #header>
              <span :style="{
                color: 'var(--el-color-primary)',
                fontWeight: 'bold',
              }">作者</span>
            </template>
            <template #default="scope">
              <div class="flex items-center justify-center">
                <svg-icon name="user" class="mr-2 w-4 h-4" :style="{ color: 'var(--el-color-primary-light-3)' }" />
                <span :style="{ color: 'var(--el-text-color-primary)' }">{{ scope.row.author }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="plugin_type" label="类型" width="120" align="center" header-align="center">
            <template #header>
              <span :style="{
                color: 'var(--el-color-primary)',
                fontWeight: 'bold',
              }">类型</span>
            </template>
            <template #default="scope">
              <el-tag :type="getPluginTypeColor(scope.row.plugin_type)" size="small" effect="dark">
                {{ scope.row.plugin_type }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="description" label="简介" min-width="260" align="center" header-align="center">
            <template #header>
              <span :style="{
                color: 'var(--el-color-primary)',
                fontWeight: 'bold',
              }">简介</span>
            </template>
            <template #default="scope">
              <div class="flex justify-center">
                <el-tooltip :content="scope.row.description" placement="top" effect="light">
                  <span class="line-clamp-2" :style="{ color: 'var(--el-text-color-secondary)' }">
                    {{ scope.row.description || '暂无介绍' }}
                  </span>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="290" align="center" header-align="center">
            <template #header>
              <span :style="{
                color: 'var(--el-color-primary)',
                fontWeight: 'bold',
              }">操作</span>
            </template>
            <template #default="scope">
              <div class="flex flex-wrap justify-center gap-1 md:gap-2">
                <my-button icon="download" text="安装" :iconHeight="20" :height="28" :width="70"
                  @click="handleInstall(scope.$index, scope.row)" type="primary"
                  :disabled="installPlugin.includes(scope.row.name)" rounded="full" :style="{
                    borderColor: 'var(--el-border-color)',
                  }" />
                <my-button icon="update" text="更新" :iconHeight="20" :height="28" :width="70"
                  @click="handleUpdate(scope.$index, scope.row)" type="warning"
                  :disabled="!installPlugin.includes(scope.row.name) || !scope.row.need_update" rounded="full" :style="{
                    borderColor: 'var(--el-border-color)',
                  }" />
                <my-button icon="remove" text="删除" :iconHeight="20" :height="28" :width="70"
                  @click="handleRemove(scope.$index, scope.row)" type="danger"
                  :disabled="!installPlugin.includes(scope.row.name)" rounded="full" :style="{
                    borderColor: 'var(--el-border-color)',
                  }" />
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, inject, h, render } from 'vue'
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
const tableHeight = ref<number | null>(null)
const resizeObserver = ref<ResizeObserver | null>(null)
const tableKey = ref(0)
const tableWrapper = ref<HTMLElement | null>(null)

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
  calculateTableHeight()
  setupResizeObserver()
})

onBeforeUnmount(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
})

const getTableBorderHeight = () => {
  if (isMobile()) {
    return (tableHeight.value || 0) - 160
  }
  return (tableHeight.value || 0) - 239
}

const calculateTableHeight = () => {
  setTimeout(() => {
    const headerElement = document.querySelector(".title") as HTMLElement | null
    const filterElement = document.querySelector(".filter") as HTMLElement | null
    const headerHeight = headerElement?.offsetHeight || 100
    const filterHeight = filterElement?.offsetHeight || 80
    const padding = 32

    const windowHeight = window.innerHeight
    const availableHeight = windowHeight - headerHeight - filterHeight - padding
    const newHeight = Math.max(availableHeight, 300)

    if (tableHeight.value !== newHeight) {
      tableHeight.value = newHeight
      tableKey.value += 1
    }
  }, 0)
}

const setupResizeObserver = () => {
  resizeObserver.value = new ResizeObserver(() => {
    calculateTableHeight()
  })

  if (tableWrapper.value) {
    resizeObserver.value.observe(tableWrapper.value)
  }

  window.addEventListener("resize", calculateTableHeight)
}

const tableRowClassName = ({ row }: { row: PluginData }) => {
  return installPlugin.value.includes(row.name) ? "installed-row" : ""
}

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

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
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

    .table-border {
      padding: 0.75rem;

      :deep(.el-table) {
        font-size: 0.82rem;

        th,
        td {
          padding: 8px 6px;
        }
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
