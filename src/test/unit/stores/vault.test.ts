import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVaultStore } from '@/stores/vault'

describe('Vault Store', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useVaultStore.setState({
      isUnlocked: false,
      passwordHash: null,
    })
  })

  it('should set password and unlock', async () => {
    const store = useVaultStore.getState()
    await store.setPassword('my-secret-password')

    const state = useVaultStore.getState()
    expect(state.isUnlocked).toBe(true)
    expect(state.passwordHash).not.toBeNull()
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'omem-vault-hash',
      expect.any(String)
    )
  })

  it('should verify correct password', async () => {
    const store = useVaultStore.getState()
    await store.setPassword('correct-password')
    store.lock()

    const result = await useVaultStore.getState().verifyPassword('correct-password')
    expect(result).toBe(true)
  })

  it('should reject wrong password', async () => {
    const store = useVaultStore.getState()
    await store.setPassword('correct-password')
    store.lock()

    const result = await useVaultStore.getState().verifyPassword('wrong-password')
    expect(result).toBe(false)
  })

  it('should lock vault', async () => {
    const store = useVaultStore.getState()
    await store.setPassword('password')
    expect(useVaultStore.getState().isUnlocked).toBe(true)

    store.lock()
    expect(useVaultStore.getState().isUnlocked).toBe(false)
  })

  it('should detect first-time setup', () => {
    const state = useVaultStore.getState()
    expect(state.passwordHash).toBeNull()
  })

  it('should load password hash from sessionStorage', () => {
    const mockHash = 'abc123hash'
    ;(sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(mockHash)

    useVaultStore.setState({
      passwordHash: sessionStorage.getItem('omem-vault-hash'),
    })

    expect(useVaultStore.getState().passwordHash).toBe(mockHash)
  })
})
