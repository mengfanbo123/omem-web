<template>
  <div class="login-container">
    <a-card title="登录 omem" :bordered="false" style="width: 400px">
      <a-form
        :model="formState"
        :rules="rules"
        @finish="handleLogin"
        layout="vertical"
      >
        <a-form-item label="API Key" name="apiKey">
          <a-input-password
            v-model:value="formState.apiKey"
            placeholder="请输入 API Key"
            size="large"
          />
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
            block
            size="large"
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import { profileApi } from '@/api/profile'
import { updateBaseURL } from '@/api/client'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)

const formState = reactive({
  apiKey: ''
})

const rules = {
  apiKey: [{ required: true, message: '请输入 API Key', trigger: 'blur' }]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://www.mengxy.cc'

const handleLogin = async () => {
  loading.value = true
  try {
    const healthUrl = `${API_BASE_URL}/health`
    await axios.get(healthUrl, {
      headers: { 'X-API-Key': formState.apiKey }
    })

    updateBaseURL(API_BASE_URL)

    const profile = await profileApi.get()

    authStore.addUser({
      id: formState.apiKey.substring(0, 8),
      name: profile.name || 'Unknown User',
      api_key: formState.apiKey,
      api_url: API_BASE_URL,
      last_used: new Date().toISOString()
    })

    message.success('登录成功')
    router.push('/memories')
  } catch (error: any) {
    console.error('Login failed:', error)
    message.error(error?.error?.message || '登录失败，请检查 API Key')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
