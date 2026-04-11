export interface User {
  id: string
  name: string
  api_key: string
  api_url: string
  last_used: string
}

export interface AuthState {
  users: User[]
  currentUserId: string
}
