<template>
  <a-spin :spinning="loading">
    <a-alert
      v-if="error"
      message="加载失败"
      :description="error"
      type="error"
      show-icon
      style="margin-bottom: 16px"
    />

    <a-page-header
      :title="space?.name || 'Space Details'"
      @back="() => router.back()"
    >
      <template #extra>
        <a-button @click="handleEdit">Edit Space</a-button>
        <a-button danger @click="handleDelete">Delete Space</a-button>
      </template>

      <a-descriptions :column="2" bordered style="margin-bottom: 24px">
        <a-descriptions-item label="Name">{{ space?.name }}</a-descriptions-item>
        <a-descriptions-item label="Type">
          <a-tag :color="getSpaceTypeColor(space?.space_type)">
            {{ getSpaceTypeLabel(space?.space_type) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="Description" :span="2">
          {{ space?.description || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="Members">{{ space?.member_count }}</a-descriptions-item>
        <a-descriptions-item label="Memories">{{ space?.memory_count }}</a-descriptions-item>
        <a-descriptions-item label="Created">{{ formatDate(space?.created_at) }}</a-descriptions-item>
        <a-descriptions-item label="Updated">{{ formatDate(space?.updated_at) }}</a-descriptions-item>
      </a-descriptions>

      <a-card title="Members" style="margin-bottom: 16px">
        <template #extra>
          <a-button
            v-if="canManageMembers"
            type="primary"
            @click="showAddMemberModal = true"
          >
            Add Member
          </a-button>
        </template>

        <a-table
          :dataSource="members"
          :columns="memberColumns"
          :pagination="false"
          row-key="user_id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'role'">
              <a-tag :color="getRoleColor(record.role)">
                {{ record.role.toUpperCase() }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'joined_at'">
              {{ formatDate(record.joined_at) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space v-if="canManageMembers && record.role !== 'owner'">
                <a-dropdown>
                  <a-button size="small">
                    Change Role
                    <DownOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu @click="(e: any) => { if (e.key) handleChangeRole(record, e.key) }">
                      <a-menu-item key="admin">Admin</a-menu-item>
                      <a-menu-item key="member">Member</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
                <a-popconfirm
                  title="Remove this member?"
                  ok-text="Yes"
                  cancel-text="No"
                  @confirm="handleRemoveMember(record)"
                >
                  <a-button size="small" danger>Remove</a-button>
                </a-popconfirm>
              </a-space>
              <span v-else-if="record.role === 'owner'" class="text-gray">
                Owner
              </span>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-card title="Memories">
        <template #extra>
          <a-space>
            <a-select
              v-model:value="filters.category"
              placeholder="Category"
              style="width: 120px"
              allow-clear
            >
              <a-select-option value="work">Work</a-select-option>
              <a-select-option value="personal">Personal</a-select-option>
              <a-select-option value="project">Project</a-select-option>
            </a-select>
            <a-select
              v-model:value="filters.tier"
              placeholder="Tier"
              style="width: 100px"
              allow-clear
            >
              <a-select-option value="L0">L0</a-select-option>
              <a-select-option value="L1">L1</a-select-option>
              <a-select-option value="L2">L2</a-select-option>
              <a-select-option value="L3">L3</a-select-option>
            </a-select>
            <a-input
              v-model:value="filters.creator"
              placeholder="Creator"
              style="width: 120px"
              allow-clear
            />
            <a-button type="primary" @click="loadMemories">Filter</a-button>
          </a-space>
        </template>

        <a-table
          :dataSource="memories"
          :columns="memoryColumns"
          :loading="memoriesLoading"
          :pagination="memoryPagination"
          row-key="id"
          @change="handleMemoryTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'content'">
              <span :title="record.content">
                {{ record.content?.slice(0, 50) }}{{ record.content?.length > 50 ? '...' : '' }}
              </span>
            </template>
            <template v-else-if="column.key === 'category'">
              <a-tag>{{ record.category }}</a-tag>
            </template>
            <template v-else-if="column.key === 'tier'">
              <a-tag :color="getTierColor(record.tier)">{{ record.tier }}</a-tag>
            </template>
            <template v-else-if="column.key === 'created_at'">
              {{ formatDate(record.created_at) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button size="small" @click="viewMemoryDetail(record)">
                  View
                </a-button>
                <a-popconfirm
                  v-if="canManageMembers"
                  title="Remove this memory?"
                  ok-text="Yes"
                  cancel-text="No"
                  @confirm="handleRemoveMemory(record)"
                >
                  <a-button size="small" danger>Remove</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </a-page-header>
  </a-spin>

  <a-modal
    v-model:open="showAddMemberModal"
    title="Add Member"
    @ok="handleAddMember"
    :confirm-loading="addMemberLoading"
  >
    <a-form
      ref="addMemberFormRef"
      :model="addMemberForm"
      :rules="addMemberRules"
      layout="vertical"
    >
      <a-form-item label="User ID or Email" name="user_id">
        <a-input
          v-model:value="addMemberForm.user_id"
          placeholder="Enter user ID or email"
        />
      </a-form-item>
      <a-form-item label="Role" name="role">
        <a-select v-model:value="addMemberForm.role" placeholder="Select role">
          <a-select-option value="admin">Admin</a-select-option>
          <a-select-option value="member">Member</a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { DownOutlined } from '@ant-design/icons-vue'
import { spacesApi } from '@/api/spaces'
import type { Space, SpaceMember } from '@/api/spaces'
import type { TablePaginationConfig } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()

const spaceId = computed(() => route.params.id as string)

const loading = ref(false)
const error = ref<string | null>(null)
const space = ref<Space | null>(null)
const members = ref<SpaceMember[]>([])

const memoriesLoading = ref(false)
const memories = ref<any[]>([])
const memoryPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const filters = reactive({
  category: undefined as string | undefined,
  tier: undefined as string | undefined,
  creator: undefined as string | undefined,
})

const showAddMemberModal = ref(false)
const addMemberLoading = ref(false)
const addMemberFormRef = ref()
const addMemberForm = reactive({
  user_id: '',
  role: 'member' as 'admin' | 'member',
})

const addMemberRules = {
  user_id: [{ required: true, message: 'Please enter user ID or email' }],
  role: [{ required: true, message: 'Please select role' }],
}

const canManageMembers = computed(() => {
  const currentUserId = localStorage.getItem('currentUserId')
  const member = members.value.find(m => m.user_id === currentUserId)
  return member && (member.role === 'owner' || member.role === 'admin')
})

const memberColumns = [
  { title: 'Username', dataIndex: 'username', key: 'username' },
  { title: 'Role', dataIndex: 'role', key: 'role' },
  { title: 'Joined At', dataIndex: 'joined_at', key: 'joined_at' },
  { title: 'Action', key: 'action', width: 200 },
]

const memoryColumns = [
  { title: 'Content', dataIndex: 'content', key: 'content', ellipsis: true },
  { title: 'Category', dataIndex: 'category', key: 'category', width: 100 },
  { title: 'Tier', dataIndex: 'tier', key: 'tier', width: 80 },
  { title: 'Creator', dataIndex: 'creator', key: 'creator', width: 120 },
  { title: 'Created', dataIndex: 'created_at', key: 'created_at', width: 150 },
  { title: 'Action', key: 'action', width: 150 },
]

const getSpaceTypeLabel = (type?: string) => {
  const map: Record<string, string> = {
    personal: 'Personal',
    team: 'Team',
    organization: 'Organization',
  }
  return type ? map[type] || type : '-'
}

const getSpaceTypeColor = (type?: string) => {
  const map: Record<string, string> = {
    personal: 'blue',
    team: 'green',
    organization: 'purple',
  }
  return type ? map[type] || 'default' : 'default'
}

const getRoleColor = (role: string) => {
  const map: Record<string, string> = {
    owner: 'gold',
    admin: 'blue',
    member: 'gray',
  }
  return map[role] || 'default'
}

const getTierColor = (tier?: string) => {
  const map: Record<string, string> = {
    L0: 'blue',
    L1: 'green',
    L2: 'orange',
    L3: 'red',
  }
  return tier ? map[tier] || 'default' : 'default'
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const loadSpaceDetail = async () => {
  loading.value = true
  error.value = null
  try {
    const detail = await spacesApi.getDetail(spaceId.value)
    space.value = detail
    members.value = detail.members || []
  } catch (e: any) {
    error.value = e?.error?.message || e?.message || 'Failed to load space details'
  } finally {
    loading.value = false
  }
}

const loadMemories = async () => {
  memoriesLoading.value = true
  try {
    const params = {
      category: filters.category,
      tier: filters.tier,
      creator: filters.creator,
      limit: memoryPagination.pageSize,
      offset: (memoryPagination.current - 1) * memoryPagination.pageSize,
    }
    const res = await spacesApi.getMemories(spaceId.value, params)
    memories.value = res.memories
    memoryPagination.total = res.total
  } catch (e: any) {
    message.error(e?.error?.message || 'Failed to load memories')
  } finally {
    memoriesLoading.value = false
  }
}

const handleMemoryTableChange = (pag: TablePaginationConfig) => {
  memoryPagination.current = pag.current || 1
  memoryPagination.pageSize = pag.pageSize || 10
  loadMemories()
}

const handleAddMember = async () => {
  try {
    await addMemberFormRef.value.validate()
    addMemberLoading.value = true
    await spacesApi.addMember(spaceId.value, {
      user_id: addMemberForm.user_id,
      role: addMemberForm.role,
    })
    message.success('Member added successfully')
    showAddMemberModal.value = false
    addMemberForm.user_id = ''
    addMemberForm.role = 'member'
    await loadSpaceDetail()
  } catch (e: any) {
    if (e?.error?.message) {
      message.error(e.error.message)
    }
  } finally {
    addMemberLoading.value = false
  }
}

const handleChangeRole = async (member: SpaceMember, newRole: string) => {
  try {
    await spacesApi.updateMember(spaceId.value, member.user_id, {
      role: newRole as 'admin' | 'member',
    })
    message.success('Role updated successfully')
    await loadSpaceDetail()
  } catch (e: any) {
    message.error(e?.error?.message || 'Failed to update role')
  }
}

const handleRemoveMember = async (member: SpaceMember) => {
  try {
    await spacesApi.removeMember(spaceId.value, member.user_id)
    message.success('Member removed successfully')
    await loadSpaceDetail()
  } catch (e: any) {
    message.error(e?.error?.message || 'Failed to remove member')
  }
}

const handleRemoveMemory = async (memory: any) => {
  try {
    await spacesApi.removeMember(spaceId.value, memory.id)
    message.success('Memory removed successfully')
    await loadMemories()
  } catch (e: any) {
    message.error(e?.error?.message || 'Failed to remove memory')
  }
}

const handleEdit = () => {
  router.push(`/spaces/${spaceId.value}/edit`)
}

const handleDelete = () => {
  message.info('Delete functionality not implemented yet')
}

const viewMemoryDetail = (memory: any) => {
  router.push(`/memories/${memory.id}`)
}

onMounted(() => {
  loadSpaceDetail()
  loadMemories()
})
</script>

<style scoped>
.text-gray {
  color: #999;
}
</style>
