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
        <div v-for="provider in providers" :key="provider.provider_name"
          :class="['provider-card', { active: activeProvider?.provider_name === provider.provider_name }]"
          @click="selectProvider(provider.provider_name)">
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
              <el-button size="small" type="danger" plain @click="handleDeleteProvider">删除 Provider</el-button>
            </div>
          </div>

          <div class="detail-info">
            <div><span>地址</span><strong>{{ activeProvider.url || '未配置' }}</strong></div>
            <div><span>API Key</span><strong>{{ activeProvider.api_key ? '已配置' : '未配置' }}</strong></div>
          </div>

          <div class="model-list">
            <div v-if="activeProvider.models?.length" v-for="model in activeProvider.models" :key="model.name"
              class="model-item">
              <div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <div class="model-name">{{ model.name }}</div>
                  <el-tag size="small" :type="typeColor(model.type)">{{ model.type }}</el-tag>
                </div>
                <div class="model-meta">{{ model.model }} · temp {{ model.temperature }}</div>
              </div>
              <el-button size="small" type="danger" plain @click="handleDeleteModel(model.name)">删除</el-button>
            </div>
            <div v-else class="empty-state">当前 Provider 暂无模型</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">暂无 Provider，请先添加一个。</div>

    <el-dialog v-model="providerDialogVisible" title="添加 Provider" width="560px">
      <el-form :model="providerForm" label-position="top">
        <el-form-item label="Provider 名称">
          <el-input v-model="providerForm.provider_name" placeholder="例如 siliconflow" />
        </el-form-item>
        <el-form-item label="Provider 类型">
          <el-input v-model="providerForm.provider_type" placeholder="例如 openai" />
        </el-form-item>
        <el-form-item label="服务地址">
          <el-input v-model="providerForm.url" placeholder="https://api.example.com/v1" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="providerForm.api_key" type="password" show-password placeholder="请输入密钥" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="providerDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleAddProvider">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="modelDialogVisible" title="添加模型" width="560px">
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
        <el-form-item label="类型">
          <el-input v-model="modelForm.type" placeholder="例如 chat" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="modelDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleAddModel">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { getRequest, postRequest } from '@/utils/api';
import { message } from '@/utils/message';

interface LLMModel {
  name: string;
  model: string;
  temperature: number;
  type: string;
}

interface LLMProvider {
  provider_name: string;
  provider_type: string;
  url: string;
  api_key: string;
  models: LLMModel[];
}

interface ProviderResponse {
  suc: boolean;
  code: number;
  info: string;
  data?: LLMProvider[];
}

const prefix = inject<string>('prefix', '/atri/api');
const loading = ref(false);
const submitting = ref(false);
const providers = ref<LLMProvider[]>([]);
const activeProviderName = ref('');
const providerDialogVisible = ref(false);
const modelDialogVisible = ref(false);

const providerForm = reactive<LLMProvider>({
  provider_name: '',
  provider_type: '',
  url: '',
  api_key: '',
  models: [],
});

const modelForm = reactive<LLMModel>({
  name: '',
  model: '',
  temperature: 0.7,
  type: 'chat',
});

const activeProvider = computed(() => {
  return providers.value.find((provider) => provider.provider_name === activeProviderName.value) || null;
});

const typeColor = (t: string) => {
  if (!t) return 'info';
  const map: Record<string, string> = {
    chat: 'success',
    tool: 'warning',
    image: 'info',
  };
  return map[t] || 'info';
};

const loadProviders = async () => {
  loading.value = true;
  try {
    const resp = await getRequest(`${prefix}/agent/get_providers`);
    const payload = resp.data as ProviderResponse;

    if (payload.suc) {
      providers.value = payload.data || [];
      if (!activeProviderName.value && providers.value.length) {
        activeProviderName.value = providers.value[0]?.provider_name || '';
      } else if (activeProviderName.value) {
        const exists = providers.value.some((provider) => provider.provider_name === activeProviderName.value);
        if (!exists) {
          activeProviderName.value = providers.value[0]?.provider_name || '';
        }
      }
    } else {
      message.error(payload.info || '获取 Provider 列表失败');
    }
  } catch (error) {
    console.error('loadProviders error', error);
    message.error('获取 Provider 列表失败');
  } finally {
    loading.value = false;
  }
};

const selectProvider = (providerName: string) => {
  activeProviderName.value = providerName;
};

const openProviderDialog = () => {
  providerDialogVisible.value = true;
  Object.assign(providerForm, {
    provider_name: '',
    provider_type: '',
    url: '',
    api_key: '',
    models: [],
  });
};

const openModelDialog = () => {
  if (!activeProvider.value) {
    message.warning('请先选择一个 Provider');
    return;
  }
  modelDialogVisible.value = true;
  Object.assign(modelForm, {
    name: '',
    model: '',
    temperature: 0.7,
    type: 'chat',
  });
};

const handleAddProvider = async () => {
  if (!providerForm.provider_name.trim()) {
    message.warning('请输入 Provider 名称');
    return;
  }

  submitting.value = true;
  try {
    const payload = await postRequest(`${prefix}/agent/add_provider`, {
      provider_name: providerForm.provider_name,
      provider_type: providerForm.provider_type,
      url: providerForm.url,
      api_key: providerForm.api_key,
      models: [],
    });

    if (payload.data?.suc) {
      message.success(payload.data.info || '添加 Provider 成功');
      providerDialogVisible.value = false;
      await loadProviders();
    } else {
      message.error(payload.data?.info || '添加 Provider 失败');
    }
  } catch (error) {
    console.error('addProvider error', error);
    message.error('添加 Provider 失败');
  } finally {
    submitting.value = false;
  }
};

const handleAddModel = async () => {
  if (!activeProvider.value) {
    message.warning('请先选择 Provider');
    return;
  }
  if (!modelForm.name.trim() || !modelForm.model.trim()) {
    message.warning('请完整填写模型名称');
    return;
  }

  submitting.value = true;
  try {
    const payload = await postRequest(`${prefix}/agent/add_model?provider_name=${encodeURIComponent(activeProvider.value.provider_name)}`, {
      name: modelForm.name,
      model: modelForm.model,
      temperature: modelForm.temperature,
      type: modelForm.type,
    });

    if (payload.data?.suc) {
      message.success(payload.data.info || '添加模型成功');
      modelDialogVisible.value = false;
      await loadProviders();
    } else {
      message.error(payload.data?.info || '添加模型失败');
    }
  } catch (error) {
    console.error('addModel error', error);
    message.error('添加模型失败');
  } finally {
    submitting.value = false;
  }
};

const handleDeleteProvider = async () => {
  if (!activeProvider.value) return;

  try {
    await ElMessageBox.confirm(`确定删除 Provider ${activeProvider.value.provider_name} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const payload = await postRequest(`${prefix}/agent/del_provider?provider_name=${encodeURIComponent(activeProvider.value.provider_name)}`);
    if (payload.data?.suc) {
      message.success(payload.data.info || '删除 Provider 成功');
      await loadProviders();
    } else {
      message.error(payload.data?.info || '删除 Provider 失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('deleteProvider error', error);
      message.error('删除 Provider 失败');
    }
  }
};

const handleDeleteModel = async (modelName: string) => {
  if (!activeProvider.value) return;

  try {
    await ElMessageBox.confirm(`确定删除模型 ${modelName} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const payload = await postRequest(`${prefix}/agent/del_model?provider_name=${encodeURIComponent(activeProvider.value.provider_name)}&model_name=${encodeURIComponent(modelName)}`);
    if (payload.data?.suc) {
      message.success(payload.data.info || '删除模型成功');
      await loadProviders();
    } else {
      message.error(payload.data?.info || '删除模型失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('deleteModel error', error);
      message.error('删除模型失败');
    }
  }
};

onMounted(() => {
  loadProviders();
});
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
  background: rgba(64, 158, 255, 0.06);
}

.detail-info span {
  display: block;
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-bottom: 4px;
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
