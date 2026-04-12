import client from './client'

// GET /v1/statistics/overview - 获取概览数据
export interface OverviewStats {
  total_memories: number
  active_memories: number
  archived_memories: number
  deleted_memories: number
  today_new: number
  l0_count: number
  l1_count: number
  l2_count: number
  l3_count: number
  personal_spaces: number
  team_spaces: number
  organization_spaces: number
  shared_memories: number
}

// GET /v1/statistics/trend?days=30 - 获取趋势数据
export interface TrendData {
  date: string
  count: number
}

// GET /v1/statistics/distribution - 获取分布数据
export interface DistributionStats {
  by_category: Record<string, number>
  by_tier: Record<string, number>
  by_state: Record<string, number>
}

// GET /v1/statistics/growth?days=30 - 增长趋势数据
export interface GrowthData {
  date: string
  new_count: number
  total_count: number
}

// GET /v1/statistics/heatmap?days=365 - 活跃度热力图
export interface HeatmapData {
  date: string
  count: number
}

// GET /v1/statistics/tags?limit=100 - 标签统计
export interface TagStats {
  tag: string
  count: number
}

// GET /v1/statistics/spaces - 空间分布
export interface SpaceStats {
  space_id: string
  space_name: string
  l0_count: number
  l1_count: number
  l2_count: number
  l3_count: number
}

export const statisticsApi = {
  // 获取概览数据
  getOverview: async (): Promise<OverviewStats> => {
    const response = await client.get('/v1/statistics/overview')
    return response.data
  },

  // 获取趋势数据
  getTrend: async (days: number = 30): Promise<TrendData[]> => {
    const response = await client.get('/v1/statistics/trend', {
      params: { days }
    })
    return response.data
  },

  // 获取分布数据
  getDistribution: async (): Promise<DistributionStats> => {
    const response = await client.get('/v1/statistics/distribution')
    return response.data
  },

  // 获取增长趋势数据
  getGrowth: async (days: number = 30): Promise<GrowthData[]> => {
    const response = await client.get('/v1/statistics/growth', {
      params: { days }
    })
    return response.data
  },

  // 获取活跃度热力图
  getHeatmap: async (days: number = 365): Promise<HeatmapData[]> => {
    const response = await client.get('/v1/statistics/heatmap', {
      params: { days }
    })
    return response.data
  },

  // 获取标签统计
  getTags: async (limit: number = 100): Promise<TagStats[]> => {
    const response = await client.get('/v1/statistics/tags', {
      params: { limit }
    })
    return response.data
  },

  // 获取空间分布
  getSpaces: async (): Promise<SpaceStats[]> => {
    const response = await client.get('/v1/statistics/spaces')
    return response.data
  }
}
