import { create } from "zustand"

// 使用 SHA-256 对密码进行单向哈希
// 当前密码 hash 存储在 sessionStorage 中，未来可迁移到服务端 vault API
async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  } catch {
    // crypto.subtle 在某些环境不可用时的 fallback：djb2 字符串 hash
    let hash = 5381
    for (let i = 0; i < password.length; i++) {
      hash = ((hash << 5) + hash + password.charCodeAt(i)) | 0
    }
    return "djb2_" + (hash >>> 0).toString(16)
  }
}

interface VaultState {
  isUnlocked: boolean
  passwordHash: string | null
  setPassword: (password: string) => Promise<void>
  verifyPassword: (password: string) => Promise<boolean>
  lock: () => void
}

export const useVaultStore = create<VaultState>((set, get) => ({
  isUnlocked: false,
  passwordHash: (() => {
    try {
      return sessionStorage.getItem("omem-vault-hash")
    } catch {
      return null
    }
  })(),
  setPassword: async (password) => {
    const hash = await hashPassword(password)
    sessionStorage.setItem("omem-vault-hash", hash)
    set({ isUnlocked: true, passwordHash: hash })
  },
  verifyPassword: async (password) => {
    const state = get()
    if (!state.passwordHash) return false
    const hash = await hashPassword(password)
    return hash === state.passwordHash
  },
  lock: () => set({ isUnlocked: false }),
}))
