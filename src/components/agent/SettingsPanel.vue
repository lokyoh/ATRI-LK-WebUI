<template>
  <div class="settings-panel">
    <div class="settings-header">
      <div>
        <h4>AI 插件设置</h4>
        <p>配置 Agent 插件的基础行为、搜索能力与语音合成能力。</p>
      </div>
      <div class="action-bar">
        <el-button @click="loadSettings" :loading="loading">刷新</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave">保存设置</el-button>
      </div>
    </div>

    <el-form :model="form" label-position="top" class="settings-form">
      <div class="section-card">
        <div class="section-title">基础配置</div>
        <el-form-item label="最大历史消息数">
          <el-input-number v-model="form.max_history" :min="1" :max="200" />
        </el-form-item>
      </div>

      <div class="section-card">
        <div class="section-title">搜索配置</div>
        <el-form-item label="启用搜索">
          <el-switch v-model="form.search.enable" />
        </el-form-item>
        <el-form-item label="搜索 Provider">
          <el-input v-model="form.search.provider" placeholder="例如 tavily" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="form.search.api_key" type="password" show-password placeholder="请输入搜索接口密钥" />
        </el-form-item>
      </div>

      <div class="section-card">
        <div class="section-title">TTS 配置</div>
        <el-form-item label="启用 TTS">
          <el-switch v-model="form.tts.enable" />
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input v-model="form.tts.model" placeholder="例如 gpt-tts" />
        </el-form-item>
        <el-form-item label="服务地址">
          <el-input v-model="form.tts.url" placeholder="http://localhost:8000" />
        </el-form-item>
        <el-form-item label="Voice ID">
          <el-input v-model="form.tts.voice_id" placeholder="请输入 voice id" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="form.tts.api_key" type="password" show-password placeholder="请输入 TTS 接口密钥" />
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue';
import { getRequest, postRequest } from '@/utils/api';
import { message } from '@/utils/message';

interface SearchConfig {
  enable: boolean;
  provider: string;
  api_key: string;
}

interface TTSConfig {
  enable: boolean;
  model: string;
  url: string;
  voice_id: string;
  api_key: string;
}

interface AgentSettings {
  max_history: number;
  search: SearchConfig;
  tts: TTSConfig;
}

interface SettingsResponse {
  suc: boolean;
  code: number;
  info: string;
  warning?: string;
  data?: AgentSettings;
}

const prefix = inject<string>('prefix', '/atri/api');
const loading = ref(false);
const submitting = ref(false);

const defaultForm: AgentSettings = {
  max_history: 20,
  search: {
    enable: false,
    provider: 'tavily',
    api_key: '',
  },
  tts: {
    enable: false,
    model: '',
    url: '',
    voice_id: '',
    api_key: '',
  },
};

const form = reactive<AgentSettings>({
  max_history: defaultForm.max_history,
  search: { ...defaultForm.search },
  tts: { ...defaultForm.tts },
});

const loadSettings = async () => {
  loading.value = true;
  try {
    const resp = await getRequest(`${prefix}/agent/get_settings`);
    const payload = resp.data as SettingsResponse;

    if (payload.suc) {
      const data = payload.data || defaultForm;
      form.max_history = typeof data.max_history === 'number' ? data.max_history : defaultForm.max_history;
      form.search = {
        enable: Boolean(data.search?.enable),
        provider: data.search?.provider || defaultForm.search.provider,
        api_key: data.search?.api_key || defaultForm.search.api_key,
      };
      form.tts = {
        enable: Boolean(data.tts?.enable),
        model: data.tts?.model || defaultForm.tts.model,
        url: data.tts?.url || defaultForm.tts.url,
        voice_id: data.tts?.voice_id || defaultForm.tts.voice_id,
        api_key: data.tts?.api_key || defaultForm.tts.api_key,
      };
    } else {
      message.error(payload.info || '获取配置失败');
    }
  } catch (error) {
    console.error('loadSettings error', error);
    message.error('获取配置失败，请检查接口状态');
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  submitting.value = true;
  try {
    const resp = await postRequest(`${prefix}/agent/set_settings`, form);
    const payload = resp.data as SettingsResponse;

    if (payload.suc) {
      message.success(payload.info || '设置成功');
    } else {
      message.error(payload.info || '设置失败');
    }
  } catch (error) {
    console.error('saveSettings error', error);
    message.error('保存失败，请稍后重试');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.settings-header h4 {
  margin: 0 0 4px;
  font-size: 18px;
}

.settings-header p {
  margin: 0;
  color: var(--text-color-secondary);
}

.action-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card {
  background: var(--bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 18px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-color);
}
</style>
