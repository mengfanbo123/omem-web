import client from './client'
import type { Memory } from '@/types/memory'

export interface ReviewHistoryItem {
  date: string
  strength_before: number
  strength_after: number
}

export interface DecayCurvePoint {
  day: number
  strength: number
}

export interface DecayData {
  memory_id: string
  current_strength: number
  review_count: number
  last_review: string
  next_review: string
  review_history: ReviewHistoryItem[]
  decay_curve: DecayCurvePoint[]
}

export interface ReviewBody {
  review_time: string
  quality: number
}

export interface MemoryOption {
  id: string
  content: string
}

export const decayApi = {
  // 获取记忆衰减数据
  async getDecayData(id: string): Promise<DecayData> {
    const { data } = await client.get<DecayData>(`/v1/memories/${id}/decay`)
    return data
  },

  // 标记复习
  async markReview(id: string, body: ReviewBody): Promise<void> {
    await client.post(`/v1/memories/${id}/review`, body)
  },

  // 获取记忆列表（用于选择器）
  async listMemories(limit: number = 100): Promise<Memory[]> {
    const { data } = await client.get<{ memories: Memory[] }>('/v1/memories', {
      params: { limit }
    })
    return data.memories
  },
}
