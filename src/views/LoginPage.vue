<template>
  <!-- 登录卡片容器 -->
  <div class="min-h-screen bg-linear-to-br from-blue-50 to-white flex items-center justify-center p-3 sm:p-4 md:p-6">
    <!-- 登录卡片容器 -->
    <div class="w-full sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto backdrop-blur-sm transition-all duration-300">
      <!-- 主要登录卡片 -->
      <el-card class="border-0 overflow-hidden transition-all duration-300" :body-style="{ padding: '0px' }"
        shadow="hover">
        <!-- 头部Logo区域 -->
        <div
          class="bg-white/80 px-6 sm:px-8 md:px-10 pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8 flex justify-center items-center">
          <div
            class="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 flex items-center justify-center transition-all duration-300">
            <img src="@/assets/image/logo.png" alt="Logo" class="w-full h-full object-contain">
          </div>
        </div>

        <!-- 表单区域 -->
        <div class="px-6 sm:px-8 md:px-10 pb-6 sm:pb-8 md:pb-10">
          <h2
            class="text-xxl sm:text-xxl md:text-xxl font-bold text-blue-900 text-center mb-4 sm:mb-6 md:mb-8 transition-all duration-300">
            欢迎回来</h2>

          <!-- 用户名输入 -->
          <div class="mb-4 sm:mb-5 md:mb-6">
            <label class="block text-lg sm:text-lg font-medium text-blue-800 mb-1 sm:mb-2">用户名</label>
            <el-input v-model="form.username" placeholder="请输入用户名" size="large" class="custom-input"
              :class="{ 'responsive-input': true }">
              <template #prefix>
                <el-icon>
                  <User />
                </el-icon>
              </template>
            </el-input>
          </div>

          <!-- 密码输入 -->
          <div class="mb-6 sm:mb-7 md:mb-8">
            <label class="block text-lg sm:text-lg font-medium text-blue-800 mb-1 sm:mb-2">密码</label>
            <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" class="custom-input"
              :class="{ 'responsive-input': true }" show-password>
              <template #prefix>
                <el-icon>
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </div>

          <!-- 按钮区域 -->
          <div class="flex flex-col sm:flex-row gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-7 md:mb-8">
            <el-button type="warning" size="large" class="flex-1 text-lg! sm:text-xl! py-4! sm:py-5! px-6! sm:px-8!"
              :class="{ 'responsive-button': true }" @click="handleConfig" :loading="loading">
              连接配置
            </el-button>
            <el-button type="primary" size="large" class="flex-1 text-lg! sm:text-xl! py-4! sm:py-5! px-6! sm:px-8!"
              :class="{ 'responsive-button': true }" @click="handleLogin" :loading="loading">
              登录
            </el-button>
          </div>

          <!-- 忘记密码链接 -->
          <div class="text-center">
            <el-link type="primary" underline="never" class="text-base! sm:text-lg!" @click="handleForgotPassword">
              忘记密码？
            </el-link>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import qs from 'qs';
import { ref, inject } from 'vue';
import { useRouter, useRoute } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue';
import { message } from '@/utils/message';
import { getCookie, clearCookie, setCookie, postRequest } from '@/utils/api';

const prefix = inject<string>('prefix');
const router = useRouter();
const route = useRoute();

// 表单数据
const form = ref({
  username: '',
  password: ''
});

const loading = ref(false);

// 连接配置
const handleConfig = () => {
  router.push('/myapi');
}

// 登录
const handleLogin = async () => {
  try {
    if (!form.value.username || !form.value.password) {
      message.error('请输入用户名和密码')
      return
    }
    message.info('正在登录，请稍候...');
    loading.value = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await postRequest(
      `${prefix}/login`,
      qs.stringify({
        username: form.value.username,
        password: form.value.password
      }),
    );
    if (response.data.suc) {
      if (response.data.warning) {
        message.warning(response.warning);
      } else {
        window.sessionStorage.setItem("isAuthenticated", "true");
        message.success({
          message: response.data.info,
          duration: 1500,
          showClose: true,
        });
        const tokenStr = response.data.data.token_type + " " + response.data.data.access_token;
        if (getCookie("tokenStr")) {
          clearCookie("tokenStr");
        }
        setCookie("tokenStr", tokenStr);
        const redirect = route.query.redirect as string;
        router.replace(redirect && redirect !== '/' ? redirect : '/home');
      }
    } else {
      message.error({
        message: "登录失败：" + response.data.info,
        duration: 2000,
        showClose: true,
      })
      console.error("登录失败:", response);
    }
  } catch (error) {
    console.error("登录错误:", error)
    message.error("登录过程中发生错误")
  } finally {
    loading.value = false
  }
}

// 忘记密码
const handleForgotPassword = () => {
  message.warning('请联系管理员后台查看密码~');
}
</script>

<style scoped>
/* 自定义Element Plus组件样式 */
:deep(.el-card) {
  --el-card-border-color: rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
}

:deep(.el-card__body) {
  padding: 0;
}

/* 输入框自定义样式 */
.custom-input :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(59, 130, 246, 0.24);
  box-shadow: none;
  padding: 6px 14px;
  transition: all 0.2s;
}

.custom-input :deep(.el-input__wrapper:hover) {
  border-color: #c99e6b;
  box-shadow: 0 0 0 1px #c99e6b;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  border-color: #c99e6b;
  box-shadow: 0 0 0 2px rgba(201, 158, 107, 0.22);
}

.custom-input :deep(.el-input__inner) {
  font-size: 18px;
  height: 54px;
  color: #1e3a8a;
}

.custom-input :deep(.el-input__inner::placeholder) {
  color: #7b93bd;
}

.custom-input :deep(.el-input__prefix) {
  color: #c99e6b;
  font-size: 20px;
  margin-right: 10px;
}

/* 响应式输入框 */
@media (min-width: 640px) {
  .responsive-input :deep(.el-input__inner) {
    font-size: 20px;
    height: 60px;
  }
}

@media (min-width: 1024px) {
  .responsive-input :deep(.el-input__inner) {
    font-size: 22px;
    height: 66px;
  }
}

/* 按钮自定义样式 - 适配更大尺寸 */
.responsive-button :deep(.el-button) {
  border: none;
  transition: all 0.2s ease;
  font-weight: 700;
  letter-spacing: 0.35px;
  min-height: 60px;
  padding: 0 28px;
}

.responsive-button :deep(.el-button--primary) {
  background: linear-gradient(135deg, #2563eb, #1e40af);
}

.responsive-button :deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
}

.responsive-button :deep(.el-button--warning) {
  background: #c99e6b;
  --el-button-text-color: white;
}

.responsive-button :deep(.el-button--warning:hover) {
  background: #b88b56;
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(201, 158, 107, 0.28);
}

/* 响应式按钮尺寸增强 */
@media (min-width: 640px) {
  .responsive-button :deep(.el-button) {
    min-height: 70px;
    font-size: 20px;
  }
}

@media (min-width: 1024px) {
  .responsive-button :deep(.el-button) {
    min-height: 78px;
    font-size: 22px;
  }
}

/* 标题、标签、链接样式 */
h2 {
  font-size: 2.35rem;
  line-height: 1.1;
}

label {
  color: #1e3a8a;
  font-size: 1.05rem;
  font-weight: 600;
  transition: all 0.2s;
}

:deep(.el-link) {
  font-size: 1rem;
  color: #2563eb;
  transition: all 0.2s;
}

:deep(.el-link:hover) {
  color: #c99e6b;
}

@media (min-width: 640px) {
  h2 {
    font-size: 2.5rem;
  }

  :deep(.el-link) {
    font-size: 1.1rem;
  }
}

@media (min-width: 1024px) {
  h2 {
    font-size: 2.8rem;
  }
}
</style>
