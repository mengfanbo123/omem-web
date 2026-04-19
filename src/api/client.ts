import axios from "axios"
import type { AxiosInstance } from "axios"
import { useAuthStore } from "@/stores/auth"

const apiClient = axios.create({
  baseURL: "/",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
}) as AxiosInstance

apiClient.interceptors.request.use((config) => {
  const currentUser = useAuthStore.getState().users.find(
    (u) => u.id === useAuthStore.getState().currentUserId
  )
  if (currentUser?.apiKey) {
    config.headers["X-API-Key"] = currentUser.apiKey
    config.headers["X-Agent-ID"] = "omem-web"
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default apiClient
