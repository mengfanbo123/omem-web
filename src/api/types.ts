import type { Memory } from '@/types/memory'

export interface ApiError {
  error: {
    code: 'validation_error' | 'unauthorized' | 'not_found' | 'rate_limited' | 'internal_error' | 'UNKNOWN_ERROR'
    message: string
  }
}

export interface MemoryListResponse {
  memories: Memory[]
  total_count: number
  limit: number
  offset: number
}

export interface MemoryListParams {
  limit?: number
  offset?: number
  category?: string
  tier?: string
  tags?: string
  memory_type?: string
  state?: string
  sort?: 'created_at' | 'updated_at' | 'importance' | 'access_count'
  order?: 'asc' | 'desc'
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
}
