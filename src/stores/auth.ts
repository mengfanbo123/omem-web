import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  // State
  const users = ref<User[]>([])
  const currentUserId = ref<string | null>(null)

  // Getters
  const currentUser = computed(() => {
    if (!currentUserId.value) return null
    return users.value.find(u => u.id === currentUserId.value) || null
  })

  const isAuthenticated = computed(() => currentUser.value !== null)

  const currentApiKey = computed(() => currentUser.value?.api_key || null)

  // Actions
  function addUser(user: User) {
    const existingIndex = users.value.findIndex(u => u.id === user.id)
    if (existingIndex >= 0) {
      users.value[existingIndex] = user
    } else {
      users.value.push(user)
    }
    currentUserId.value = user.id
    localStorage.setItem('current_api_key', user.api_key)
  }

  function switchUser(userId: string) {
    const user = users.value.find(u => u.id === userId)
    if (user) {
      currentUserId.value = userId
      localStorage.setItem('current_api_key', user.api_key)
    }
  }

  function removeUser(userId: string) {
    users.value = users.value.filter(u => u.id !== userId)
    if (currentUserId.value === userId) {
      currentUserId.value = users.value[0]?.id || null
      if (currentUserId.value) {
        localStorage.setItem('current_api_key', users.value[0].api_key)
      } else {
        localStorage.removeItem('current_api_key')
      }
    }
  }

  function logout() {
    currentUserId.value = null
    localStorage.removeItem('current_api_key')
  }

  function logoutAll() {
    users.value = []
    currentUserId.value = null
    localStorage.removeItem('current_api_key')
  }

  return {
    users,
    currentUserId,
    currentUser,
    isAuthenticated,
    currentApiKey,
    addUser,
    switchUser,
    removeUser,
    logout,
    logoutAll,
  }
}, {
  persist: true,
})
