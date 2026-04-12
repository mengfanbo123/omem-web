import client from './client'

// 上传响应
export interface UploadResponse {
  file_id: string
  filename: string
  size: number
  records: number
}

// 导入请求体
export interface ImportBody {
  file_id: string
  space_id: string
  category: string
  tier: string
  memory_type: string
  auto_summarize: boolean
  tags?: string[]
}

// 导入错误详情
export interface ImportError {
  index: number
  content: string
  error: string
}

// 导入结果
export interface ImportResult {
  success_count: number
  failed_count: number
  errors: ImportError[]
}

  // 导入历史记录
  export interface ImportHistory {
    id: string
    filename: string
    records: number
    success_count: number
    failed_count: number
    created_at: string
  }

  // 导入历史参数
  export interface ImportHistoryParams {
    start_date?: string
    end_date?: string
    status?: 'all' | 'success' | 'partial' | 'failed'
    limit?: number
    offset?: number
  }

  // 导入历史详情（包含错误列表）
  export interface ImportHistoryDetail extends ImportHistory {
    errors?: ImportError[]
  }

  // 导入统计
  export interface ImportStats {
    total_imports: number
    total_records: number
    total_success: number
    avg_success_rate: number
  }

  export const importApi = {
    // 上传文件
    async upload(file: File): Promise<UploadResponse> {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await client.post<UploadResponse>('/v1/import/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return data
    },

    // 执行导入
    async execute(body: ImportBody): Promise<ImportResult> {
      const { data } = await client.post<ImportResult>('/v1/import/execute', body)
      return data
    },

    // 获取导入历史
    async getHistory(params?: ImportHistoryParams): Promise<ImportHistory[]> {
      const { data } = await client.get<ImportHistory[]>('/v1/import/history', { params })
      return data
    },

    // 获取导入历史详情
    async getHistoryDetail(id: string): Promise<ImportHistoryDetail> {
      const { data } = await client.get<ImportHistoryDetail>(`/v1/import/history/${id}`)
      return data
    },

    // 重新导入失败记录
    async retryImport(id: string): Promise<{ success: boolean; message: string }> {
      const { data } = await client.post<{ success: boolean; message: string }>(`/v1/import/retry/${id}`)
      return data
    },

    // 删除历史记录
    async deleteHistory(id: string): Promise<{ success: boolean; message: string }> {
      const { data } = await client.delete<{ success: boolean; message: string }>(`/v1/import/history/${id}`)
      return data
    },

    // 获取导入统计
    async getStats(): Promise<ImportStats> {
      const { data } = await client.get<ImportStats>('/v1/import/stats')
      return data
    }
  }
