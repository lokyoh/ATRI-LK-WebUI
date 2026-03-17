<template>
  <div ref="pluginManager" class="plugin-manager p-4 md:p-6 rounded-2xl flex flex-col"
    :style="{ backgroundColor: 'var(--bg-color)' }">
    <!-- 顶部插件类型选择 -->
    <div class="type-selector-container flex justify-between items-center mb-6 shrink-0">
      <div class="type-selector rounded-xl shadow-md p-1 inline-flex" :style="{
        backgroundColor: 'var(--bg-color-secondary)',
        border: '1px solid var(--border-color-light)',
      }" ref="typeSelectorRef">
        <button v-for="type in pluginTypes" :key="type.value" @click="clickPluginType(type.value)"
          class="px-4 py-2 text-sm font-medium transition-all duration-300" :class="{
            'text-white shadow-inner': activeBtn === type.value,
            'hover:bg-opacity-10': activeBtn !== type.value,
            'rounded-l-lg': type.first,
            'rounded-r-lg': type.last,
          }" :style="{
            backgroundColor:
              activeBtn === type.value ? 'var(--primary-color)' : 'transparent',
            color:
              activeBtn === type.value
                ? 'var(--bg-color)'
                : 'var(--primary-color)',
          }">
          {{ type.label }}({{ pluginCount[type.countKey] }})
        </button>
      </div>

      <!-- 安装依赖按钮 -->
      <CuteButton @click="showInstallDependencyDialog = true" type="primary" icon="download"
        :iconColor="'var(--button-icon-color-info)'"
        class="px-4 py-2 text-sm rounded-full transition-colors duration-200 flex items-center gap-1" size="sm">
        <i class="fas fa-box mr-1"></i>
        依赖管理
      </CuteButton>
    </div>

    <!-- 插件列表 -->
    <div class="plugin-list-container flex-1 rounded-xl shadow-md p-4 min-h-0" :style="{
      backgroundColor: 'var(--bg-color-secondary)',
      border: '1px solid var(--border-color-light)',
    }">
      <PluginListTemplate ref="pluginListRef" :pluginType="activeBtn" :key="pltKey" />
    </div>

    <!-- 安装依赖对话框 -->
    <NeonDialog v-model:visible="showInstallDependencyDialog" title="依赖管理" icon-class="download"
      @confirm="installDependency" class="dependency-dialog">
      <div class="flex flex-col gap-4">
        <!-- 操作类型选择 -->
        <div class="flex items-center gap-4">
          <div class="operation-selector flex rounded-lg overflow-hidden"
            :style="{ border: '1px solid var(--border-color-light)' }">
            <button @click="dependencyOperation = 'install'"
              class="px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center" :style="{
                backgroundColor:
                  dependencyOperation === 'install'
                    ? 'var(--primary-color)'
                    : 'var(--bg-color)',
                color:
                  dependencyOperation === 'install'
                    ? 'var(--bg-color)'
                    : 'var(--primary-color)',
              }">
              <i class="fas fa-download mr-2"></i>安装
            </button>
            <button @click="dependencyOperation = 'uninstall'"
              class="px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center" :style="{
                backgroundColor:
                  dependencyOperation === 'uninstall'
                    ? 'var(--danger-color)'
                    : 'var(--bg-color)',
                color:
                  dependencyOperation === 'uninstall'
                    ? 'var(--bg-color)'
                    : 'var(--danger-color)',
              }">
              <i class="fas fa-trash-alt mr-2"></i>卸载
            </button>
          </div>
          <div class="grow">
            <NeonInput v-model="dependencyName" class="fm-input" :placeholder="dependencyOperation === 'install'
              ? '请输入要安装的依赖名称...'
              : '请输入要卸载的依赖名称...'
              " />
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="tip-container px-4 py-3 rounded-lg text-xs flex items-start" :style="{
          backgroundColor:
            dependencyOperation === 'install'
              ? 'var(--primary-color-light-9)'
              : 'var(--danger-color-light)',
          border: `1px dashed ${dependencyOperation === 'install'
            ? 'var(--primary-color-light)'
            : 'var(--danger-color)'
            }`,
          color:
            dependencyOperation === 'install'
              ? 'var(--primary-color)'
              : 'var(--danger-color)',
        }">
          <i class="fas fa-lightbulb mt-1 mr-3 text-base"></i>
          <div class="grow">
            <span v-if="dependencyOperation === 'install'">
              <div class="font-medium mb-1">安装依赖提示：</div>
              <ul class="list-disc list-inside space-y-1">
                <li>可以指定版本或安装多个依赖（使用空格分离）</li>
                <li>
                  指定版本使用等号：<code class="px-1 py-0.5 rounded bg-white bg-opacity-30">httpx==0.27</code>
                </li>
                <li>
                  安装多个依赖：<code class="px-1 py-0.5 rounded bg-white bg-opacity-30">httpx requests</code>
                </li>
              </ul>
            </span>
            <span v-else>
              <div class="font-medium mb-1">卸载依赖提示：</div>
              <ul class="list-disc list-inside space-y-1">
                <li>可以卸载多个依赖（使用空格分离）</li>
                <li>
                  卸载多个依赖：<code class="px-1 py-0.5 rounded bg-white bg-opacity-30">httpx requests</code>
                </li>
                <li>请确认依赖名称正确，避免卸载系统依赖</li>
              </ul>
            </span>
          </div>
        </div>

        <!-- 结果显示区域 -->
        <div class="result-container p-4 rounded-lg text-sm overflow-auto" :style="{
          backgroundColor: 'var(--bg-color)',
          border: '1px solid var(--border-color-light)',
          minHeight: '120px',
        }">
          <pre v-if="installResult" class="whitespace-pre-wrap">{{
            installResult
          }}</pre>
          <div v-else class="flex items-center justify-center h-full text-center text-gray-400">
            <div class="text-center">
              <i class="fas fa-terminal text-2xl mb-2"></i>
              <div>返回结果将显示在这里</div>
            </div>
          </div>
        </div>
      </div>
    </NeonDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject } from "vue"
import PluginListTemplate from "@/components/plugin/PluginListTemplate.vue"
import CuteButton from "@/components/ui/CuteButton.vue"
import NeonDialog from "@/components/ui/NeonDialog.vue"
import NeonInput from "@/components/ui/NeonInput.vue"
import { getRequest, postRequest } from "@/utils/api"
import { message } from "@/utils/message"
import { getLoading } from "@/utils/loading"

const prefix = inject<string>("prefix") as string

interface PluginType {
  value: string
  label: string
  countKey: string
  first?: boolean
  last?: boolean
}


const pluginTypes = ref<PluginType[]>([
  { value: "系统服务", label: "系统服务", countKey: "system", first: true },
  { value: "LK扩展服务", label: "LK扩展服务", countKey: "lkplugin" },
  { value: "功能性服务", label: "功能性服务", countKey: "function" },
  { value: "娱乐服务", label: "娱乐服务", countKey: "entertainment" },
  { value: "游戏服务", label: "游戏服务", countKey: "game" },
  { value: "订阅服务", label: "订阅服务", countKey: "subscribe" },
  { value: "其他服务", label: "其他服务", countKey: "other" },
  { value: "隐藏服务", label: "隐藏服务", countKey: "hidden", last: true },
])
const pluginCount = ref<{ [key: string]: number }>({
  system: 0,
  lkplugin: 0,
  function: 0,
  entertainment: 0,
  game: 0,
  subscribe: 0,
  other: 0,
  hidden: 0,
})
const activeBtn = ref("系统服务")
const pltKey = ref(0)
const showInstallDependencyDialog = ref(false)
const dependencyName = ref("")
const installResult = ref("")
const dependencyOperation = ref("install")

onMounted(() => {
  window.addEventListener("resize", handleResize)
  getPluginCount()
  handleResize()
})

onUnmounted(() => {
  window.removeEventListener("resize", handleResize)
})

function handleResize() {
  // 使用 flexbox 布局后，不再需要手动计算高度
  // 插件列表会自动填充剩余空间
}

function clickPluginType(pluginType: string) {
  activeBtn.value = pluginType
  pltKey.value++
}

function getPluginCount() {
  getRequest(`${prefix}/plugin/get_plugin_count`)
    .then((resp) => {
      if (!resp) {
        message.error("获取插件数量失败：无效的响应")
        return
      }
      if (resp.data.suc) {
        if (resp.data.warning) {
          message.warning(resp.data.warning)
        } else {
          // 只更新存在的字段
          const data = resp.data.data || resp.data
          Object.keys(pluginCount.value).forEach((key) => {
            if (key in data) {
              pluginCount.value[key] = data[key]
            }
          })
        }
      } else {
        message.error(resp.data.info || "获取插件数量失败")
      }
    })
    .catch((error) => {
      message.error("请求插件数量失败：" + error)
    })
}


function installDependency() {
  const dependency = dependencyName.value.trim()
  if (!dependency) {
    message.warning("依赖名称不能为空")
    return
  }

  const isInstall = dependencyOperation.value === "install"
  const operationText = isInstall ? "安装" : "卸载"

  installResult.value = `正在${operationText}依赖，请稍候...`

  const loading = getLoading(".result-container")

  postRequest(`${prefix}/plugin/install_dependencies`, {
    dependencies: dependency.split(" "),
    handle_type: dependencyOperation.value,
  })
    .then((resp) => {
      loading.close()
      if (!resp) {
        installResult.value = `${operationText}失败：无效的响应`
        return
      }

      if (resp.data.suc) {
        installResult.value = resp.data || `${operationText}成功！`
        message.success(`依赖${operationText}执行成功`)
      } else {
        installResult.value =
          resp.data.info || `${operationText}失败，请查看详细信息`
        message.error(resp.data.info || `${operationText}依赖失败`)
      }
    })
    .catch((error) => {
      loading.close()
      installResult.value = `${operationText}失败: ${error}`
      message.error(`请求失败: ${error}`)
    })
}
</script>

<style scoped>
/* 二次元可爱风格动画 */
@keyframes bounce-in {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-bounce-in {
  animation: bounce-in 0.3s ease-out;
}

/* 插件卡片悬停效果 */
.plugin-list-container {
  transition: all 0.3s ease;
}

.plugin-list-container:hover {
  box-shadow: var(--primary-shadow);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .type-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }

  .type-selector button {
    border-radius: 8px !important;
  }

  .bulk-actions {
    padding: 8px;
  }

  .bulk-actions select {
    width: 100%;
  }

  .type-selector-container {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .type-selector-container .type-selector {
    width: 100%;
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--bg-color-hover);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: var(--primary-color-light);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

/* 依赖安装对话框 */
.dependency-dialog :deep(.el-dialog) {
  width: 90% !important;
  max-width: 600px !important;
}

.dependency-dialog .result-container {
  height: 200px;
  font-family: monospace;
  transition: all 0.3s ease;
}

.dependency-dialog .operation-selector {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.dependency-dialog .operation-selector button {
  position: relative;
  overflow: hidden;
}

.dependency-dialog .operation-selector button::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.dependency-dialog .operation-selector button:hover::before {
  width: 150%;
  height: 150%;
}

.dependency-dialog .tip-container {
  transition: all 0.3s ease;
}

.dependency-dialog .tip-container code {
  transition: all 0.3s ease;
}

.dependency-dialog .tip-container code:hover {
  background-color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 640px) {
  .dependency-dialog :deep(.el-dialog) {
    width: 95% !important;
  }

  .dependency-dialog .result-container {
    height: 150px;
  }

  .dependency-dialog .operation-selector {
    width: 100%;
  }

  .dependency-dialog .operation-selector button {
    flex: 1;
  }

  .dependency-dialog .flex.items-center.gap-4 {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
