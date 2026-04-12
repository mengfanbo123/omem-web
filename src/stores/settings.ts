import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserPreferences {
  language: 'zh-CN' | 'en-US'
  theme: 'light' | 'dark' | 'auto'
  pageSize: number
  dateFormat: string
  timezone: string
  notifications: {
    desktop: boolean
    email: boolean
    sound: boolean
  }
}

export interface ApiConfig {
  url: string
  key: string
}

const defaultPreferences: UserPreferences = {
  language: 'zh-CN',
  theme: 'light',
  pageSize: 20,
  dateFormat: 'YYYY-MM-DD',
  timezone: 'UTC+8',
  notifications: {
    desktop: false,
    email: false,
    sound: false
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const preferences = ref<UserPreferences>({ ...defaultPreferences })
  const apiConfig = ref<ApiConfig>({
    url: import.meta.env.VITE_API_BASE_URL || '',
    key: ''
  })

  function updatePreferences(prefs: Partial<UserPreferences>) {
    preferences.value = { ...preferences.value, ...prefs }
  }

  function updateNotifications(notifs: Partial<UserPreferences['notifications']>) {
    preferences.value.notifications = { ...preferences.value.notifications, ...notifs }
  }

  function resetPreferences() {
    preferences.value = { ...defaultPreferences }
  }

  function updateApiConfig(config: Partial<ApiConfig>) {
    apiConfig.value = { ...apiConfig.value, ...config }
  }

  function resetApiConfig() {
    apiConfig.value = {
      url: import.meta.env.VITE_API_BASE_URL || '',
      key: ''
    }
  }

  return {
    preferences,
    apiConfig,
    updatePreferences,
    updateNotifications,
    resetPreferences,
    updateApiConfig,
    resetApiConfig
  }
}, {
  persist: {
    key: 'omem-settings',
  },
})
