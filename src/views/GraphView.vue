<template>
  <a-layout class="graph-view">
    <a-layout-sider width="300" class="filter-sider">
      <a-card title="筛选器" :bordered="false">
        <a-form layout="vertical">
          <a-form-item label="中心节点">
            <a-select
              v-model:value="filters.centerNode"
              show-search
              placeholder="选择记忆作为中心"
              :filter-option="filterOption"
            >
              <a-select-option v-for="mem in memories" :key="mem.id" :value="mem.id">
                {{ mem.content.substring(0, 30) }}{{ mem.content.length > 30 ? '...' : '' }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="关联深度">
            <a-slider
              v-model:value="filters.depth"
              :min="1"
              :max="3"
              :marks="{ 1: '1', 2: '2', 3: '3' }"
            />
          </a-form-item>

          <a-form-item label="分类">
            <a-select v-model:value="filters.categories" mode="multiple" placeholder="选择分类">
              <a-select-option value="work">工作</a-select-option>
              <a-select-option value="personal">个人</a-select-option>
              <a-select-option value="project">项目</a-select-option>
              <a-select-option value="idea">想法</a-select-option>
              <a-select-option value="meeting">会议</a-select-option>
              <a-select-option value="document">文档</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="层级">
            <a-select v-model:value="filters.tiers" mode="multiple" placeholder="选择层级">
              <a-select-option value="L0">L0 (核心)</a-select-option>
              <a-select-option value="L1">L1 (工作)</a-select-option>
              <a-select-option value="L2">L2 (外围)</a-select-option>
              <a-select-option value="L3">L3 (归档)</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="关系类型">
            <a-checkbox-group v-model:value="filters.relationTypes">
              <a-checkbox value="reference">引用</a-checkbox>
              <a-checkbox value="similar">相似</a-checkbox>
              <a-checkbox value="provenance">溯源</a-checkbox>
            </a-checkbox-group>
          </a-form-item>

          <a-form-item>
            <a-button type="primary" block @click="loadGraph">应用筛选</a-button>
          </a-form-item>
        </a-form>
      </a-card>
    </a-layout-sider>

    <a-layout-content class="graph-content">
      <div class="toolbar">
        <a-space :size="8">
          <a-button @click="fitView">
            <FullscreenOutlined /> 适应画布
          </a-button>
          <a-button @click="resetLayout">
            <ReloadOutlined /> 重置布局
          </a-button>
          <a-button @click="exportPNG">
            <DownloadOutlined /> 导出PNG
          </a-button>
          <a-button @click="toggleFullscreen">
            <ExpandOutlined /> 全屏
          </a-button>
        </a-space>
      </div>

      <div ref="graphContainer" class="graph-container"></div>

      <a-spin :spinning="graphLoading" tip="加载图谱中..." />
    </a-layout-content>

    <a-drawer
      v-model:open="detailVisible"
      title="记忆详情"
      placement="right"
      width="400"
    >
      <template v-if="selectedNode">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="内容">
            <div style="max-height: 200px; overflow-y: auto">
              {{ selectedNode.content }}
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="分类">
            <a-tag :color="getCategoryColor(selectedNode.category)">
              {{ selectedNode.category }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="层级">
            <a-tag :color="getTierColor(selectedNode.tier)">
              {{ selectedNode.tier }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="关联数量">
            {{ selectedNode.size }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider />

        <h4>关联统计</h4>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-card size="small">
              <a-statistic
                title="引用"
                :value="relations?.references.length || 0"
              />
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card size="small">
              <a-statistic
                title="被引用"
                :value="relations?.referenced_by.length || 0"
              />
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card size="small">
              <a-statistic
                title="相似"
                :value="relations?.similar.length || 0"
              />
            </a-card>
          </a-col>
        </a-row>

        <a-divider />

        <h4>关联列表</h4>
        <a-list
          :data-source="relationsList"
          size="small"
          :loading="relationsLoading"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-tag :color="getRelationColor(item.type)">
                {{ getRelationLabel(item.type) }}
              </a-tag>
              <span style="margin-left: 8px">
                {{ item.content.substring(0, 50) }}{{ item.content.length > 50 ? '...' : '' }}
              </span>
            </a-list-item>
          </template>
        </a-list>
      </template>
    </a-drawer>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { Graph } from '@antv/g6'
import {
  FullscreenOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ExpandOutlined
} from '@ant-design/icons-vue'
import { getGraphData, getMemoryRelations, getMemoryOptions, type GraphNode, type MemoryRelations } from '@/api/graph'

const graphContainer = ref<HTMLElement | null>(null)
let graph: Graph | null = null

const graphLoading = ref(false)
const relationsLoading = ref(false)
const detailVisible = ref(false)
const selectedNode = ref<GraphNode | null>(null)
const relations = ref<MemoryRelations | null>(null)
const memories = ref<Array<{ id: string; content: string }>>([])

const filters = reactive({
  centerNode: undefined as string | undefined,
  depth: 2,
  categories: [] as string[],
  tiers: [] as string[],
  relationTypes: ['reference', 'similar', 'provenance'] as string[]
})

const relationsList = computed(() => {
  if (!relations.value) return []
  const list: Array<{ type: string; content: string; memory_id: string }> = []
  
  for (const id of relations.value.references) {
    list.push({ type: 'reference', content: id, memory_id: id })
  }
  for (const item of relations.value.similar) {
    list.push({ type: 'similar', content: item.memory_id, memory_id: item.memory_id })
  }
  if (relations.value.provenance.parent_id) {
    list.push({ type: 'provenance', content: relations.value.provenance.parent_id, memory_id: relations.value.provenance.parent_id })
  }
  for (const id of relations.value.provenance.children) {
    list.push({ type: 'provenance', content: id, memory_id: id })
  }
  
  return list
})

const categoryColors: Record<string, string> = {
  work: '#1890ff',
  personal: '#52c41a',
  project: '#722ed1',
  idea: '#faad14',
  meeting: '#f5222d',
  document: '#13c2c2'
}

const tierColors: Record<string, string> = {
  L0: '#1890ff',
  L1: '#52c41a',
  L2: '#faad14',
  L3: '#f5222d'
}

const relationColors: Record<string, string> = {
  reference: '#1890ff',
  similar: '#faad14',
  provenance: '#722ed1'
}

function getCategoryColor(category: string): string {
  return categoryColors[category] || '#d9d9d9'
}

function getTierColor(tier: string): string {
  return tierColors[tier] || '#d9d9d9'
}

function getRelationColor(type: string): string {
  return relationColors[type] || '#d9d9d9'
}

function getRelationLabel(type: string): string {
  const labels: Record<string, string> = {
    reference: '引用',
    similar: '相似',
    provenance: '溯源'
  }
  return labels[type] || type
}

function filterOption(input: string, option: any): boolean {
  return option.children[0].children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

async function loadMemories() {
  try {
    memories.value = await getMemoryOptions()
  } catch (e) {
    console.error('Failed to load memories:', e)
  }
}

async function loadGraph() {
  if (!graph) return
  
  graphLoading.value = true
  try {
    const params: any = {
      depth: filters.depth
    }
    if (filters.centerNode) params.memory_id = filters.centerNode
    if (filters.categories.length) params.categories = filters.categories
    if (filters.tiers.length) params.tiers = filters.tiers
    if (filters.relationTypes.length) params.relation_types = filters.relationTypes

    const data = await getGraphData(params)
    graph.setData({
      nodes: data.nodes.map(n => ({ ...n })),
      edges: data.edges.map(e => ({ ...e }))
    })
    graph.render()
  } catch (e: any) {
    console.error('Failed to load graph:', e)
  } finally {
    graphLoading.value = false
  }
}

function initGraph() {
  if (!graphContainer.value) return

  const container = graphContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  graph = new Graph({
    container,
    width,
    height,
    layout: {
      type: 'force',
      preventOverlap: true,
      linkDistance: 150,
      nodeStrength: -30,
      edgeStrength: 0.1
    },
    node: {
      style: {
        size: 40,
        fill: '#5B8FF9',
        stroke: '#5B8FF9',
        lineWidth: 2
      }
    },
    edge: {
      style: {
        stroke: '#e2e2e2',
        lineWidth: 2
      }
    }
  })

  graph.on('node:click', async (evt: any) => {
    const node = evt.item
    const model = node.getModel() as GraphNode
    selectedNode.value = model
    detailVisible.value = true
    
    relationsLoading.value = true
    try {
      relations.value = await getMemoryRelations(model.id)
    } catch (e) {
      console.error('Failed to load relations:', e)
      relations.value = null
    } finally {
      relationsLoading.value = false
    }
  })

  graph.on('node:dblclick', (evt: any) => {
    const node = evt.item
    const model = node.getModel() as GraphNode
    filters.centerNode = model.id
    loadGraph()
  })

  graph.on('canvas:click', () => {
    detailVisible.value = false
  })
}

function fitView() {
  graph?.fitView()
}

function resetLayout() {
  graph?.setLayout({
    type: 'force',
    preventOverlap: true,
    linkDistance: 150,
    nodeStrength: -30,
    edgeStrength: 0.1
  })
  graph?.layout()
}

function exportPNG() {
  if (!graph) return
  graph.toDataURL({ type: 'image/png' }).then((dataURL: string) => {
    const link = document.createElement('a')
    link.download = 'graph.png'
    link.href = dataURL
    link.click()
  })
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    graphContainer.value?.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function handleResize() {
  if (!graph || !graphContainer.value) return
  const width = graphContainer.value.clientWidth
  const height = graphContainer.value.clientHeight
  graph.resize(width, height)
}

onMounted(() => {
  initGraph()
  loadMemories()
  loadGraph()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  graph?.destroy()
})
</script>

<style scoped>
.graph-view {
  height: calc(100vh - 64px);
  background: #f0f2f5;
}

.filter-sider {
  background: #fff;
  padding: 16px;
  overflow-y: auto;
}

.graph-content {
  position: relative;
  background: #fff;
  margin: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background: #fff;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.graph-container {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 96px);
}
</style>
