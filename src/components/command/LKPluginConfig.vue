<template>
  <section class="lk-plugin-config">
    <header class="config-header">
      <div>
        <h2>LK插件配置</h2>
        <p>设置 LK 插件的测试群、非健康模式群及聊天开关。</p>
      </div>
      <el-button :loading="loading" :disabled="saving" @click="loadConfig">刷新</el-button>
    </header>

    <div v-loading="loading" class="config-content">
      <DictChildren
        v-if="fields.length"
        :children="fields"
        :json-drafts="{}"
        :json-errors="{}"
        @field-change="updateField"
      />
      <el-empty v-else-if="!loading" description="暂无可配置项" />
    </div>

    <footer class="config-footer">
      <el-button
        type="primary"
        :loading="saving"
        :disabled="loading || fields.length === 0"
        @click="saveConfig"
      >
        保存配置
      </el-button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import DictChildren from '@/components/plugin/DictChildren.vue'
import type { PluginConfigField, PluginConfigSchema } from '@/types/plugin-config'
import { getRequest, postRequest } from '@/utils/api'
import { message } from '@/utils/message'

const prefix = inject<string>('prefix') as string
const fields = ref<PluginConfigField[]>([])
const loading = ref(false)
const saving = ref(false)

onMounted(() => {
  void loadConfig()
})

async function loadConfig() {
  loading.value = true
  try {
    const resp = await getRequest(`${prefix}/plugin/get_plugin_config`, { service: 'LK插件' })
    if (!resp.data.suc || !resp.data.data) {
      message.error(resp.data.info || '获取 LK 插件配置失败')
      return
    }

    const schema = resp.data.data as PluginConfigSchema
    if (!Array.isArray(schema.fields)) {
      throw new TypeError('LK 插件配置响应缺少 fields schema')
    }
    fields.value = schema.fields
  } catch (error) {
    console.error('获取 LK 插件配置失败:', error)
    message.error(error instanceof Error ? `获取配置失败：${error.message}` : '获取配置失败')
  } finally {
    loading.value = false
  }
}

function updateField(field: PluginConfigField, value: unknown) {
  field.value = value as PluginConfigField['value']
}

function collectValues(configFields: PluginConfigField[]): Record<string, unknown> {
  return Object.fromEntries(
    configFields.map((field) => [
      field.key,
      field.type === 'group' ? collectValues(field.children || []) : field.value,
    ]),
  )
}

async function saveConfig() {
  saving.value = true
  try {
    const resp = await postRequest(`${prefix}/plugin/update_plugin_config`, {
      service: 'LK插件',
      configs: collectValues(fields.value),
    })
    if (resp.data.suc) {
      if (resp.data.warning) {
        message.warning(resp.data.warning)
      } else {
        message.success(resp.data.info || 'LK 插件配置已保存')
      }
    } else {
      message.error(resp.data.info || '保存 LK 插件配置失败')
    }
  } catch (error) {
    console.error('保存 LK 插件配置失败:', error)
    message.error(error instanceof Error ? `保存配置失败：${error.message}` : '保存配置失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.lk-plugin-config {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--border-color-light);
  border-radius: 1rem;
  background-color: var(--bg-color-secondary);
  box-shadow: var(--el-box-shadow-light);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.lk-plugin-config:hover {
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--border-color-light));
}

.config-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color-light);
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
}

.config-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 1rem;
}

.config-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-color-light);
}

@media (max-width: 640px) {
  .config-header {
    flex-direction: column;
  }
}
</style>
