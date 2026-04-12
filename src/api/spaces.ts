import client from './client'
import type { Space, CreateSpaceBody, UpdateSpaceBody, SpaceListResponse, SpaceListParams } from '@/types/space'

export type { Space }

// Space 成员相关类型
export interface SpaceMember {
  user_id: string
  username: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}

// Space 详情
export interface SpaceDetail extends Space {
  members: SpaceMember[]
}

// 添加成员
export interface AddMemberBody {
  user_id: string
  role: 'admin' | 'member'
}

// 修改成员角色
export interface UpdateMemberBody {
  role: 'admin' | 'member'
}

// 空间记忆列表
export interface SpaceMemoriesParams {
  category?: string
  tier?: string
  creator?: string
  limit?: number
  offset?: number
}

export interface SpaceMemoriesResponse {
  memories: any[]
  total: number
}

// 记忆共享相关类型
export interface ShareMemoryBody {
  visibility: 'private' | 'team' | 'public'
}

export interface PullMemoryBody {
  memory_id: string
  visibility: 'private' | 'team' | 'public'
}

export interface ReshareMemoryBody {
  target_space_id: string
}

export interface MemoryShare {
  space_id: string
  space_name: string
  visibility: string
  shared_at: string
}

export const spacesApi = {
  // 获取空间列表
  async list(params?: SpaceListParams): Promise<SpaceListResponse> {
    const { data } = await client.get<SpaceListResponse>('/v1/spaces', { params })
    return data
  },

  // 获取单个空间
  async get(id: string): Promise<Space> {
    const { data } = await client.get<Space>(`/v1/spaces/${id}`)
    return data
  },

  // 创建空间
  async create(space: CreateSpaceBody): Promise<Space> {
    const { data } = await client.post<Space>('/v1/spaces', space)
    return data
  },

  // 更新空间
  async update(id: string, space: UpdateSpaceBody): Promise<Space> {
    const { data } = await client.put<Space>(`/v1/spaces/${id}`, space)
    return data
  },

  // 删除空间
  async delete(id: string): Promise<void> {
    await client.delete(`/v1/spaces/${id}`)
  },

  // 获取空间详情（包含成员）
  async getDetail(id: string): Promise<SpaceDetail> {
    const { data } = await client.get<SpaceDetail>(`/v1/spaces/${id}`)
    return data
  },

  // 添加成员
  async addMember(spaceId: string, body: AddMemberBody): Promise<SpaceMember> {
    const { data } = await client.post<SpaceMember>(`/v1/spaces/${spaceId}/members`, body)
    return data
  },

  // 更新成员角色
  async updateMember(spaceId: string, userId: string, body: UpdateMemberBody): Promise<SpaceMember> {
    const { data } = await client.put<SpaceMember>(`/v1/spaces/${spaceId}/members/${userId}`, body)
    return data
  },

  // 移除成员
  async removeMember(spaceId: string, userId: string): Promise<void> {
    await client.delete(`/v1/spaces/${spaceId}/members/${userId}`)
  },

  // 获取空间记忆列表
  async getMemories(spaceId: string, params?: SpaceMemoriesParams): Promise<SpaceMemoriesResponse> {
    const { data } = await client.get<SpaceMemoriesResponse>(`/v1/spaces/${spaceId}/memories`, { params })
    return data
  },

  // 分享记忆到空间
  async shareMemory(spaceId: string, memoryId: string, body: ShareMemoryBody): Promise<void> {
    await client.post(`/v1/spaces/${spaceId}/memories/${memoryId}/share`, body)
  },

  // 从空间拉取记忆
  async pullMemory(spaceId: string, body: PullMemoryBody): Promise<void> {
    await client.post(`/v1/spaces/${spaceId}/memories/pull`, body)
  },

  // 重新分享记忆
  async reshareMemory(spaceId: string, memoryId: string, body: ReshareMemoryBody): Promise<void> {
    await client.post(`/v1/spaces/${spaceId}/memories/${memoryId}/reshare`, body)
  },

  // 获取记忆的共享状态
  async getMemoryShares(memoryId: string): Promise<MemoryShare[]> {
    const { data } = await client.get<MemoryShare[]>(`/v1/memories/${memoryId}/shares`)
    return data
  },
}
