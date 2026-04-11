<template>
  <div class="login-container">
    <div class="login-card">
      <div class="card-header">
        <h1 class="app-title">omem</h1>
        <p class="app-subtitle">Connect to your memory server</p>
      </div>

      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
        @finish="handleLogin"
      >
        <a-form-item label="API URL" name="apiUrl">
          <a-input
            v-model:value="formState.apiUrl"
            placeholder="https://api.example.com"
            size="large"
          >
            <template #prefix>
              <LinkOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="API Key" name="apiKey">
          <a-input-password
            v-model:value="formState.apiKey"
            placeholder="Enter your API key"
            size="large"
          >
            <template #prefix>
              <KeyOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item label="Username (optional)" name="username">
          <a-input
            v-model:value="formState.username"
            placeholder="Display name for this connection"
            size="large"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            block
            :loading="loading"
          >
            {{ loading ? 'Connecting...' : 'Connect' }}
          </a-button>
        </a-form-item>
      </a-form>

      <div v-if="errorMessage" class="error-message">
        <AlertOutlined />
        <span>{{ errorMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { LinkOutlined, KeyOutlined, UserOutlined, AlertOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types/user'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const errorMessage = ref('')

const formState = reactive({
  apiUrl: '',
  apiKey: '',
  username: '',
})

const validateApiUrl = async (_rule: Rule, value: string): Promise<void> => {
  if (!value) {
    throw new Error('API URL is required')
  }
  try {
    new URL(value)
  } catch {
    throw new Error('Please enter a valid URL')
  }
}

const rules: Record<string, Rule[]> = {
  apiUrl: [{ required: true, validator: validateApiUrl, trigger: 'change' }],
  apiKey: [{ required: true, message: 'API Key is required', trigger: 'change' }],
}

const handleLogin = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    // Validate connection by calling health endpoint
    const healthUrl = `${formState.apiUrl.replace(/\/$/, '')}/health`
    await axios.get(healthUrl, {
      headers: {
        'X-API-Key': formState.apiKey,
      },
      timeout: 10000,
    })

    // Create user object
    const user: User = {
      id: `${Date.now()}`,
      name: formState.username || new URL(formState.apiUrl).hostname,
      api_key: formState.apiKey,
      api_url: formState.apiUrl.replace(/\/$/, ''),
      last_used: new Date().toISOString(),
    }

    // Add user to auth store
    authStore.addUser(user)

    // Redirect to intended page or home
    const redirect = route.query.redirect as string
    router.push(redirect || '/memories')
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED') {
        errorMessage.value = 'Connection timeout. Please check your API URL.'
      } else if (err.response?.status === 401) {
        errorMessage.value = 'Invalid API key'
      } else if (err.response?.status === 404) {
        errorMessage.value = 'API endpoint not found. Please check your API URL.'
      } else {
        errorMessage.value = err.response?.data?.error?.message || 'Failed to connect to server'
      }
    } else if (err instanceof Error) {
      errorMessage.value = err.message || 'Failed to connect'
    } else {
      errorMessage.value = 'Failed to connect to server'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 40px;
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.app-title {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  color: #ff4d4f;
  font-size: 14px;
  margin-top: 16px;
}
</style>
