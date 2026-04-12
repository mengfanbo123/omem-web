<template>
  <div class="search-view">
    <a-layout-content style="padding: 24px">
      <a-card>
        <a-input-search
          v-model:value="searchQuery"
          placeholder="Enter keywords to search memories..."
          size="large"
          @search="handleSearch"
          @keyup.enter="handleSearch"
        />

        <a-collapse v-model:activeKey="filterVisible" style="margin-top: 16px">
          <a-collapse-panel key="filters" header="Advanced Filters">
            <a-form layout="vertical">
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="Space">
                    <a-select
                      v-model:value="filters.space_ids"
                      mode="multiple"
                      placeholder="Select spaces"
                      :loading="spacesLoading"
                      :options="spaceOptions"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="Category">
                    <a-select
                      v-model:value="filters.categories"
                      mode="multiple"
                      placeholder="Select category"
                      :options="CATEGORY_OPTIONS"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="Tier">
                    <a-select
                      v-model:value="filters.tiers"
                      mode="multiple"
                      placeholder="Select tier"
                      :options="TIER_OPTIONS"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="Type">
                    <a-select
                      v-model:value="filters.memory_types"
                      mode="multiple"
                      placeholder="Select type"
                      :options="MEMORY_TYPE_OPTIONS"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="State">
                    <a-select
                      v-model:value="filters.states"
                      mode="multiple"
                      placeholder="Select state"
                      :options="STATE_OPTIONS"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="Date Range">
                    <a-range-picker
                      v-model:value="dateRange"
                      style="width: 100%"
                      @change="handleDateRangeChange"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="24">
                  <a-form-item label="Tags">
                    <a-select
                      v-model:value="filters.tags"
                      mode="tags"
                      placeholder="Enter tags"
                      :token-separators="[',']"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item>
                <a-space>
                  <a-button type="primary" @click="handleSearch">Search</a-button>
                  <a-button @click="handleReset">Reset</a-button>
                </a-space>
              </a-form-item>
            </a-form>
          </a-collapse-panel>
        </a-collapse>
      </a-card>

      <a-card style="margin-top: 16px" v-if="searchResults.length > 0">
        <template #title>
          <a-space>
            <span>Search Results ({{ total }})</span>
            <a-select v-model:value="sortOption" style="width: 200px" @change="handleSearch">
              <a-select-option value="relevance_desc">Relevance</a-select-option>
              <a-select-option value="created_at_desc">Newest First</a-select-option>
              <a-select-option value="created_at_asc">Oldest First</a-select-option>
              <a-select-option value="updated_at_desc">Recently Updated</a-select-option>
              <a-select-option value="updated_at_asc">Least Recently Updated</a-select-option>
            </a-select>
          </a-space>
        </template>

        <a-list :data-source="searchResults" :loading="loading" :pagination="false">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  <a @click="viewDetail(item.memory.id)">
                    {{ item.memory.content.substring(0, 50) }}{{ item.memory.content.length > 50 ? '...' : '' }}
                  </a>
                </template>
                <template #description>
                  <div class="description-text">
                    {{ item.memory.l0_abstract || item.memory.l1_overview || '-' }}
                  </div>
                  <div style="margin-top: 8px">
                    <a-space>
                      <a-tag :color="getCategoryColor(item.memory.category)">
                        {{ CATEGORY_LABELS[item.memory.category] }}
                      </a-tag>
                      <a-tag :color="getTierColor(item.memory.tier)">
                        {{ TIER_LABELS[item.memory.tier] }}
                      </a-tag>
                      <a-tag>{{ MEMORY_TYPE_LABELS[item.memory.memory_type] }}</a-tag>
                      <a-tag v-if="item.memory.state !== 'active'" :color="getStateColor(item.memory.state)">
                        {{ STATE_LABELS[item.memory.state] }}
                      </a-tag>
                      <span class="date-text">{{ formatDate(item.memory.created_at) }}</span>
                    </a-space>
                  </div>
                  <div v-if="item.memory.tags && item.memory.tags.length > 0" style="margin-top: 8px">
                    <a-tag v-for="tag in item.memory.tags.slice(0, 6)" :key="tag" color="blue" class="tag-item">
                      {{ tag }}
                    </a-tag>
                    <span v-if="item.memory.tags.length > 6" class="more-tags">
                      +{{ item.memory.tags.length - 6 }}
                    </span>
                  </div>
                  <div v-if="item.score" style="margin-top: 8px">
                    <span class="score-label">Relevance: </span>
                    <a-progress
                      :percent="Math.round(item.score * 100)"
                      :show-info="false"
                      :stroke-color="getScoreColor(item.score)"
                      style="width: 100px; display: inline-block"
                    />
                    <span style="margin-left: 8px" class="score-value">{{ Math.round(item.score * 100) }}%</span>
                  </div>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a @click="viewDetail(item.memory.id)">View</a>
                <a @click="handleEdit(item.memory)">Edit</a>
                <a-popconfirm
                  title="确定要删除这条记忆吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDelete(item.memory.id)"
                >
                  <a style="color: #ff4d4f">Delete</a>
                </a-popconfirm>
              </template>
            </a-list-item>
          </template>
        </a-list>

        <a-pagination
          v-model:current="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :show-size-changer="true"
          :page-size-options="['10', '20', '50', '100']"
          show-quick-jumper
          @change="handlePageChange"
          style="margin-top: 16px; text-align: right"
        />
      </a-card>

      <a-card v-else-if="!loading && searched" style="margin-top: 16px">
        <a-empty description="No results found" />
      </a-card>

      <a-card v-else-if="!loading && !searched" style="margin-top: 16px">
        <div class="empty-state-hint">
          <SearchOutlined style="font-size: 48px; color: #bfbfbf; margin-bottom: 16px" />
          <p>Enter keywords to search memories</p>
        </div>
      </a-card>

      <a-spin v-if="loading" size="large" class="loading-spinner" />

      <a-modal
        v-model:open="modalVisible"
        title="编辑记忆"
        :confirm-loading="modalLoading"
        width="800px"
        destroy-on-close
        @ok="handleModalOk"
      >
        <a-form
          ref="formRef"
          :model="formState"
          :rules="formRules"
          layout="vertical"
        >
          <a-form-item label="内容" name="content">
            <a-textarea
              v-model:value="formState.content"
              placeholder="请输入记忆内容"
              :rows="6"
            />
          </a-form-item>
          <a-form-item label="标签" name="tags">
            <a-select
              v-model:value="formState.tags"
              mode="tags"
              placeholder="输入标签后按回车"
              :token-separators="[',']"
            />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-layout-content>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import { SearchOutlined } from '@ant-design/icons-vue'
import { memoriesApi, type SearchParams, type SearchResult } from '@/api/memories'
import type { Memory, Category, Tier, MemoryType, MemoryState } from '@/types/memory'
import {
  CATEGORY_OPTIONS,
  TIER_OPTIONS,
  MEMORY_TYPE_OPTIONS,
  STATE_OPTIONS,
  CATEGORY_LABELS,
  TIER_LABELS,
  MEMORY_TYPE_LABELS,
  STATE_LABELS
} from '@/utils/enums'

const router = useRouter()
const loading = ref(false)
const searched = ref(false)
const searchResults = ref<SearchResult[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const sortOption = ref('relevance_desc')
const filterVisible = ref<string[]>([])
const dateRange = ref<[Dayjs, Dayjs] | null>(null)
const spacesLoading = ref(false)
const spaceOptions = ref<{ label: string; value: string }[]>([])

const formRef = ref<FormInstance>()
const modalVisible = ref(false)
const modalLoading = ref(false)
const editingMemory = ref<Memory | null>(null)

const formState = reactive({
  content: '',
  tags: [] as string[]
})

const formRules = {
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const filters = reactive({
  space_ids: [] as string[],
  categories: [] as string[],
  tiers: [] as string[],
  memory_types: [] as string[],
  states: [] as string[],
  tags: [] as string[]
})

const searchQuery = ref('')

const parseSortOptions = () => {
  const [sortBy, sortOrder] = sortOption.value.split('_')
  return {
    sort_by: sortBy as 'relevance' | 'created_at' | 'updated_at',
    sort_order: sortOrder as 'asc' | 'desc'
  }
}

const buildSearchParams = (): SearchParams => {
  const params: SearchParams = {
    query: searchQuery.value,
    limit: pageSize.value,
    offset: (currentPage.value - 1) * pageSize.value,
    ...parseSortOptions()
  }

  if (filters.space_ids.length > 0) params.space_ids = filters.space_ids
  if (filters.categories.length > 0) params.categories = filters.categories
  if (filters.tiers.length > 0) params.tiers = filters.tiers
  if (filters.memory_types.length > 0) params.memory_types = filters.memory_types
  if (filters.states.length > 0) params.states = filters.states
  if (filters.tags.length > 0) params.tags = filters.tags

  return params
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    message.warning('请输入搜索关键词')
    return
  }

  loading.value = true
  searched.value = true
  try {
    const params = buildSearchParams()
    const response = await memoriesApi.search(params)
    searchResults.value = response.results
    total.value = response.total
  } catch (error: any) {
    message.error(error?.error?.message || '搜索失败')
    searchResults.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  searchQuery.value = ''
  filters.space_ids = []
  filters.categories = []
  filters.tiers = []
  filters.memory_types = []
  filters.states = []
  filters.tags = []
  dateRange.value = null
  currentPage.value = 1
  sortOption.value = 'relevance_desc'
  searchResults.value = []
  total.value = 0
  searched.value = false
}

const handleDateRangeChange = (dates: [Dayjs, Dayjs] | null) => {
  if (dates) {
    filters.created_after = dates[0].startOf('day').toISOString()
    filters.created_before = dates[1].endOf('day').toISOString()
  } else {
    filters.created_after = undefined
    filters.created_before = undefined
  }
}

const handlePageChange = () => {
  if (searched.value) {
    handleSearch()
  }
}

const viewDetail = (id: string) => {
  router.push(`/memories/${id}`)
}

const handleEdit = (memory: Memory) => {
  editingMemory.value = memory
  formState.content = memory.content
  formState.tags = memory.tags ? [...memory.tags] : []
  modalVisible.value = true
}

const handleModalOk = async () => {
  try {
    await formRef.value?.validate()
    modalLoading.value = true

    if (editingMemory.value) {
      await memoriesApi.update(editingMemory.value.id, {
        content: formState.content,
        tags: formState.tags ? [...formState.tags] : []
      })
      message.success('更新成功')
    }

    modalVisible.value = false
    handleSearch()
  } catch (error: any) {
    if (error?.errorFields) return
    message.error(error?.error?.message || '操作失败')
  } finally {
    modalLoading.value = false
  }
}

const handleDelete = async (id: string) => {
  try {
    await memoriesApi.delete(id)
    message.success('删除成功')
    handleSearch()
  } catch (error: any) {
    message.error(error?.error?.message || '删除失败')
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getCategoryColor = (category: Category) => {
  const colors: Record<Category, string> = {
    profile: 'blue',
    preferences: 'green',
    entities: 'purple',
    events: 'orange',
    cases: 'red',
    patterns: 'cyan'
  }
  return colors[category]
}

const getTierColor = (tier: Tier) => {
  const colors: Record<Tier, string> = {
    core: 'gold',
    working: 'blue',
    peripheral: 'default'
  }
  return colors[tier]
}

const getStateColor = (state: MemoryState) => {
  const colors: Record<MemoryState, string> = {
    active: 'green',
    archived: 'orange',
    deleted: 'red'
  }
  return colors[state]
}

const getScoreColor = (score: number) => {
  if (score >= 0.8) return '#52c41a'
  if (score >= 0.6) return '#faad14'
  if (score >= 0.4) return '#fa8c16'
  return '#ff4d4f'
}

const fetchSpaces = async () => {
  spacesLoading.value = true
  try {
    spaceOptions.value = [
      { label: 'Default Space', value: 'default' }
    ]
  } catch (error) {
    console.error('Failed to fetch spaces', error)
  } finally {
    spacesLoading.value = false
  }
}

onMounted(() => {
  fetchSpaces()
})
</script>

<style scoped>
.search-view {
  min-height: calc(100vh - 100px);
}

.description-text {
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tag-item {
  font-size: 11px;
  margin: 0;
}

.more-tags {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 22px;
}

.date-text {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.score-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
}

.score-value {
  font-size: 12px;
  font-weight: 500;
}

.empty-state-hint {
  text-align: center;
  padding: 60px 0;
  color: rgba(0, 0, 0, 0.45);
}

.loading-spinner {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}
</style>
