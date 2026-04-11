import axios, { AxiosInstance, AxiosError } from 'axios'
import type { ApiError } from './types'
import { useAuthStore } from '@/stores/auth'

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const apiKey = authStore.currentApiKey
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

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (!error.response) {
      const apiError: ApiError = {
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message || 'Network request failed',
        },
      }
      return Promise.reject(apiError)
    }

    const apiError: ApiError = {
      error: {
        code: error.response.data?.error?.code || 'UNKNOWN_ERROR',
        message: error.response.data?.error?.message || error.message || 'Unknown error',
      },
    }
    return Promise.reject(apiError)
  }
)

export function updateBaseURL(url: string) {
  client.defaults.baseURL = url
}

export default client
