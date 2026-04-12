<template>
  <div class="spaces-view">
    <div class="filter-bar">
      <a-form layout="inline" style="margin-bottom: 16px">
        <a-form-item label="空间类型">
          <a-select
            v-model:value="filters.spaceType"
            :options="SPACE_TYPE_FILTER_OPTIONS"
            placeholder="全部"
            allow-clear
            style="width: 140px"
            @change="handleFilterChange"
          />
        </a-form-item>
        <a-form-item label="搜索">
          <a-input-search
            v-model:value="filters.search"
            placeholder="搜索空间名称"
            style="width: 200px"
            @search="handleSearch"
            @pressEnter="handleSearch"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="resetFilters">重置</a-button>
            <a-button type="primary" @click="openModal()">新增空间</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>

    <a-spin :spinning="loading">
      <a-table
        :columns="columns"
        :data-source="spaces"
        :pagination="pagination"
        :row-key="(record: Space) => record.id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a @click="viewDetail(record.id)">{{ record.name }}</a>
          </template>
          <template v-else-if="column.key === 'space_type'">
            <a-tag :color="getSpaceTypeColor(record.space_type)">
              {{ SPACE_TYPE_LABELS[record.space_type] }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'member_count'">
            {{ record.member_count }}
          </template>
          <template v-else-if="column.key === 'memory_count'">
            {{ record.memory_count }}
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ formatDate(record.created_at) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewDetail(record.id)">查看</a-button>
              <a-button type="link" size="small" @click="openModal(record)">编辑</a-button>
              <a-popconfirm
                title="删除空间将同时删除空间内所有记忆，确定要删除吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-spin>

    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="modalLoading"
      destroy-on-close
      @ok="handleModalOk"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        layout="vertical"
      >
        <a-form-item label="空间名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入空间名称" />
        </a-form-item>
        <a-form-item label="空间类型" name="space_type">
          <a-select
            v-model:value="formState.space_type"
            :options="SPACE_TYPE_OPTIONS"
            placeholder="请选择空间类型"
            :disabled="!!editingId"
          />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="formState.description" placeholder="请输入描述（可选）" :rows="3" />
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
import { spacesApi } from '@/api/spaces'
import type { Space } from '@/types/space'
import { SPACE_TYPE_LABELS, SPACE_TYPE_OPTIONS, SPACE_TYPE_FILTER_OPTIONS } from '@/utils/enums'

const router = useRouter()
const loading = ref(false)
const spaces = ref<Space[]>([])
const formRef = ref<FormInstance>()

const filters = reactive({
  spaceType: undefined as string | undefined,
  search: ''
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50']
})

const modalVisible = ref(false)
const modalLoading = ref(false)
const editingId = ref<string | null>(null)
const modalTitle = computed(() => (editingId.value ? '编辑空间' : '新增空间'))

const formState = reactive({
  name: '',
  space_type: undefined as string | undefined,
  description: ''
})

const formRules = {
  name: [{ required: true, message: '请输入空间名称', trigger: 'blur' }],
  space_type: [{ required: true, message: '请选择空间类型', trigger: 'change' }]
}

const columns = [
  {
    title: '空间名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '空间类型',
    dataIndex: 'space_type',
    key: 'space_type',
    width: 120
  },
  {
    title: '成员数量',
    dataIndex: 'member_count',
    key: 'member_count',
    width: 100
  },
  {
    title: '记忆数量',
    dataIndex: 'memory_count',
    key: 'memory_count',
    width: 100
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180
  },
  {
    title: '操作',
    key: 'action',
    width: 200
  }
]

const fetchSpaces = async () => {
  loading.value = true
  try {
    const params: any = {
      limit: pagination.pageSize,
      offset: (pagination.current - 1) * pagination.pageSize
    }
    if (filters.spaceType) params.space_type = filters.spaceType
    if (filters.search) params.search = filters.search

    const response = await spacesApi.list(params)
    spaces.value = response.spaces
    pagination.total = response.total
  } catch (error: any) {
    message.error(error?.error?.message || '获取空间列表失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.current = 1
  fetchSpaces()
}

const handleSearch = () => {
  pagination.current = 1
  fetchSpaces()
}

const resetFilters = () => {
  filters.spaceType = undefined
  filters.search = ''
  pagination.current = 1
  fetchSpaces()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchSpaces()
}

const openModal = (record?: Space) => {
  if (record) {
    editingId.value = record.id
    formState.name = record.name
    formState.space_type = record.space_type
    formState.description = record.description || ''
  } else {
    editingId.value = null
    formState.name = ''
    formState.space_type = undefined
    formState.description = ''
  }
  modalVisible.value = true
}

const handleModalOk = async () => {
  try {
    await formRef.value?.validate()
    modalLoading.value = true

    if (editingId.value) {
      await spacesApi.update(editingId.value, {
        name: formState.name,
        description: formState.description
      })
      message.success('更新成功')
    } else {
      await spacesApi.create({
        name: formState.name,
        space_type: formState.space_type as 'team' | 'organization',
        description: formState.description
      })
      message.success('创建成功')
    }

    modalVisible.value = false
    fetchSpaces()
  } catch (error: any) {
    if (error?.errorFields) return
    message.error(error?.error?.message || '操作失败')
  } finally {
    modalLoading.value = false
  }
}

const handleDelete = async (id: string) => {
  try {
    await spacesApi.delete(id)
    message.success('删除成功')
    fetchSpaces()
  } catch (error: any) {
    message.error(error?.error?.message || '删除失败')
  }
}

const viewDetail = (id: string) => {
  router.push(`/spaces/${id}`)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getSpaceTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    personal: 'blue',
    team: 'green',
    organization: 'orange'
  }
  return colors[type] || 'default'
}

onMounted(() => {
  fetchSpaces()
})
</script>

<style scoped>
.spaces-view {
  padding: 24px;
  min-height: calc(100vh - 100px);
}

.filter-bar {
  margin-bottom: 24px;
}
</style>
