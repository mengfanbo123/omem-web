import type { Category, Tier, MemoryType, MemoryState } from '@/types/memory'

export const CATEGORY_LABELS: Record<Category, string> = {
  profile: '个人资料',
  preferences: '偏好设置',
  entities: '实体',
  events: '事件',
  cases: '案例',
  patterns: '模式'
}

export const TIER_LABELS: Record<Tier, string> = {
  core: '核心',
  working: '工作',
  peripheral: '外围'
}

export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  pinned: '置顶',
  insight: '洞察',
  session: '会话'
}

export const STATE_LABELS: Record<MemoryState, string> = {
  active: '活跃',
  archived: '已归档',
  deleted: '已删除'
}

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  label,
  value
}))

export const TIER_OPTIONS = Object.entries(TIER_LABELS).map(([value, label]) => ({
  label,
  value
}))

export const MEMORY_TYPE_OPTIONS = Object.entries(MEMORY_TYPE_LABELS).map(([value, label]) => ({
  label,
  value
}))

export const STATE_OPTIONS = Object.entries(STATE_LABELS).map(([value, label]) => ({
  label,
  value
}))
