import client from './client'

// 图谱节点
export interface GraphNode {
  id: string
  label: string
  content: string
  category: string
  tier: string
  size: number // 关联数量
}

// 图谱边
export interface GraphEdge {
  source: string
  target: string
  type: 'reference' | 'similar' | 'provenance'
  strength: number // 0-1
}

// 图谱数据
export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

// 获取关系图谱数据
export interface GraphParams {
  memory_id?: string
  depth?: number
  categories?: string[]
  tiers?: string[]
  relation_types?: string[]
}

export async function getGraphData(params?: GraphParams): Promise<GraphData> {
  const { data } = await client.get<GraphData>('/v1/graph', { params })
  return data
}

// 获取记忆关联
export interface MemoryRelations {
  references: string[] // 引用的记忆ID
  referenced_by: string[] // 被引用的记忆ID
  similar: Array<{
    memory_id: string
    similarity: number
  }>
  provenance: {
    parent_id?: string
    children: string[]
  }
}

export async function getMemoryRelations(id: string): Promise<MemoryRelations> {
  const { data } = await client.get<MemoryRelations>(`/v1/memories/${id}/relations`)
  return data
}

// 获取所有记忆列表（用于筛选器）
export interface MemoryOption {
  id: string
  content: string
}

export async function getMemoryOptions(): Promise<MemoryOption[]> {
  const { data } = await client.get<{ memories: MemoryOption[] }>('/v1/memories', {
    params: { limit: 1000 }
  })
  return data.memories || []
}
