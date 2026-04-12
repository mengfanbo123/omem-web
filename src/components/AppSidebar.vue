<template>
  <a-layout-sider
    :collapsed="collapsed"
    :trigger="null"
    collapsible
    :width="220"
    :collapsed-width="64"
    class="app-sidebar"
    @update:collapsed="toggleSidebar"
  >
    <div class="sidebar-header">
      <div class="logo" :class="{ collapsed }">
        <span class="logo-icon">🧠</span>
        <span v-if="!collapsed" class="logo-text">omem</span>
      </div>
    </div>

    <a-menu
      v-model:selectedKeys="selectedKeys"
      mode="inline"
      theme="light"
      class="sidebar-menu"
    >
      <a-menu-item key="dashboard" @click="navigateTo('/dashboard')">
        <template #icon>
          <DashboardOutlined />
        </template>
        <span>仪表盘</span>
      </a-menu-item>

      <a-menu-item key="memories" @click="navigateTo('/memories')">
        <template #icon>
          <DatabaseOutlined />
        </template>
        <span>记忆列表</span>
      </a-menu-item>

      <a-menu-item key="search" @click="navigateTo('/search')">
        <template #icon>
          <SearchOutlined />
        </template>
        <span>记忆搜索</span>
      </a-menu-item>

      <a-menu-item key="spaces" @click="navigateTo('/spaces')">
        <template #icon>
          <HomeOutlined />
        </template>
        <span>空间管理</span>
      </a-menu-item>

      <a-menu-divider />

      <a-menu-item key="graph" @click="navigateTo('/graph')">
        <template #icon>
          <ApartmentOutlined />
        </template>
        <span>关系图谱</span>
      </a-menu-item>

      <a-menu-item key="statistics" @click="navigateTo('/statistics')">
        <template #icon>
          <BarChartOutlined />
        </template>
        <span>统计分析</span>
      </a-menu-item>

      <a-menu-item key="decay" @click="navigateTo('/decay')">
        <template #icon>
          <LineChartOutlined />
        </template>
        <span>衰减曲线</span>
      </a-menu-item>

      <a-menu-item key="import" @click="navigateTo('/import')">
        <template #icon>
          <UploadOutlined />
        </template>
        <span>批量导入</span>
      </a-menu-item>

      <a-menu-item key="import-history" @click="navigateTo('/import/history')">
        <template #icon>
          <HistoryOutlined />
        </template>
        <span>导入历史</span>
      </a-menu-item>

      <a-menu-divider />

      <a-menu-item key="settings" @click="navigateTo('/settings')">
        <template #icon>
          <SettingOutlined />
        </template>
        <span>系统设置</span>
      </a-menu-item>
    </a-menu>

    <div class="sidebar-footer" @click="toggleSidebar">
      <MenuUnfoldOutlined v-if="collapsed" />
      <MenuFoldOutlined v-else />
      <span v-if="!collapsed">收起</span>
    </div>
  </a-layout-sider>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  DashboardOutlined,
  DatabaseOutlined,
  HomeOutlined,
  BarChartOutlined,
  LineChartOutlined,
  UploadOutlined,
  HistoryOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
  ApartmentOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
}>()

const router = useRouter()
const route = useRoute()

const selectedKeys = ref<string[]>(['dashboard'])

watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/dashboard')) {
      selectedKeys.value = ['dashboard']
    } else if (path.startsWith('/memories')) {
      selectedKeys.value = ['memories']
    } else if (path.startsWith('/search')) {
      selectedKeys.value = ['search']
    } else if (path.startsWith('/spaces')) {
      selectedKeys.value = ['spaces']
    } else if (path.startsWith('/statistics')) {
      selectedKeys.value = ['statistics']
    } else if (path.startsWith('/graph')) {
      selectedKeys.value = ['graph']
    } else if (path.startsWith('/decay')) {
      selectedKeys.value = ['decay']
    } else if (path.startsWith('/import/history')) {
      selectedKeys.value = ['import-history']
    } else if (path.startsWith('/import')) {
      selectedKeys.value = ['import']
    } else if (path.startsWith('/settings')) {
      selectedKeys.value = ['settings']
    }
  },
  { immediate: true }
)

function navigateTo(path: string) {
  router.push(path)
}

function toggleSidebar() {
  emit('update:collapsed', !props.collapsed)
}
</script>

<style scoped>
.app-sidebar {
  background: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}

.logo.collapsed {
  justify-content: center;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}

.sidebar-menu {
  flex: 1;
  border-inline-end: none !important;
  padding: 8px 0;
}

.sidebar-footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border-top: 1px solid #f0f0f0;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  transition: all 0.2s;
}

.sidebar-footer:hover {
  color: rgba(0, 0, 0, 0.85);
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
