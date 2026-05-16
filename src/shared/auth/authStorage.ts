import { safeParseStorage, writeStorage } from '@/shared/lib/storage'

export type StoredAuthUser = {
  email: string
  id?: string
  name: string
  plan?: string
  role: string
}

const AUTHENTICATED_STORAGE_KEY = 'metropick-authenticated'
const USER_STORAGE_KEY = 'metropick-user'

export function saveAuthUser(user: StoredAuthUser): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTHENTICATED_STORAGE_KEY, 'true')
  writeStorage(USER_STORAGE_KEY, user)
}

export function clearAuthUser(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTHENTICATED_STORAGE_KEY)
  window.localStorage.removeItem(USER_STORAGE_KEY)
}

export function getStoredAuthUser(): StoredAuthUser | null {
  const user = safeParseStorage<Partial<StoredAuthUser>>(USER_STORAGE_KEY)
  const isAuthenticated =
    typeof window !== 'undefined' &&
    window.localStorage.getItem(AUTHENTICATED_STORAGE_KEY) === 'true'

  if (!isAuthenticated || !user?.email) {
    return null
  }

  return {
    email: user.email,
    id: user.id,
    name: user.name ?? user.email,
    plan: user.plan,
    role: user.role ?? '예비 창업자',
  }
}
