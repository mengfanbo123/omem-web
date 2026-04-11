import client from './client'

export interface ProfileResponse {
  name: string
  email?: string
  created_at?: string
}

export const profileApi = {
  /**
   * 获取当前用户信息
   */
  async get(): Promise<ProfileResponse> {
    const { data } = await client.get<ProfileResponse>('/v1/profile')
    return data
  }
}
