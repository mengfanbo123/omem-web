import client from './client'
import type { Memory } from '@/types/memory'
import type { MemoryListResponse, MemoryListParams, HealthResponse } from './types'

export interface SearchParams {
  query: string
  space_ids?: string[]
  categories?: string[]
  tiers?: string[]
  memory_types?: string[]
  states?: string[]
  tags?: string[]
  created_after?: string
  created_before?: string
  limit?: number
  offset?: number
  sort_by?: 'relevance' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

export interface SearchResult {
  memory: Memory
  score?: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
}

export const memoriesApi = {
  // 健康检查
  async health(): Promise<HealthResponse> {
    const { data } = await client.get<HealthResponse>('/health')
    return data
  },

  // 获取记忆列表
  async list(params?: MemoryListParams): Promise<MemoryListResponse> {
    const { data } = await client.get<MemoryListResponse>('/v1/memories', { params })
    return data
  },

  // 获取单个记忆
  async get(id: string): Promise<Memory> {
    const { data } = await client.get<Memory>(`/v1/memories/${id}`)
    return data
  },

  // 创建记忆
  async create(memory: Partial<Memory>): Promise<Memory> {
    const { data } = await client.post<Memory>('/v1/memories', memory)
    return data
  },

  // 更新记忆
  async update(id: string, memory: Partial<Memory>): Promise<Memory> {
    const { data } = await client.put<Memory>(`/v1/memories/${id}`, memory)
    return data
  },

  // 删除记忆
  async delete(id: string): Promise<void> {
    await client.delete(`/v1/memories/${id}`)
  },

  // 搜索记忆
  async search(params: SearchParams): Promise<SearchResponse> {
    const { data } = await client.post<SearchResponse>('/v1/memories/search', params)
    return data
  },
}
