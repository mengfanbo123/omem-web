export type SpaceType = 'personal' | 'team' | 'organization'

export interface Space {
  id: string
  name: string
  space_type: SpaceType
  description?: string
  member_count: number
  memory_count: number
  created_at: string
  updated_at: string
}

export interface CreateSpaceBody {
  name: string
  space_type: 'team' | 'organization'
  description?: string
}

export interface UpdateSpaceBody {
  name?: string
  description?: string
}

export interface SpaceListResponse {
  spaces: Space[]
  total: number
}

export interface SpaceListParams {
  space_type?: SpaceType
  search?: string
  limit?: number
  offset?: number
}
