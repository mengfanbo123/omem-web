// Memory 类型
export interface Memory {
  id: string
  user_id: string
  space_id: string
  content: string
  content_l1: string | null
  content_l2: string | null
  embedding: number[] | null
  metadata: Record<string, any>
  tags: string[]
  source: string | null
  tier: 'core' | 'working' | 'peripheral'
  provenance: {
    origin_memory_id?: string
    origin_space_id?: string
    shared_at?: string
    shared_by?: string
  } | null
  version: number
  parent_id: string | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  accessed_at: string | null
  access_count: number
  importance_score: number | null
  decay_rate: number
  last_decay_at: string | null
  next_review_at: string | null
  review_count: number
  is_pinned: boolean
  pinned_at: string | null
  pinned_by: string | null
}

// User 类型
export interface User {
  id: string
  api_key: string
  nickname?: string
  created_at: string
}

// Space 类型
export interface Space {
  id: string
  name: string
  space_type: 'personal' | 'team' | 'org'
  owner_id: string
  created_at: string
  updated_at: string
  member_count?: number
}

// API 响应类型
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}

// 查询参数类型
export interface MemoryQueryParams {
  page?: number
  page_size?: number
  tags?: string[]
  tier?: 'core' | 'working' | 'peripheral'
  is_pinned?: boolean
  search?: string
  sort_by?: 'created_at' | 'updated_at' | 'importance_score'
  sort_order?: 'asc' | 'desc'
}
