import { create } from "zustand"

interface VaultState {
  isUnlocked: boolean
  passwordHash: string | null
  setPassword: (password: string) => void
  verifyPassword: (password: string) => boolean
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
  setPassword: (password) => {
    const hash = btoa(password)
    sessionStorage.setItem("omem-vault-hash", hash)
    set({ isUnlocked: true, passwordHash: hash })
  },
  verifyPassword: (password) => {
    const state = get()
    if (!state.passwordHash) return false
    return btoa(password) === state.passwordHash
  },
  lock: () => set({ isUnlocked: false }),
}))
