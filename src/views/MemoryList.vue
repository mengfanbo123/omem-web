<template>
  <div class="memory-list-container">
    <div class="header">
      <h1 class="page-title">记忆库</h1>
      <p class="page-subtitle">管理和浏览你的记忆</p>
    </div>

    <div class="filters-section">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-select
            v-model:value="filters.category"
            placeholder="分类"
            allow-clear
            style="width: 100%"
            @change="handleFilterChange"
          >
            <a-select-option value="profile">Profile</a-select-option>
            <a-select-option value="preferences">Preferences</a-select-option>
            <a-select-option value="entities">Entities</a-select-option>
            <a-select-option value="events">Events</a-select-option>
            <a-select-option value="cases">Cases</a-select-option>
            <a-select-option value="patterns">Patterns</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="filters.tier"
            placeholder="层级"
            allow-clear
            style="width: 100%"
            @change="handleFilterChange"
          >
            <a-select-option value="core">Core</a-select-option>
            <a-select-option value="working">Working</a-select-option>
            <a-select-option value="peripheral">Peripheral</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="filters.memory_type"
            placeholder="类型"
            allow-clear
            style="width: 100%"
            @change="handleFilterChange"
          >
            <a-select-option value="pinned">Pinned</a-select-option>
            <a-select-option value="insight">Insight</a-select-option>
            <a-select-option value="session">Session</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="filters.state"
            placeholder="状态"
            allow-clear
            style="width: 100%"
            @change="handleFilterChange"
          >
            <a-select-option value="active">Active</a-select-option>
            <a-select-option value="archived">Archived</a-select-option>
            <a-select-option value="deleted">Deleted</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-input
            v-model:value="filters.tags"
            placeholder="标签 (逗号分隔)"
            allow-clear
            @pressEnter="handleFilterChange"
          />
        </a-col>
      </a-row>
    </div>

    <div v-if="loading" class="loading-state">
      <a-spin size="large" />
    </div>

    <div v-else-if="error" class="error-state">
      <a-alert type="error" :message="error" show-icon />
    </div>

    <div v-else>
      <a-row :gutter="[16, 16]" class="memory-grid">
        <a-col
          v-for="memory in memories"
          :key="memory.id"
          :xs="24"
          :sm="12"
          :lg="8"
          :xl="6"
        >
          <a-card
            class="memory-card"
            hoverable
            @click="goToDetail(memory.id)"
          >
            <div class="card-header">
              <a-tag :color="getCategoryColor(memory.category)" class="category-tag">
                {{ memory.category }}
              </a-tag>
              <a-tag :color="getTierColor(memory.tier)" class="tier-tag">
                {{ memory.tier }}
              </a-tag>
            </div>
            <p class="memory-content">{{ truncateContent(memory.content) }}</p>
            <div class="card-footer">
              <span class="memory-date">{{ formatDate(memory.created_at) }}</span>
              <span v-if="memory.tags.length" class="memory-tags-count">
                {{ memory.tags.length }} tags
              </span>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <div v-if="memories.length === 0" class="empty-state">
        <a-empty description="暂无记忆" />
      </div>

      <div class="pagination-section">
        <a-pagination
          v-model:current="pagination.offset"
          :page-size="pagination.limit"
          :total="totalCount"
          :show-size-changer="true"
          :page-size-options="['12', '24', '48', '96']"
          :show-total="(total: number) => `共 ${total} 条`"
          @change="handlePageChange"
          @showSizeChange="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { memoriesApi } from '@/api/memories'
import type { Memory } from '@/types/memory'
import type { MemoryListParams } from '@/api/types'

const router = useRouter()

const loading = ref(false)
const error = ref('')
const memories = ref<Memory[]>([])
const totalCount = ref(0)

const filters = reactive<MemoryListParams>({
  category: undefined,
  tier: undefined,
  memory_type: undefined,
  state: undefined,
  tags: undefined,
})

const pagination = reactive({
  limit: 12,
  offset: 1,
})

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    profile: 'blue',
    preferences: 'green',
    entities: 'purple',
    events: 'orange',
    cases: 'red',
    patterns: 'cyan',
  }
  return colors[category] || 'default'
}

const getTierColor = (tier: string): string => {
  const colors: Record<string, string> = {
    core: 'gold',
    working: 'blue',
    peripheral: 'gray',
  }
  return colors[tier] || 'default'
}

const truncateContent = (content: string, maxLength = 120): string => {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '...'
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const goToDetail = (id: string) => {
  router.push(`/memories/${id}`)
}

const fetchMemories = async () => {
  loading.value = true
  error.value = ''

  try {
    const params: MemoryListParams = {
      ...filters,
      limit: pagination.limit,
      offset: pagination.offset,
    }
    const response = await memoriesApi.list(params)
    memories.value = response.memories
    totalCount.value = response.total_count
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取记忆列表失败'
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.offset = 1
  fetchMemories()
}

const handlePageChange = (page: number) => {
  pagination.offset = page
  fetchMemories()
}

const handleSizeChange = (current: number, size: number) => {
  pagination.limit = size
  pagination.offset = current
  fetchMemories()
}

onMounted(() => {
  fetchMemories()
})
</script>

<style scoped>
.memory-list-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px 0;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.filters-section {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.memory-grid {
  margin-bottom: 24px;
}

.memory-card {
  height: 100%;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}

.memory-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.category-tag,
.tier-tag {
  font-size: 12px;
}

.memory-content {
  font-size: 14px;
  color: #444;
  line-height: 1.5;
  margin: 0 0 12px 0;
  min-height: 63px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}
</style>
