export interface User {
  id: string
  name: string
  apiKey: string
  apiUrl: string
  lastUsed: string
}

export interface AuthState {
  users: User[]
  currentUserId: string
}
