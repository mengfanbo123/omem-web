<template>
  <div class="memory-detail">
    <!-- 顶部导航 -->
    <div class="detail-header">
      <a-button type="text" class="back-btn" @click="handleBack">
        <template #icon>
          <ArrowLeftOutlined />
        </template>
        <span>返回</span>
      </a-button>
      <h1 class="detail-title">记忆详情</h1>
      <a-space class="detail-actions">
        <a-button @click="showShareModal">
          <template #icon><ShareAltOutlined /></template>
          Share to Space
        </a-button>
        <a-button @click="showPullModal">
          <template #icon><DownloadOutlined /></template>
          Pull from Space
        </a-button>
        <a-button v-if="memoryShares.length > 0" @click="showReshareModal">
          <template #icon><RetweetOutlined /></template>
          Reshare
        </a-button>
      </a-space>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <a-spin size="large" />
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <a-alert
      v-else-if="error"
      type="error"
      message="加载失败"
      :description="error"
      show-icon
      class="error-alert"
    >
      <template #action>
        <a-button size="small" @click="fetchMemory">重试</a-button>
      </template>
    </a-alert>

    <!-- 记忆内容 -->
    <div v-else-if="memory" class="detail-content">
      <!-- 记忆摘要卡片 -->
      <a-card class="summary-card" :bordered="false">
        <div class="summary-header">
          <a-tag :color="getCategoryColor(memory.category)">
            {{ getCategoryLabel(memory.category) }}
          </a-tag>
          <a-tag :color="getTierColor(memory.tier)">
            {{ getTierLabel(memory.tier) }}
          </a-tag>
          <a-tag :color="getStateColor(memory.state)">
            {{ getStateLabel(memory.state) }}
          </a-tag>
        </div>
        <div class="summary-content">
          <p class="memory-content">{{ memory.content }}</p>
        </div>
        <div class="summary-meta">
          <span class="meta-item">
            <EyeOutlined /> 访问 {{ memory.access_count }} 次
          </span>
          <span class="meta-item">
            <StarOutlined /> 重要性 {{ memory.importance }}
          </span>
          <span class="meta-item">
            <CheckCircleOutlined /> 置信度 {{ memory.confidence }}
          </span>
        </div>
      </a-card>

      <!-- L0/L1/L2 切换 -->
      <a-tabs v-model:activeKey="activeTab" class="detail-tabs">
        <a-tab-pane key="l0" tab="L0 抽象">
          <a-card :bordered="false" class="tab-content-card">
            <div class="abstract-content">
              <h3>摘要</h3>
              <p>{{ memory.l0_abstract || '暂无 L0 摘要' }}</p>
            </div>
          </a-card>
        </a-tab-pane>
        <a-tab-pane key="l1" tab="L1 概述">
          <a-card :bordered="false" class="tab-content-card">
            <div class="abstract-content">
              <h3>概述</h3>
              <p>{{ memory.l1_overview || '暂无 L1 概述' }}</p>
            </div>
          </a-card>
        </a-tab-pane>
        <a-tab-pane key="l2" tab="L2 原文">
          <a-card :bordered="false" class="tab-content-card">
            <div class="abstract-content">
              <h3>详细内容</h3>
              <p>{{ memory.l2_content || '暂无 L2 内容' }}</p>
            </div>
          </a-card>
        </a-tab-pane>
      </a-tabs>

      <!-- 详细信息 -->
      <a-card title="基本信息" :bordered="false" class="info-card">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="记忆ID">
            <a-typography-text copyable>{{ memory.id }}</a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item label="类型">
            <a-tag>{{ memory.memory_type }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="标签">
            <a-tag v-for="tag in memory.tags" :key="tag" color="blue">{{ tag }}</a-tag>
            <span v-if="!memory.tags?.length">无</span>
          </a-descriptions-item>
          <a-descriptions-item label="范围">{{ memory.scope || '无' }}</a-descriptions-item>
          <a-descriptions-item label="来源" :span="2">{{ memory.source || '无' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="分类信息" :bordered="false" class="info-card">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="分类">
            <a-tag :color="getCategoryColor(memory.category)">
              {{ getCategoryLabel(memory.category) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="层级">
            <a-tag :color="getTierColor(memory.tier)">
              {{ getTierLabel(memory.tier) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStateColor(memory.state)">
              {{ getStateLabel(memory.state) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="重要性">
            <a-rate :value="memory.importance" disabled :max="5" />
          </a-descriptions-item>
          <a-descriptions-item label="置信度">
            <a-progress :percent="memory.confidence * 100" :format="(p: number) => `${p}%`" size="small" />
          </a-descriptions-item>
          <a-descriptions-item label="访问次数">{{ memory.access_count }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="时间信息" :bordered="false" class="info-card">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="创建时间">
            {{ formatDate(memory.created_at) }}
          </a-descriptions-item>
          <a-descriptions-item label="更新时间">
            {{ formatDate(memory.updated_at) }}
          </a-descriptions-item>
          <a-descriptions-item label="最后访问">
            {{ memory.last_accessed_at ? formatDate(memory.last_accessed_at) : '从未访问' }}
          </a-descriptions-item>
          <a-descriptions-item label="失效时间">
            {{ memory.invalidated_at ? formatDate(memory.invalidated_at) : '未失效' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="关系信息" :bordered="false" class="info-card">
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item label="替代关系">
            <template v-if="memory.superseded_by">
              <a-tag color="orange">被替代</a-tag>
              <span>{{ memory.superseded_by }}</span>
            </template>
            <span v-else>无</span>
          </a-descriptions-item>
          <a-descriptions-item label="关联记忆">
            <template v-if="memory.relations?.length">
              <div class="relations-list">
                <div v-for="rel in memory.relations" :key="rel.target_id" class="relation-item">
                  <a-tag :color="getRelationColor(rel.relation_type)">
                    {{ getRelationLabel(rel.relation_type) }}
                  </a-tag>
                  <span class="relation-target">{{ rel.target_id }}</span>
                  <span v-if="rel.context_label" class="relation-context">
                    ({{ rel.context_label }})
                  </span>
                </div>
              </div>
            </template>
            <span v-else>无</span>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="来源信息" :bordered="false" class="info-card">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="空间ID">
            <a-typography-text copyable>{{ memory.space_id }}</a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item label="可见性">{{ memory.visibility }}</a-descriptions-item>
          <a-descriptions-item label="租户ID">
            <a-typography-text copyable>{{ memory.tenant_id }}</a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item label="所有者Agent">
            <a-typography-text copyable>{{ memory.owner_agent_id }}</a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item label="Agent ID">
            {{ memory.agent_id || '无' }}
          </a-descriptions-item>
          <a-descriptions-item label="会话ID">
            {{ memory.session_id || '无' }}
          </a-descriptions-item>
          <a-descriptions-item label="版本">
            {{ memory.version ?? '无' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 溯源信息 -->
      <a-card
        v-if="memory.provenance"
        title="溯源信息"
        :bordered="false"
        class="info-card"
      >
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="来源空间">
            {{ memory.provenance.shared_from_space }}
          </a-descriptions-item>
          <a-descriptions-item label="来源记忆">
            {{ memory.provenance.shared_from_memory }}
          </a-descriptions-item>
          <a-descriptions-item label="分享者">
            {{ memory.provenance.shared_by_user }}
          </a-descriptions-item>
          <a-descriptions-item label="分享Agent">
            {{ memory.provenance.shared_by_agent }}
          </a-descriptions-item>
          <a-descriptions-item label="分享时间">
            {{ formatDate(memory.provenance.shared_at) }}
          </a-descriptions-item>
          <a-descriptions-item label="原始创建时间">
            {{ formatDate(memory.provenance.original_created_at) }}
          </a-descriptions-item>
          <a-descriptions-item label="来源版本" :span="2">
            {{ memory.provenance.source_version }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>
    </div>

    <!-- Share Modal -->
    <a-modal v-model:open="shareModalVisible" title="Share to Space" @ok="handleShare">
      <a-form :model="shareForm" layout="vertical">
        <a-form-item label="Target Space" required>
          <a-select v-model:value="shareForm.space_id" placeholder="Select a space">
            <a-select-option v-for="space in spaces" :key="space.id" :value="space.id">
              {{ space.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Visibility" required>
          <a-radio-group v-model:value="shareForm.visibility">
            <a-radio value="private">Private</a-radio>
            <a-radio value="team">Team</a-radio>
            <a-radio value="public">Public</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Pull Modal -->
    <a-modal v-model:open="pullModalVisible" title="Pull from Space" @ok="handlePull">
      <a-form :model="pullForm" layout="vertical">
        <a-form-item label="Source Space" required>
          <a-select v-model:value="pullForm.space_id" placeholder="Select a space" @change="loadSpaceMemories">
            <a-select-option v-for="space in spaces" :key="space.id" :value="space.id">
              {{ space.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Memory" required>
          <a-select v-model:value="pullForm.memory_id" placeholder="Select a memory">
            <a-select-option v-for="mem in spaceMemories" :key="mem.id" :value="mem.id">
              {{ (mem.l0_abstract || mem.content).substring(0, 50) }}...
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Visibility" required>
          <a-radio-group v-model:value="pullForm.visibility">
            <a-radio value="private">Private</a-radio>
            <a-radio value="team">Team</a-radio>
            <a-radio value="public">Public</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Reshare Modal -->
    <a-modal v-model:open="reshareModalVisible" title="Reshare Memory" @ok="handleReshare">
      <a-alert type="info" message="Current Shares" style="margin-bottom: 16px">
        <template #description>
          <ul>
            <li v-for="share in memoryShares" :key="share.space_id">
              {{ share.space_name }} ({{ share.visibility }})
            </li>
          </ul>
        </template>
      </a-alert>
      <a-form :model="reshareForm" layout="vertical">
        <a-form-item label="Target Space" required>
          <a-select v-model:value="reshareForm.target_space_id" placeholder="Select a space">
            <a-select-option v-for="space in spaces" :key="space.id" :value="space.id">
              {{ space.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { memoriesApi } from '@/api/memories'
import { spacesApi } from '@/api/spaces'
import type { Memory } from '@/types/memory'
import type { Category, MemoryState, Tier, RelationType } from '@/types/memory'
import {
  ArrowLeftOutlined,
  EyeOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  RetweetOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()

const memory = ref<Memory | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref('l0')

// 共享相关状态
const shareModalVisible = ref(false)
const pullModalVisible = ref(false)
const reshareModalVisible = ref(false)

const shareForm = reactive({
  space_id: '',
  visibility: 'private' as 'private' | 'team' | 'public'
})

const pullForm = reactive({
  space_id: '',
  memory_id: '',
  visibility: 'private' as 'private' | 'team' | 'public'
})

const reshareForm = reactive({
  target_space_id: ''
})

const spaces = ref<any[]>([])
const spaceMemories = ref<any[]>([])
const memoryShares = ref<any[]>([])

// 获取记忆详情
async function fetchMemory() {
  const id = route.params.id as string
  if (!id) {
    error.value = '记忆ID不存在'
    return
  }

  loading.value = true
  error.value = null

  try {
    memory.value = await memoriesApi.get(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载记忆详情失败'
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 加载空间列表
async function loadSpaces() {
  try {
    const response = await spacesApi.list()
    spaces.value = response.spaces
  } catch (err) {
    message.error('加载空间列表失败')
  }
}

// 加载空间记忆列表
async function loadSpaceMemories() {
  if (!pullForm.space_id) return
  try {
    const response = await spacesApi.getMemories(pullForm.space_id, { limit: 100 })
    spaceMemories.value = response.memories
  } catch (err) {
    message.error('加载空间记忆列表失败')
  }
}

// 显示分享弹窗
async function showShareModal() {
  shareForm.space_id = ''
  shareForm.visibility = 'private'
  await loadSpaces()
  shareModalVisible.value = true
}

// 显示拉取弹窗
async function showPullModal() {
  pullForm.space_id = ''
  pullForm.memory_id = ''
  pullForm.visibility = 'private'
  spaceMemories.value = []
  await loadSpaces()
  pullModalVisible.value = true
}

// 显示重新分享弹窗
async function showReshareModal() {
  reshareForm.target_space_id = ''
  await loadSpaces()
  reshareModalVisible.value = true
}

// 处理分享
async function handleShare() {
  if (!shareForm.space_id) {
    message.error('请选择目标空间')
    return
  }
  try {
    await spacesApi.shareMemory(shareForm.space_id, memory.value!.id, {
      visibility: shareForm.visibility
    })
    message.success('分享成功')
    shareModalVisible.value = false
    fetchMemoryShares()
  } catch (err: any) {
    message.error(err?.error?.message || '分享失败')
  }
}

// 处理拉取
async function handlePull() {
  if (!pullForm.space_id || !pullForm.memory_id) {
    message.error('请选择源空间和记忆')
    return
  }
  try {
    await spacesApi.pullMemory(pullForm.space_id, {
      memory_id: pullForm.memory_id,
      visibility: pullForm.visibility
    })
    message.success('拉取成功')
    pullModalVisible.value = false
  } catch (err: any) {
    message.error(err?.error?.message || '拉取失败')
  }
}

// 处理重新分享
async function handleReshare() {
  if (!reshareForm.target_space_id) {
    message.error('请选择目标空间')
    return
  }
  try {
    await spacesApi.reshareMemory(memory.value!.space_id, memory.value!.id, {
      target_space_id: reshareForm.target_space_id
    })
    message.success('重新分享成功')
    reshareModalVisible.value = false
    fetchMemoryShares()
  } catch (err: any) {
    message.error(err?.error?.message || '重新分享失败')
  }
}

// 获取记忆的共享状态
async function fetchMemoryShares() {
  if (!memory.value) return
  try {
    memoryShares.value = await spacesApi.getMemoryShares(memory.value.id)
  } catch (err) {
    memoryShares.value = []
  }
}

// 返回上一页
function handleBack() {
  router.back()
}

// 格式化日期
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '无'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

// 获取分类颜色
function getCategoryColor(category: Category): string {
  const colors: Record<Category, string> = {
    profile: 'purple',
    preferences: 'cyan',
    entities: 'blue',
    events: 'green',
    cases: 'orange',
    patterns: 'magenta',
  }
  return colors[category] || 'default'
}

// 获取分类标签
function getCategoryLabel(category: Category): string {
  const labels: Record<Category, string> = {
    profile: '画像',
    preferences: '偏好',
    entities: '实体',
    events: '事件',
    cases: '案例',
    patterns: '模式',
  }
  return labels[category] || category
}

// 获取层级颜色
function getTierColor(tier: Tier): string {
  const colors: Record<Tier, string> = {
    core: 'red',
    working: 'orange',
    peripheral: 'blue',
  }
  return colors[tier] || 'default'
}

// 获取层级标签
function getTierLabel(tier: Tier): string {
  const labels: Record<Tier, string> = {
    core: '核心',
    working: '工作',
    peripheral: '外围',
  }
  return labels[tier] || tier
}

// 获取状态颜色
function getStateColor(state: MemoryState): string {
  const colors: Record<MemoryState, string> = {
    active: 'green',
    archived: 'gray',
    deleted: 'red',
  }
  return colors[state] || 'default'
}

// 获取状态标签
function getStateLabel(state: MemoryState): string {
  const labels: Record<MemoryState, string> = {
    active: '活跃',
    archived: '已归档',
    deleted: '已删除',
  }
  return labels[state] || state
}

// 获取关系类型颜色
function getRelationColor(type: RelationType): string {
  const colors: Record<RelationType, string> = {
    supersedes: 'red',
    contextualizes: 'blue',
    supports: 'green',
    contradicts: 'orange',
  }
  return colors[type] || 'default'
}

// 获取关系类型标签
function getRelationLabel(type: RelationType): string {
  const labels: Record<RelationType, string> = {
    supersedes: '替代',
    contextualizes: '上下文',
    supports: '支持',
    contradicts: '矛盾',
  }
  return labels[type] || type
}

onMounted(() => {
  fetchMemory()
  fetchMemoryShares()
})
</script>

<style scoped>
.memory-detail {
  max-width: 1200px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  height: auto;
  color: rgba(0, 0, 0, 0.65);
  transition: color 0.2s;
}

.back-btn:hover {
  color: #1890ff;
}

.detail-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
}

.detail-actions {
  margin-left: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 0;
  color: rgba(0, 0, 0, 0.45);
}

.error-alert {
  margin-bottom: 24px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}

.summary-card :deep(.ant-card-body) {
  color: #fff;
}

.summary-header {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.summary-content {
  margin-bottom: 16px;
}

.memory-content {
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
  opacity: 0.95;
}

.summary-meta {
  display: flex;
  gap: 24px;
  font-size: 13px;
  opacity: 0.85;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 16px;
}

.tab-content-card {
  background: #fafafa;
  border-radius: 8px;
}

.abstract-content h3 {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 12px;
}

.abstract-content p {
  font-size: 14px;
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.65);
  margin: 0;
  white-space: pre-wrap;
}

.info-card {
  border-radius: 8px;
}

.info-card :deep(.ant-card-head) {
  min-height: 44px;
  padding: 0 16px;
}

.info-card :deep(.ant-card-head-title) {
  font-size: 15px;
  font-weight: 600;
}

.relations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.relation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.relation-target {
  font-family: monospace;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
}

.relation-context {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
