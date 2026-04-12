<template>
  <div class="settings-view">
    <a-row :gutter="[16, 16]">
      <!-- API 配置 -->
      <a-col :span="24">
        <a-card title="API 配置" class="settings-card">
          <a-form :model="apiForm" layout="vertical" class="settings-form">
            <a-form-item label="API 地址" name="url" :rules="[{ required: true, message: '请输入 API 地址' }, { type: 'url', message: '请输入有效的 URL' }]">
              <a-input v-model:value="apiForm.url" placeholder="https://api.example.com" />
            </a-form-item>
            <a-form-item label="API Key" name="key" :rules="[{ required: true, message: '请输入 API Key' }]">
              <a-input-password v-model:value="apiForm.key" placeholder="sk-..." />
            </a-form-item>
            <a-form-item>
              <a-space>
                <a-button type="primary" @click="handleSaveApi" :loading="saving">保存</a-button>
                <a-button @click="handleTestConnection" :loading="testing">测试连接</a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <!-- 用户偏好 -->
      <a-col :span="24">
        <a-card title="用户偏好" class="settings-card">
          <a-form :model="preferencesForm" layout="vertical" class="settings-form">
            <a-row :gutter="16">
              <a-col :xs="24" :sm="12" :md="8">
                <a-form-item label="语言">
                  <a-select v-model:value="preferencesForm.language">
                    <a-select-option value="zh-CN">中文</a-select-option>
                    <a-select-option value="en-US">English</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8">
                <a-form-item label="主题模式">
                  <a-radio-group v-model:value="preferencesForm.theme">
                    <a-radio-button value="light">亮色</a-radio-button>
                    <a-radio-button value="dark">暗色</a-radio-button>
                    <a-radio-button value="auto">跟随系统</a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8">
                <a-form-item label="每页显示数量">
                  <a-select v-model:value="preferencesForm.pageSize">
                    <a-select-option :value="10">10</a-select-option>
                    <a-select-option :value="20">20</a-select-option>
                    <a-select-option :value="50">50</a-select-option>
                    <a-select-option :value="100">100</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :xs="24" :sm="12" :md="8">
                <a-form-item label="日期格式">
                  <a-select v-model:value="preferencesForm.dateFormat">
                    <a-select-option value="YYYY-MM-DD">YYYY-MM-DD</a-select-option>
                    <a-select-option value="MM/DD/YYYY">MM/DD/YYYY</a-select-option>
                    <a-select-option value="DD/MM/YYYY">DD/MM/YYYY</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8">
                <a-form-item label="时区">
                  <a-select v-model:value="preferencesForm.timezone">
                    <a-select-option value="UTC+8">UTC+8 (北京时间)</a-select-option>
                    <a-select-option value="UTC+0">UTC+0 (伦敦时间)</a-select-option>
                    <a-select-option value="UTC-5">UTC-5 (东部时间)</a-select-option>
                    <a-select-option value="UTC-8">UTC-8 (太平洋时间)</a-select-option>
                    <a-select-option value="Asia/Shanghai">Asia/Shanghai</a-select-option>
                    <a-select-option value="America/New_York">America/New_York</a-select-option>
                    <a-select-option value="Europe/London">Europe/London</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item>
              <a-button type="primary" @click="handleSavePreferences" :loading="savingPrefs">保存偏好</a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <!-- 通知设置 -->
      <a-col :span="24">
        <a-card title="通知设置" class="settings-card">
          <a-form layout="vertical" class="settings-form">
            <a-form-item label="桌面通知">
              <a-switch v-model:checked="notificationsForm.desktop" />
            </a-form-item>
            <a-form-item label="邮件通知">
              <a-switch v-model:checked="notificationsForm.email" />
            </a-form-item>
            <a-form-item label="通知声音">
              <a-switch v-model:checked="notificationsForm.sound" />
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <!-- 数据管理 -->
      <a-col :span="24">
        <a-card title="数据管理" class="settings-card">
          <a-space direction="vertical" :size="12">
            <a-button @click="handleExportData">导出所有数据</a-button>
            <a-button @click="handleClearCache">清除缓存</a-button>
            <a-popconfirm title="确定要重置所有设置吗？此操作不可恢复。" @confirm="handleResetSettings" ok-text="确定" cancel-text="取消">
              <a-button danger>重置设置</a-button>
            </a-popconfirm>
          </a-space>
        </a-card>
      </a-col>

      <!-- 关于 -->
      <a-col :span="24">
        <a-card title="关于" class="settings-card">
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="应用名称">omem-web</a-descriptions-item>
            <a-descriptions-item label="版本号">{{ appVersion }}</a-descriptions-item>
            <a-descriptions-item label="后端版本">
              <a-spin v-if="loadingBackendVersion" size="small" />
              <span v-else>{{ backendVersion || '未知' }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="开源协议">MIT</a-descriptions-item>
            <a-descriptions-item label="GitHub">
              <a href="https://github.com/yourusername/omem-web" target="_blank">
                https://github.com/yourusername/omem-web
              </a>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useSettingsStore } from '@/stores/settings'
import { getVersion } from '@/api/client'
import { updateBaseURL } from '@/api/client'

const settingsStore = useSettingsStore()

const appVersion = ref(import.meta.env.VITE_APP_VERSION || '0.1.0')
const backendVersion = ref('')
const loadingBackendVersion = ref(false)
const testing = ref(false)
const saving = ref(false)
const savingPrefs = ref(false)

const apiForm = reactive({
  url: settingsStore.apiConfig.url,
  key: settingsStore.apiConfig.key
})

const preferencesForm = reactive({
  language: settingsStore.preferences.language,
  theme: settingsStore.preferences.theme,
  pageSize: settingsStore.preferences.pageSize,
  dateFormat: settingsStore.preferences.dateFormat,
  timezone: settingsStore.preferences.timezone
})

const notificationsForm = reactive({
  desktop: settingsStore.preferences.notifications.desktop,
  email: settingsStore.preferences.notifications.email,
  sound: settingsStore.preferences.notifications.sound
})

async function handleTestConnection() {
  if (!apiForm.url) {
    message.warning('请先输入 API 地址')
    return
  }
  testing.value = true
  try {
    updateBaseURL(apiForm.url)
    const version = await getVersion()
    backendVersion.value = version.version
    message.success('连接成功！')
  } catch (error: any) {
    message.error(error?.error?.message || '连接失败')
  } finally {
    testing.value = false
  }
}

function handleSaveApi() {
  if (!apiForm.url || !apiForm.key) {
    message.warning('请填写完整的 API 配置')
    return
  }
  settingsStore.updateApiConfig({ url: apiForm.url, key: apiForm.key })
  updateBaseURL(apiForm.url)
  message.success('API 配置已保存')
}

function handleSavePreferences() {
  settingsStore.updatePreferences({
    language: preferencesForm.language,
    theme: preferencesForm.theme,
    pageSize: preferencesForm.pageSize,
    dateFormat: preferencesForm.dateFormat,
    timezone: preferencesForm.timezone,
    notifications: {
      desktop: notificationsForm.desktop,
      email: notificationsForm.email,
      sound: notificationsForm.sound
    }
  })
  message.success('偏好设置已保存')
}

function handleExportData() {
  const data = {
    preferences: settingsStore.preferences,
    apiConfig: {
      url: settingsStore.apiConfig.url,
      key: settingsStore.apiConfig.key ? '***' : ''
    },
    exportedAt: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `omem-settings-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('数据导出成功')
}

function handleClearCache() {
  localStorage.clear()
  message.success('缓存已清除，请刷新页面')
}

function handleResetSettings() {
  settingsStore.resetPreferences()
  settingsStore.resetApiConfig()
  Object.assign(apiForm, { url: settingsStore.apiConfig.url, key: '' })
  Object.assign(preferencesForm, settingsStore.preferences)
  Object.assign(notificationsForm, settingsStore.preferences.notifications)
  message.success('设置已重置为默认值')
}

onMounted(async () => {
  if (settingsStore.apiConfig.url) {
    loadingBackendVersion.value = true
    try {
      updateBaseURL(settingsStore.apiConfig.url)
      const version = await getVersion()
      backendVersion.value = version.version
    } catch {
      // 静默失败
    } finally {
      loadingBackendVersion.value = false
    }
  }
})
</script>

<style scoped>
.settings-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-card {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.settings-card :deep(.ant-card-head) {
  min-height: 48px;
  padding: 0 16px;
}

.settings-card :deep(.ant-card-body) {
  padding: 24px;
}

.settings-form {
  max-width: 800px;
}

.settings-form :deep(.ant-form-item) {
  margin-bottom: 20px;
}

.settings-form :deep(.ant-form-item-label > label) {
  font-weight: 500;
}
</style>
