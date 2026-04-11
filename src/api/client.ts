import axios, { AxiosInstance, AxiosError } from 'axios'
import type { ApiError } from './types'

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：注入 API Key
client.interceptors.request.use(
  (config) => {
    const apiKey = localStorage.getItem('current_api_key')
    if (!apiKey) {
      return Promise.reject({
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'API Key not configured',
        },
      })
    }
    config.headers['X-API-Key'] = apiKey
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一错误处理
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // 处理网络错误、超时等无 response 的情况
    if (!error.response) {
      const apiError: ApiError = {
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message || 'Network request failed',
        },
      }
      return Promise.reject(apiError)
    }

    // 处理有 response 的情况
    const apiError: ApiError = {
      error: {
        code: error.response.data?.error?.code || 'UNKNOWN_ERROR',
        message: error.response.data?.error?.message || error.message || 'Unknown error',
      },
    }
    return Promise.reject(apiError)
  }
)

export default client
