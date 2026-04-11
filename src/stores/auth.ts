import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  const users = ref<User[]>([])
  const currentUserId = ref<string | null>(null)

  const currentUser = computed(() => {
    if (!currentUserId.value) return null
    return users.value.find(u => u.id === currentUserId.value) || null
  })

  const isAuthenticated = computed(() => currentUser.value !== null)

  const currentApiKey = computed(() => currentUser.value?.api_key || null)

  function addUser(user: User) {
    const existingIndex = users.value.findIndex(u => u.id === user.id)
    if (existingIndex >= 0) {
      users.value[existingIndex] = user
    } else {
      users.value.push(user)
    }
    currentUserId.value = user.id
  }

  function switchUser(userId: string) {
    const user = users.value.find(u => u.id === userId)
    if (!user) {
      throw new Error(`User ${userId} not found`)
    }
    currentUserId.value = userId
  }

  function removeUser(userId: string) {
    users.value = users.value.filter(u => u.id !== userId)
    if (currentUserId.value === userId) {
      currentUserId.value = users.value[0]?.id || null
    }
  }

  function logout() {
    if (currentUserId.value) {
      removeUser(currentUserId.value)
    }
  }

  function logoutAll() {
    users.value = []
    currentUserId.value = null
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
  persist: {
    key: 'omem-auth',
  },
})
