export type Category = 'profile' | 'preferences' | 'entities' | 'events' | 'cases' | 'patterns'
export type MemoryType = 'pinned' | 'insight' | 'session'
export type MemoryState = 'active' | 'archived' | 'deleted'
export type Tier = 'core' | 'working' | 'peripheral'
export type RelationType = 'supersedes' | 'contextualizes' | 'supports' | 'contradicts'

export interface MemoryRelation {
  relation_type: RelationType
  target_id: string
  context_label: string | null
}

export interface Provenance {
  shared_from_space: string
  shared_from_memory: string
  shared_by_user: string
  shared_by_agent: string
  shared_at: string
  original_created_at: string
  source_version: number
}

export interface Memory {
  id: string
  content: string
  l0_abstract: string
  l1_overview: string
  l2_content: string
  category: Category
  memory_type: MemoryType
  state: MemoryState
  tier: Tier
  importance: number
  confidence: number
  access_count: number
  tags: string[]
  scope: string
  agent_id: string | null
  session_id: string | null
  tenant_id: string
  source: string | null
  relations: MemoryRelation[]
  superseded_by: string | null
  invalidated_at: string | null
  created_at: string
  updated_at: string
  last_accessed_at: string | null
  space_id: string
  visibility: string
  owner_agent_id: string
  provenance: Provenance | null
  version: number | null
}
