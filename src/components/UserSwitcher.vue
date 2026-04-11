<template>
  <a-dropdown :trigger="['click']" placement="bottomRight">
    <div class="user-switcher">
      <a-avatar :size="32" class="user-avatar">
        {{ currentUserName?.[0]?.toUpperCase() || 'U' }}
      </a-avatar>
      <span class="user-name">{{ currentUserName || '未选择用户' }}</span>
      <DownOutlined class="dropdown-icon" />
    </div>
    <template #overlay>
      <a-menu class="user-menu">
        <a-menu-item-group title="切换用户">
          <a-menu-item
            v-for="user in users"
            :key="user.id"
            :class="{ 'active-user': user.id === currentUserId }"
            @click="handleSwitchUser(user.id)"
          >
            <div class="user-item">
              <a-avatar :size="24" class="user-item-avatar">
                {{ user.name?.[0]?.toUpperCase() || 'U' }}
              </a-avatar>
              <span class="user-item-name">{{ user.name }}</span>
              <CheckOutlined v-if="user.id === currentUserId" class="check-icon" />
            </div>
          </a-menu-item>
        </a-menu-item-group>
        <a-menu-divider />
        <a-menu-item key="add" @click="handleAddUser">
          <PlusOutlined />
          <span>添加新用户</span>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  DownOutlined,
  CheckOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const router = useRouter()
const authStore = useAuthStore()

const users = computed(() => authStore.users)
const currentUserId = computed(() => authStore.currentUserId)
const currentUserName = computed(() => authStore.currentUser?.name)

function handleSwitchUser(userId: string) {
  if (userId === currentUserId.value) return
  authStore.switchUser(userId)
  message.success('用户切换成功')
}

function handleAddUser() {
  router.push('/login')
}
</script>

<style scoped>
.user-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-switcher:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.user-avatar {
  background-color: #1890ff;
  font-size: 14px;
}

.user-name {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.45);
}

.user-menu {
  min-width: 200px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.user-item-avatar {
  background-color: #52c41a;
  font-size: 12px;
}

.user-item-name {
  flex: 1;
}

.check-icon {
  color: #52c41a;
}

.active-user {
  background-color: rgba(82, 196, 26, 0.1);
}
</style>
