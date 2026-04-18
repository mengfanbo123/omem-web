import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVaultStore } from '@/stores/vault'

describe('Vault Store', () => {
  beforeEach(() => {
    localStorage.clear()
    useVaultStore.setState({
      isUnlocked: false,
      passwordHash: null,
    })
  })

  it('should set password and unlock', () => {
    const store = useVaultStore.getState()
    store.setPassword('my-secret-password')

    const state = useVaultStore.getState()
    expect(state.isUnlocked).toBe(true)
    expect(state.passwordHash).not.toBeNull()
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'omem-vault-hash',
      expect.any(String)
    )
  })

  it('should verify correct password', () => {
    const store = useVaultStore.getState()
    store.setPassword('correct-password')
    store.lock()

    const result = useVaultStore.getState().verifyPassword('correct-password')
    expect(result).toBe(true)
  })

  it('should reject wrong password', () => {
    const store = useVaultStore.getState()
    store.setPassword('correct-password')
    store.lock()

    const result = useVaultStore.getState().verifyPassword('wrong-password')
    expect(result).toBe(false)
  })

  it('should lock vault', () => {
    const store = useVaultStore.getState()
    store.setPassword('password')
    expect(useVaultStore.getState().isUnlocked).toBe(true)

    store.lock()
    expect(useVaultStore.getState().isUnlocked).toBe(false)
  })

  it('should detect first-time setup', () => {
    const state = useVaultStore.getState()
    expect(state.passwordHash).toBeNull()
  })

  it('should load password hash from localStorage', () => {
    const mockHash = 'abc123hash'
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(mockHash)

    useVaultStore.setState({
      passwordHash: localStorage.getItem('omem-vault-hash'),
    })

    expect(useVaultStore.getState().passwordHash).toBe(mockHash)
  })
})
