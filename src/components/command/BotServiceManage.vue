<template>
  <section
    class="plugin-section"
    :style="{ backgroundColor: 'var(--bg-color-secondary)' }"
  >
    <h3
      class="text-md font-bold mb-4 flex items-center"
      :style="{ color: 'var(--primary-color)' }"
    >
      <svg-icon name="plugin" class="mr-2" color="var(--primary-color-light)" />
      Bot服务管理
    </h3>

    <div class="space-y-6">
      <div class="grid grid-cols-12 gap-4 items-center">
        <label class="col-span-3 text-xs" :style="{ color: 'var(--text-color-secondary)' }">
          禁用被动
        </label>
        <div class="col-span-9">
          <el-select
            v-model="postData.blockTasks"
            multiple
            placeholder="请选择要禁用的被动"
            class="w-full"
            popper-class="cute-select-dropdown"
          >
            <el-option
              v-for="task in botModuleData.allTasks"
              :key="task"
              :label="task"
              :value="task"
            />
          </el-select>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-4 items-center">
        <label class="col-span-3 text-xs" :style="{ color: 'var(--text-color-secondary)' }">
          禁用插件
        </label>
        <div class="col-span-9">
          <el-select
            v-model="postData.blockPlugins"
            multiple
            placeholder="请选择要禁用的插件"
            class="w-full"
            popper-class="cute-select-dropdown"
          >
            <el-option
              v-for="plugin in botModuleData.allPlugins"
              :key="plugin"
              :label="plugin"
              :value="plugin"
            />
          </el-select>
        </div>
      </div>

      <button
        @click="clickServiceManage"
        class="w-full py-2 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 text-sm"
        :style="{
          background:
            'linear-gradient(to right, var(--primary-color), var(--primary-color-light))',
        }"
      >
        应用设置
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'
import { getLoading } from '@/utils/loading'
import { getRequest, postRequest } from '@/utils/api'
import { message } from '@/utils/message'

const prefix = inject<string>('prefix') as string

interface BotBlockModule {
  bot_id: string
  block_plugins: string[]
  block_tasks: string[]
  all_plugins: string[]
  all_tasks: string[]
}

interface GetBlockModuleResponse {
  suc: boolean
  info: string
  warning?: string
  data: BotBlockModule
}

interface UpdateServiceManageResponse {
  suc: boolean
  info: string
  warning?: string
}

const botModuleData = ref<{ allPlugins: string[]; allTasks: string[] }>({
  allPlugins: [],
  allTasks: [],
})
const postData = ref<{ blockPlugins: string[]; blockTasks: string[] }>({
  blockPlugins: [],
  blockTasks: [],
})

onMounted(() => {
  getModuleData()
})

function getModuleData() {
  const loading = getLoading('.plugin-section')
  getRequest(`${prefix}/main/get_block_module`).then((resp: { data: GetBlockModuleResponse }) => {
    if (resp.data.suc) {
      if (resp.data.warning) {
        message.warning(resp.data.info)
      } else {
        message.success(resp.data.info)
        botModuleData.value.allPlugins = resp.data.data.all_plugins
        botModuleData.value.allTasks = resp.data.data.all_tasks
        postData.value.blockPlugins = resp.data.data.block_plugins
        postData.value.blockTasks = resp.data.data.block_tasks
      }
    } else {
      message.error(resp.data.info)
    }
    loading.close()
  })
}

function clickServiceManage() {
  const loading = getLoading('.plugin-section')
  postRequest(`${prefix}/main/update_service_manage`, {
    block_plugins: postData.value.blockPlugins,
    block_tasks: postData.value.blockTasks,
  }).then((resp: { data: UpdateServiceManageResponse }) => {
    if (resp.data.suc) {
      if (resp.data.warning) {
        message.warning(resp.data.info)
      } else {
        message.success(resp.data.info)
      }
    } else {
      message.error(resp.data.info)
    }
    loading.close()
  })
}
</script>

<style scoped>
.plugin-section {
  flex-grow: 1;
  min-height: 300px;
  overflow-y: auto;
  padding: 1.125rem;
  border: 1px solid var(--border-color-light);
  border-radius: 1rem;
  background-color: var(--bg-color-secondary);
  box-shadow: var(--el-box-shadow-light);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.plugin-section:hover {
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--border-color-light));
}
</style>
