<template>
  <div class="memory-list">
    <!-- 筛选器 -->
    <div class="filter-bar">
      <a-form layout="inline" style="margin-bottom: 16px">
        <a-form-item label="分类">
          <a-select
            v-model:value="filters.category"
            :options="CATEGORY_OPTIONS"
            placeholder="全部"
            allow-clear
            style="width: 120px"
          />
        </a-form-item>
        <a-form-item label="层级">
          <a-select
            v-model:value="filters.tier"
            :options="TIER_OPTIONS"
            placeholder="全部"
            allow-clear
            style="width: 100px"
          />
        </a-form-item>
        <a-form-item label="类型">
          <a-select
            v-model:value="filters.memory_type"
            :options="MEMORY_TYPE_OPTIONS"
            placeholder="全部"
            allow-clear
            style="width: 100px"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="filters.state"
            :options="STATE_OPTIONS"
            placeholder="全部"
            allow-clear
            style="width: 100px"
          />
        </a-form-item>
        <a-form-item label="标签">
          <a-input
            v-model:value="filters.tags"
            placeholder="输入标签"
            allow-clear
            style="width: 150px"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="fetchMemories">查询</a-button>
          <a-button style="margin-left: 8px" @click="resetFilters">重置</a-button>
          <a-button type="primary" style="margin-left: 8px" @click="openModal()">新增记忆</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 卡片列表 -->
    <a-row :gutter="[16, 16]" class="card-grid">
      <a-col v-for="record in memories" :key="record.id" :xs="24" :sm="12" :md="8" :lg="6">
        <a-card class="memory-card" hoverable @click="viewDetail(record.id)">
          <!-- 卡片头部：分类/层级/类型标签 -->
          <div class="card-header">
            <a-tag :color="getCategoryColor(record.category)" class="category-tag">
              {{ CATEGORY_LABELS[record.category] }}
            </a-tag>
            <a-tag :color="getTierColor(record.tier)" class="tier-tag">
              {{ TIER_LABELS[record.tier] }}
            </a-tag>
            <a-tag class="type-tag">
              {{ MEMORY_TYPE_LABELS[record.memory_type] }}
            </a-tag>
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <p class="content-preview">{{ record.l0_abstract || record.content }}</p>
          </div>

          <!-- 卡片标签 -->
          <div class="card-tags" v-if="record.tags && record.tags.length > 0">
            <a-tag v-for="tag in record.tags.slice(0, 4)" :key="tag" color="blue" class="tag-item">
              {{ tag }}
            </a-tag>
            <span v-if="record.tags.length > 4" class="more-tags">+{{ record.tags.length - 4 }}</span>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <span class="create-time">{{ formatDate(record.created_at) }}</span>
            <a-space class="card-actions" @click.stop>
              <a-button type="link" size="small" @click="openModal(record)">编辑</a-button>
              <a-popconfirm
                title="确定要删除这条记忆吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 空状态 -->
    <a-empty v-if="!loading && memories.length === 0" description="暂无记忆" class="empty-state" />

    <!-- 分页器 -->
    <div class="pagination-wrapper" v-if="memories.length > 0">
      <a-pagination
        v-model:current="pagination.current"
        v-model:pageSize="pagination.pageSize"
        :total="pagination.total"
        :show-size-changer="true"
        :page-size-options="['12', '24', '48', '96']"
        @change="handlePageChange"
        @showSizeChange="handleSizeChange"
        show-quick-jumper
      />
    </div>

    <!-- 编辑/新增弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
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
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="分类" name="category">
              <a-select
                v-model:value="formState.category"
                :options="CATEGORY_OPTIONS"
                placeholder="请选择分类"
                disabled
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="层级" name="tier">
              <a-select
                v-model:value="formState.tier"
                :options="TIER_OPTIONS"
                placeholder="请选择层级"
                disabled
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="类型" name="memory_type">
              <a-select
                v-model:value="formState.memory_type"
                :options="MEMORY_TYPE_OPTIONS"
                placeholder="请选择类型"
                disabled
              />
            </a-form-item>
          </a-col>
        </a-row>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { memoriesApi } from '@/api/memories'
import type { Memory, Category, Tier, MemoryType } from '@/types/memory'
import {
  CATEGORY_OPTIONS,
  TIER_OPTIONS,
  MEMORY_TYPE_OPTIONS,
  STATE_OPTIONS,
  CATEGORY_LABELS,
  TIER_LABELS,
  MEMORY_TYPE_LABELS
} from '@/utils/enums'

const router = useRouter()
const loading = ref(false)
const memories = ref<Memory[]>([])
const formRef = ref<FormInstance>()

const filters = reactive({
  category: undefined as Category | undefined,
  tier: undefined as Tier | undefined,
  memory_type: undefined as MemoryType | undefined,
  state: undefined,
  tags: ''
})

const pagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['12', '24', '48', '96']
})

const modalVisible = ref(false)
const modalLoading = ref(false)
const editingId = ref<string | null>(null)
const modalTitle = computed(() => (editingId.value ? '编辑记忆' : '新增记忆'))

const formState = reactive({
  content: '',
  category: undefined as Category | undefined,
  tier: undefined as Tier | undefined,
  memory_type: undefined as MemoryType | undefined,
  tags: [] as string[]
})

const formRules = {
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  tier: [{ required: true, message: '请选择层级', trigger: 'change' }],
  memory_type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const fetchMemories = async () => {
  loading.value = true
  try {
    const params: any = {
      limit: pagination.pageSize,
      offset: (pagination.current - 1) * pagination.pageSize
    }
    if (filters.category) params.category = filters.category
    if (filters.tier) params.tier = filters.tier
    if (filters.memory_type) params.memory_type = filters.memory_type
    if (filters.state) params.state = filters.state
    if (filters.tags) params.tags = filters.tags

    const response = await memoriesApi.list(params)
    memories.value = response.memories
    pagination.total = response.total
  } catch (error: any) {
    message.error(error?.error?.message || '获取记忆列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.category = undefined
  filters.tier = undefined
  filters.memory_type = undefined
  filters.state = undefined
  filters.tags = ''
  pagination.current = 1
  fetchMemories()
}

const handlePageChange = (page: number, pageSize: number) => {
  pagination.current = page
  pagination.pageSize = pageSize
  fetchMemories()
}

const handleSizeChange = (current: number, size: number) => {
  pagination.pageSize = size
  pagination.current = 1
  fetchMemories()
}

const openModal = (record?: Memory) => {
  if (record) {
    editingId.value = record.id
    formState.content = record.content
    formState.category = record.category
    formState.tier = record.tier
    formState.memory_type = record.memory_type
    formState.tags = record.tags ? [...record.tags] : []
  } else {
    editingId.value = null
    formState.content = ''
    formState.category = undefined
    formState.tier = undefined
    formState.memory_type = undefined
    formState.tags = []
  }
  modalVisible.value = true
}

const handleModalOk = async () => {
  try {
    await formRef.value?.validate()
    modalLoading.value = true

    // 后端只支持修改 content/tags/state，category/tier/memory_type 为只读字段
    const payload = {
      content: formState.content,
      tags: formState.tags ? [...formState.tags] : []
    }

    if (editingId.value) {
      await memoriesApi.update(editingId.value, payload)
      message.success('更新成功')
    } else {
      await memoriesApi.create(payload)
      message.success('创建成功')
    }

    modalVisible.value = false
    fetchMemories()
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
    fetchMemories()
  } catch (error: any) {
    message.error(error?.error?.message || '删除失败')
  }
}

const viewDetail = (id: string) => {
  router.push(`/memories/${id}`)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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

onMounted(() => {
  fetchMemories()
})
</script>

<style scoped>
.memory-list {
  padding: 24px;
  min-height: calc(100vh - 100px);
}

.filter-bar {
  margin-bottom: 24px;
}

.card-grid {
  margin-bottom: 24px;
}

.memory-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid var(--border-color, #f0f0f0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.memory-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--primary-color, #1890ff);
}

.card-header {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.category-tag,
.tier-tag,
.type-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  margin: 0;
}

.card-content {
  flex: 1;
  margin-bottom: 12px;
}

.content-preview {
  color: var(--text-color, rgba(0, 0, 0, 0.85));
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}

.tag-item {
  font-size: 11px;
  margin: 0;
}

.more-tags {
  font-size: 11px;
  color: var(--text-color-secondary, rgba(0, 0, 0, 0.45));
  line-height: 22px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color, #f0f0f0);
}

.create-time {
  font-size: 12px;
  color: var(--text-color-secondary, rgba(0, 0, 0, 0.45));
}

.card-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.memory-card:hover .card-actions {
  opacity: 1;
}

.empty-state {
  padding: 60px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

:deep(.ant-card-body) {
  padding: 16px;
}
</style>
