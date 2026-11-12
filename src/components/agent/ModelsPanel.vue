<template>
  <div class="models-panel">
    <div class="panel-header">
      <div>
        <h4>模型管理</h4>
        <p>管理 LLM Provider 与其对应的模型配置。</p>
      </div>
      <div class="action-bar">
        <el-button @click="loadProviders" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="openProviderDialog">添加 Provider</el-button>
      </div>
    </div>

    <div v-if="providers.length" class="panel-body">
      <div class="provider-list">
        <div
          v-for="provider in providers"
          :key="provider.provider_name"
          :class="[
            'provider-card',
            { active: activeProvider?.provider_name === provider.provider_name },
          ]"
          @click="selectProvider(provider.provider_name)"
        >
          <div class="provider-card-top">
            <strong>{{ provider.provider_name }}</strong>
            <el-tag size="small" effect="plain">{{ provider.provider_type || 'unknown' }}</el-tag>
          </div>
          <div class="provider-meta">{{ provider.url || '未配置地址' }}</div>
          <div class="provider-meta">模型数：{{ provider.models?.length || 0 }}</div>
        </div>
      </div>

      <div class="provider-detail">
        <div v-if="activeProvider" class="detail-card">
          <div class="detail-header">
            <div>
              <h5>{{ activeProvider.provider_name }}</h5>
              <p>{{ activeProvider.provider_type || '未指定类型' }}</p>
            </div>
            <div class="detail-actions">
              <el-button size="small" type="primary" @click="openModelDialog">添加模型</el-button>
              <el-button size="small" plain @click="openProviderDialog(activeProvider)"
                >编辑 Provider</el-button
              >
              <el-button size="small" type="danger" plain @click="handleDeleteProvider"
                >删除 Provider</el-button
              >
            </div>
          </div>

          <div class="detail-info">
            <div>
              <span>地址</span><strong>{{ activeProvider.url || '未配置' }}</strong>
            </div>
            <div>
              <span>密钥</span>
              <div class="key-tags">
                <el-tag
                  v-for="item in activeProvider.api_key || []"
                  :key="item.name"
                  size="small"
                  effect="plain"
                >
                  {{ item.name }}
                </el-tag>
                <span v-if="!activeProvider.api_key?.length">未配置</span>
              </div>
            </div>
          </div>

          <div class="model-list">
            <template v-if="activeProvider.models?.length">
              <div v-for="model in activeProvider.models" :key="model.name" class="model-item">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
                    <div class="model-name">{{ model.name }}</div>
                    <template v-if="normalizeModelTypes(model.type).length">
                      <el-tag
                        v-for="type in normalizeModelTypes(model.type)"
                        :key="`${model.name}-${type}`"
                        size="small"
                        :type="typeColor(type)"
                        class="model-type-tag"
                      >
                        {{ type }}
                      </el-tag>
                    </template>
                    <el-tag
                      v-for="keyName in normalizeKeySelectors(model.api_key)"
                      :key="`${model.name}-key-${keyName}`"
                      size="small"
                      effect="plain"
                    >
                      密钥: {{ displayKeyName(keyName) }}
                    </el-tag>
                    <el-tag
                      v-if="!normalizeKeySelectors(model.api_key).length"
                      size="small"
                      type="info"
                      effect="plain"
                    >
                      默认密钥
                    </el-tag>
                  </div>
                  <div class="model-meta">{{ model.model }} · temp {{ model.temperature }}</div>
                  <div class="model-meta">{{ pricingText(model.pricing) }}</div>
                </div>
                <div style="display: flex; gap: 8px">
                  <el-button
                    size="small"
                    type="success"
                    plain
                    :loading="testingModelName === model.name"
                    :disabled="!!testingModelName"
                    @click="handleTestModel(model)"
                    >测试 API</el-button
                  >
                  <el-button size="small" plain @click="openModelDialog(model)">编辑</el-button>
                  <el-button size="small" type="danger" plain @click="handleDeleteModel(model.name)"
                    >删除</el-button
                  >
                </div>
              </div>
            </template>
            <div v-else class="empty-state">当前 Provider 暂无模型</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">暂无 Provider，请先添加一个。</div>

    <el-dialog
      v-model="providerDialogVisible"
      :title="providerEditMode ? '编辑 Provider' : '添加 Provider'"
      width="560px"
    >
      <el-form :model="providerForm" label-position="top">
        <el-form-item label="Provider 名称">
          <el-input v-model="providerForm.provider_name" placeholder="例如 siliconflow" />
        </el-form-item>
        <el-form-item label="Provider 类型">
          <el-select
            v-model="providerForm.provider_type"
            placeholder="请选择 Provider 类型"
            :loading="typeOptionsLoading"
            class="w-full"
          >
            <el-option v-for="type in providerTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="API 地址">
          <el-input v-model="providerForm.url" placeholder="https://api.example.com/v1" />
        </el-form-item>
        <el-form-item label="API Key">
          <div class="key-editor">
            <div v-for="(item, index) in providerForm.api_key" :key="index" class="key-row">
              <el-input v-model="item.name" placeholder="名称（如 main）" />
              <el-input
                v-model="item.key"
                placeholder="密钥；留空保持原密钥"
                show-password
              />
              <el-button text type="danger" @click="removeKey(index)">删除</el-button>
            </div>
            <el-button text type="primary" @click="addKey">+ 添加密钥</el-button>
            <div class="api-hint">
              一个 Provider 只对应一个 URL。密钥可命名，模型可按名称选择；未选择时默认使用第一个密钥。
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="providerDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSaveProvider"
            >确认</el-button
          >
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="modelDialogVisible"
      :title="modelEditMode ? '编辑模型' : '添加模型'"
      width="560px"
    >
      <el-form :model="modelForm" label-position="top">
        <el-form-item label="显示名称">
          <el-input v-model="modelForm.name" placeholder="例如 my-model" />
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input v-model="modelForm.model" placeholder="例如 gpt-4o" />
        </el-form-item>
        <el-form-item label="温度">
          <el-input-number v-model="modelForm.temperature" :min="0" :max="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="API 密钥">
          <el-select
            :model-value="normalizeKeySelectors(modelForm.api_key)"
            :multiple="true"
            collapse-tags
            collapse-tags-tooltip
            clearable
            placeholder="留空 = 使用第一个密钥"
            class="w-full"
            @update:model-value="handleKeySelectionChange"
          >
            <el-option label="全部密钥（含以后新增）" value="all" />
            <el-option
              v-for="item in activeProvider?.api_key || []"
              :key="item.name"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            :model-value="normalizeModelTypes(modelForm.type)"
            @update:model-value="modelForm.type = $event"
            multiple
            collapse-tags
            collapse-tags-tooltip
            clearable
            placeholder="请选择模型类型"
            :loading="typeOptionsLoading"
            class="w-full"
          >
            <el-option v-for="type in modelTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="附加配置 (JSON)">
          <el-input
            v-model="modelDataText"
            type="textarea"
            :rows="4"
            placeholder='{"max_tokens": 2048, "response_format": {"type": "json_object"}}'
          />
        </el-form-item>
        <el-form-item label="计费配置">
          <div class="pricing-block">
            <div class="pricing-switch">
              <el-switch v-model="pricingEnabled" active-text="启用计费" />
              <span class="pricing-hint">单价单位：元 / 每 100 万 Token，留空即 0，没有缓存命中价格则配置缓存命中价格与输入价格一致即可</span>
            </div>
            <div v-if="pricingEnabled" class="pricing-grid">
              <label>
                <span>输入单价</span>
                <el-input-number
                  v-model="pricingForm.input"
                  :min="0"
                  :step="0.1"
                  :precision="4"
                  controls-position="right"
                />
              </label>
              <label>
                <span>输出单价</span>
                <el-input-number
                  v-model="pricingForm.output"
                  :min="0"
                  :step="0.1"
                  :precision="4"
                  controls-position="right"
                />
              </label>
              <label>
                <span>缓存命中单价</span>
                <el-input-number
                  v-model="pricingForm.cache_hit"
                  :min="0"
                  :step="0.1"
                  :precision="4"
                  controls-position="right"
                />
              </label>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="modelDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSaveModel">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { getRequest, postRequest } from '@/utils/api'
import { message } from '@/utils/message'
import type { ModelPricing } from '@/types/agent'

interface LLMModel {
  name: string
  model: string
  temperature: number
  type: string | string[]
  api_key?: string | string[]
  pricing?: ModelPricing | null
  // 附加配置是后端原样透传的任意 JSON，这里只要求是对象
  data?: Record<string, unknown>
}

interface LLMProviderKey {
  name: string
  key: string
  previous_name?: string
}

interface LLMProvider {
  provider_name: string
  provider_type: string
  url: string
  api_key: LLMProviderKey[]
  models: LLMModel[]
}

interface LLMProviderForm {
  provider_name: string
  provider_type: string
  url: string
  api_key: LLMProviderKey[]
  models: LLMModel[]
}

interface ProviderResponse {
  suc: boolean
  code: number
  info: string
  data?: LLMProvider[]
}

interface TypeOptionsResponse {
  suc: boolean
  code: number
  info: string
  data?: string[]
}

const prefix = inject<string>('prefix', '/atri/api')
const loading = ref(false)
const submitting = ref(false)
const testingModelName = ref('')
const typeOptionsLoading = ref(false)
const providers = ref<LLMProvider[]>([])
const providerTypes = ref<string[]>([])
const modelTypes = ref<string[]>([])
const activeProviderName = ref('')
const providerDialogVisible = ref(false)
const modelDialogVisible = ref(false)
const providerEditMode = ref(false)
const providerOriginalName = ref('')
const modelEditMode = ref(false)
const modelOriginalName = ref('')

const emptyKey = (): LLMProviderKey => ({
  name: '',
  key: '',
  previous_name: '',
})

const providerForm = reactive<LLMProviderForm>({
  provider_name: '',
  provider_type: '',
  url: '',
  api_key: [emptyKey()],
  models: [],
})

const addKey = () => {
  providerForm.api_key.push(emptyKey())
}

const removeKey = (index: number) => {
  providerForm.api_key.splice(index, 1)
}

const providerKeysPayload = () =>
  providerForm.api_key
    .filter((item) => item.name.trim() || item.key.trim())
    .map((item) => ({
      name: item.name.trim(),
      key: item.key.trim(),
      previous_name: item.previous_name || '',
    }))

const normalizeKeySelectors = (value?: string | string[] | null): string[] => {
  if (!value) return []
  return Array.isArray(value) ? [...value] : [value]
}

const displayKeyName = (name: string) =>
  name === 'all' || name === '*' ? '全部密钥' : name

/** “全部密钥”与具体名称互斥，避免保存出无意义的组合 */
const handleKeySelectionChange = (values: string[]) => {
  modelForm.api_key = values.includes('all') ? ['all'] : [...values]
}

const normalizeModelTypes = (value?: string | string[] | null) => {
  if (!value) return []
  const values = Array.isArray(value) ? value : [value]
  return values
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim())
    .filter((item) => item !== 'click' && item !== 'Click')
}

const modelDataText = ref('{}')

/** 计费开关：关闭时保存 pricing=null，即该模型不计费 */
const pricingEnabled = ref(false)

const emptyPricing = (): ModelPricing => ({ input: 0, output: 0, cache_hit: 0 })

/** 与 modelForm 平行的计费表单，避免嵌套可选字段带来的空值判断 */
const pricingForm = reactive<ModelPricing>(emptyPricing())

/** 后端 pricing 为 null/缺省时视为未启用计费 */
const normalizePricing = (pricing?: ModelPricing | null): ModelPricing => ({
  input: Number(pricing?.input ?? 0),
  output: Number(pricing?.output ?? 0),
  cache_hit: Number(pricing?.cache_hit ?? 0),
})

const pricingText = (pricing?: ModelPricing | null) => {
  if (!pricing) return '未配置计费'
  return `计费 ${pricing.input}/${pricing.output}/${pricing.cache_hit} 元·M⁻¹（输入/输出/缓存）`
}

const modelForm = reactive<LLMModel>({
  name: '',
  model: '',
  temperature: 0.7,
  type: [],
  api_key: [],
  data: {},
})

const activeProvider = computed(() => {
  return (
    providers.value.find((provider) => provider.provider_name === activeProviderName.value) || null
  )
})

const typeColor = (t: string) => {
  if (!t) return 'info'
  const map: Record<string, string> = {
    chat: 'success',
    tool: 'warning',
    image: 'info',
    embedding: 'primary',
    tts: 'info',
    sys1: 'danger',
  }
  return map[t] || 'info'
}

const loadProviders = async () => {
  loading.value = true
  try {
    const resp = await getRequest(`${prefix}/agent/get_providers`)
    const payload = resp.data as ProviderResponse

    if (payload.suc) {
      providers.value = payload.data || []
      if (!activeProviderName.value && providers.value.length) {
        activeProviderName.value = providers.value[0]?.provider_name || ''
      } else if (activeProviderName.value) {
        const exists = providers.value.some(
          (provider) => provider.provider_name === activeProviderName.value,
        )
        if (!exists) {
          activeProviderName.value = providers.value[0]?.provider_name || ''
        }
      }
    } else {
      message.error(payload.info || '获取 Provider 列表失败')
    }
  } catch (error) {
    console.error('loadProviders error', error)
    message.error('获取 Provider 列表失败')
  } finally {
    loading.value = false
  }
}

const loadTypeOptions = async () => {
  typeOptionsLoading.value = true
  const [providerResult, modelResult] = await Promise.allSettled([
    postRequest(`${prefix}/agent/get_provider_type`),
    postRequest(`${prefix}/agent/get_model_type`),
  ])

  if (providerResult.status === 'fulfilled') {
    const payload = providerResult.value.data as TypeOptionsResponse
    if (payload?.suc && Array.isArray(payload.data)) {
      providerTypes.value = payload.data
    } else {
      console.error('loadProviderTypes failed', payload?.info)
      message.error(payload?.info || '获取 Provider 类型失败')
    }
  } else {
    console.error('loadProviderTypes error', providerResult.reason)
    message.error('获取 Provider 类型失败')
  }

  if (modelResult.status === 'fulfilled') {
    const payload = modelResult.value.data as TypeOptionsResponse
    if (payload?.suc && Array.isArray(payload.data)) {
      modelTypes.value = payload.data.filter(
        (type) => typeof type === 'string' && type.trim() && type.toLowerCase() !== 'click',
      )
    } else {
      console.error('loadModelTypes failed', payload?.info)
      message.error(payload?.info || '获取模型类型失败')
    }
  } else {
    console.error('loadModelTypes error', modelResult.reason)
    message.error('获取模型类型失败')
  }
  typeOptionsLoading.value = false
}

const selectProvider = (providerName: string) => {
  activeProviderName.value = providerName
}

const openProviderDialog = (provider?: LLMProvider | null) => {
  providerEditMode.value = !!provider
  providerDialogVisible.value = true
  if (provider) {
    providerOriginalName.value = provider.provider_name
    Object.assign(providerForm, {
      provider_name: provider.provider_name,
      provider_type: provider.provider_type,
      url: provider.url || '',
      // 密钥内容不回填；留空表示按名称沿用原密钥
      api_key: (provider.api_key?.length ? provider.api_key : [emptyKey()]).map((item) => ({
        name: item.name,
        key: '',
        previous_name: item.name,
      })),
      models: provider.models || [],
    })
  } else {
    providerOriginalName.value = ''
    Object.assign(providerForm, {
      provider_name: '',
      provider_type: providerTypes.value[0] || '',
      url: '',
      api_key: [emptyKey()],
      models: [],
    })
  }
}

const openModelDialog = (model?: LLMModel | null) => {
  if (!activeProvider.value) {
    message.warning('请先选择一个 Provider')
    return
  }
  modelEditMode.value = !!model
  modelDialogVisible.value = true
  if (model) {
    modelOriginalName.value = model.name
    Object.assign(pricingForm, normalizePricing(model.pricing))
    pricingEnabled.value = !!model.pricing
    Object.assign(modelForm, {
      name: model.name,
      model: model.model,
      temperature: model.temperature,
      type: normalizeModelTypes(model.type),
      api_key: normalizeKeySelectors(model.api_key),
      data: model.data || {},
    })
  } else {
    modelOriginalName.value = ''
    Object.assign(pricingForm, emptyPricing())
    pricingEnabled.value = false
    Object.assign(modelForm, {
      name: '',
      model: '',
      temperature: 0.7,
      type: modelTypes.value[0] ? [modelTypes.value[0]] : [],
      api_key: [],
      data: {},
    })
  }
  modelDataText.value = JSON.stringify(modelForm.data || {}, null, 2)
}

const handleSaveProvider = async () => {
  if (!providerForm.provider_name.trim()) {
    message.warning('请输入 Provider 名称')
    return
  }
  if (!providerForm.url.trim()) {
    message.warning('请输入 API 地址')
    return
  }

  submitting.value = true
  try {
    if (providerEditMode.value) {
      // 改名也走 set_provider：后端会保留现有密钥，并在成功后删除旧名称。
      const resp = await postRequest(
        `${prefix}/agent/set_provider?provider_name=${encodeURIComponent(providerOriginalName.value || providerForm.provider_name)}`,
        {
          provider_name: providerForm.provider_name,
          provider_type: providerForm.provider_type,
          url: providerForm.url.trim(),
          api_key: providerKeysPayload(),
          models: providerForm.models || [],
        },
      )
      if (resp.data?.suc) {
        message.success(resp.data.info || '修改 Provider 成功')
        providerDialogVisible.value = false
        await loadProviders()
      } else {
        message.error(resp.data?.info || '修改 Provider 失败')
      }
    } else {
      // add new
      const payload = await postRequest(`${prefix}/agent/add_provider`, {
        provider_name: providerForm.provider_name,
        provider_type: providerForm.provider_type,
        url: providerForm.url.trim(),
        api_key: providerKeysPayload(),
        models: [],
      })
      if (payload.data?.suc) {
        message.success(payload.data.info || '添加 Provider 成功')
        providerDialogVisible.value = false
        await loadProviders()
      } else {
        message.error(payload.data?.info || '添加 Provider 失败')
      }
    }
  } catch (error) {
    console.error('saveProvider error', error)
    message.error('保存 Provider 失败')
  } finally {
    submitting.value = false
    providerEditMode.value = false
    providerOriginalName.value = ''
  }
}

const handleSaveModel = async () => {
  if (!activeProvider.value) {
    message.warning('请先选择 Provider')
    return
  }
  if (!modelForm.name.trim() || !modelForm.model.trim()) {
    message.warning('请完整填写模型名称')
    return
  }

  const normalizedTypes = normalizeModelTypes(modelForm.type)
  if (!normalizedTypes.length) {
    message.warning('请选择模型类型')
    return
  }

  let parsedData: Record<string, unknown> = {}
  const rawData = modelDataText.value.trim()
  if (rawData) {
    try {
      const parsed: unknown = JSON.parse(rawData)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        parsedData = parsed as Record<string, unknown>
      } else {
        throw new Error('JSON 必须是对象')
      }
    } catch {
      message.warning('附加配置必须是合法的 JSON 对象')
      return
    }
  }

// 计费配置：关闭开关即写入 null（不计费）；开启时三项单价必须为非负有限数
  let pricingPayload: ModelPricing | null = null
  if (pricingEnabled.value) {
    const pricing = normalizePricing(pricingForm)
    const invalid = Object.values(pricing).some((value) => !Number.isFinite(value) || value < 0)
    if (invalid) {
      message.warning('计费单价必须是非负数字')
      return
    }
    pricingPayload = pricing
  }

  const keySelectors = normalizeKeySelectors(modelForm.api_key)

  submitting.value = true
  try {
    if (modelEditMode.value && modelOriginalName.value) {
      // delete old then add new (handles rename)
      await postRequest(
        `${prefix}/agent/del_model?provider_name=${encodeURIComponent(activeProvider.value.provider_name)}&model_name=${encodeURIComponent(modelOriginalName.value)}`,
      )
    }

    const payload = await postRequest(
      `${prefix}/agent/add_model?provider_name=${encodeURIComponent(activeProvider.value.provider_name)}`,
      {
        name: modelForm.name,
        model: modelForm.model,
        temperature: modelForm.temperature,
        type: normalizedTypes.length === 1 ? normalizedTypes[0] : normalizedTypes,
        api_key: keySelectors.length === 1 ? keySelectors[0] : keySelectors,
        pricing: pricingPayload,
        data: parsedData,
      },
    )

    if (payload.data?.suc) {
      message.success(payload.data.info || (modelEditMode.value ? '修改模型成功' : '添加模型成功'))
      modelDialogVisible.value = false
      await loadProviders()
    } else {
      message.error(payload.data?.info || (modelEditMode.value ? '修改模型失败' : '添加模型失败'))
    }
  } catch (error) {
    console.error('saveModel error', error)
    message.error(modelEditMode.value ? '修改模型失败' : '添加模型失败')
  } finally {
    submitting.value = false
    modelEditMode.value = false
    modelOriginalName.value = ''
  }
}

const handleDeleteProvider = async () => {
  if (!activeProvider.value) return

  try {
    await ElMessageBox.confirm(
      `确定删除 Provider ${activeProvider.value.provider_name} 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    const payload = await postRequest(
      `${prefix}/agent/del_provider?provider_name=${encodeURIComponent(activeProvider.value.provider_name)}`,
    )
    if (payload.data?.suc) {
      message.success(payload.data.info || '删除 Provider 成功')
      await loadProviders()
    } else {
      message.error(payload.data?.info || '删除 Provider 失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('deleteProvider error', error)
      message.error('删除 Provider 失败')
    }
  }
}

const handleDeleteModel = async (modelName: string) => {
  if (!activeProvider.value) return

  try {
    await ElMessageBox.confirm(`确定删除模型 ${modelName} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const payload = await postRequest(
      `${prefix}/agent/del_model?provider_name=${encodeURIComponent(activeProvider.value.provider_name)}&model_name=${encodeURIComponent(modelName)}`,
    )
    if (payload.data?.suc) {
      message.success(payload.data.info || '删除模型成功')
      await loadProviders()
    } else {
      message.error(payload.data?.info || '删除模型失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('deleteModel error', error)
      message.error('删除模型失败')
    }
  }
}

const handleTestModel = async (model: LLMModel) => {
  if (!activeProvider.value || testingModelName.value) return

  testingModelName.value = model.name
  try {
    const response = await postRequest(
      `${prefix}/agent/test_model?provider_name=${encodeURIComponent(activeProvider.value.provider_name)}&model_name=${encodeURIComponent(model.name)}`,
    )
    if (response.data?.suc) {
      message.success(response.data.info || 'API 测试成功')
    } else {
      message.error(response.data?.info || 'API 测试失败')
    }
  } catch (error) {
    console.error('testModel error', error)
    message.error('API 测试失败')
  } finally {
    testingModelName.value = ''
  }
}

onMounted(() => {
  loadProviders()
  loadTypeOptions()
})
</script>

<style scoped>
.models-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-header h4 {
  margin: 0 0 4px;
  font-size: 18px;
}

.panel-header p {
  margin: 0;
  color: var(--text-color-secondary);
}

.action-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.panel-body {
  display: grid;
  grid-template-columns: minmax(240px, 280px) 1fr;
  gap: 16px;
}

.provider-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.provider-card {
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-bg-color);
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.provider-card:hover,
.provider-card.active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
}

.provider-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.provider-meta {
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-top: 4px;
  word-break: break-all;
}

.provider-detail {
  min-width: 0;
}

.detail-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 16px;
  background: var(--el-bg-color);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-header h5 {
  margin: 0 0 4px;
  font-size: 16px;
}

.detail-header p {
  margin: 0;
  color: var(--text-color-secondary);
}

.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-info {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--bg-color);
  color: var(--text-color);
}

.detail-info span {
  display: block;
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-bottom: 4px;
}

.api-hint {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.key-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.key-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
  gap: 8px;
  align-items: center;
}

.key-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  color: var(--text-color);
  gap: 10px;
}

.model-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.model-meta {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.pricing-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.pricing-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pricing-hint {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.pricing-grid label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-color-secondary);
}

.pricing-grid :deep(.el-input-number) {
  width: 100%;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--el-text-color-regular);
  border: 1px dashed var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 900px) {
  .panel-body {
    grid-template-columns: 1fr;
  }
}
</style>
