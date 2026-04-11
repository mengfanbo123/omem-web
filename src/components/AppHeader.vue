<template>
  <a-layout-header class="app-header">
    <div class="header-left">
      <slot name="sider-toggle">
        <MenuUnfoldOutlined
          v-if="sidebarCollapsed"
          class="trigger"
          @click="$emit('toggle-sidebar')"
        />
        <MenuFoldOutlined v-else class="trigger" @click="$emit('toggle-sidebar')" />
      </slot>
    </div>

    <div class="header-center">
      <a-input-search
        v-model:value="searchValue"
        placeholder="搜索记忆..."
        class="global-search"
        @search="handleSearch"
      >
        <template #prefix>
          <SearchOutlined class="search-icon" />
        </template>
      </a-input-search>
    </div>

    <div class="header-right">
      <UserSwitcher />

      <a-divider type="vertical" class="header-divider" />

      <a-button type="text" danger class="logout-btn" @click="handleLogout">
        <template #icon>
          <LogoutOutlined />
        </template>
        <span>退出</span>
      </a-button>
    </div>
  </a-layout-header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UserSwitcher from './UserSwitcher.vue'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

defineProps<{
  sidebarCollapsed: boolean
}>()

defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const router = useRouter()
const authStore = useAuthStore()

const searchValue = ref('')

function handleSearch(value: string) {
  if (value.trim()) {
    router.push({ path: '/memories/search', query: { q: value } })
  }
}

function handleLogout() {
  authStore.logout()
  message.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  border-bottom: 1px solid #f0f0f0;
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 99;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.header-left {
  display: flex;
  align-items: center;
}

.trigger {
  font-size: 18px;
  color: rgba(0, 0, 0, 0.65);
  cursor: pointer;
  transition: color 0.2s;
}

.trigger:hover {
  color: #1890ff;
}

.header-center {
  flex: 1;
  max-width: 480px;
  margin: 0 24px;
}

.global-search {
  width: 100%;
}

.global-search :deep(.ant-input-affix-wrapper) {
  border-radius: 6px;
  background-color: #f5f5f5;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.global-search :deep(.ant-input-affix-wrapper:hover),
.global-search :deep(.ant-input-affix-wrapper:focus),
.global-search :deep(.ant-input-affix-wrapper-focused) {
  background-color: #fff;
  border-color: #1890ff;
}

.search-icon {
  color: rgba(0, 0, 0, 0.25);
}

.header-right {
  display: flex;
  align-items: center;
}

.header-divider {
  margin: 0 12px;
  height: 24px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.logout-btn:hover {
  color: #ff4d4f;
}
</style>
