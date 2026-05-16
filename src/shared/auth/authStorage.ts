import { safeParseStorage, writeStorage } from '@/shared/lib/storage'

export type StoredAuthUser = {
  email: string
  id?: string
  name: string
  plan?: string
  role: string
  source: 'demo' | 'supabase'
}

const AUTHENTICATED_STORAGE_KEY = 'metropick-authenticated'
const USER_STORAGE_KEY = 'metropick-user'
const ONBOARDING_COMPLETED_STORAGE_KEY = 'metropick-onboarding-completed'
const ONBOARDING_OWNER_STORAGE_KEY = 'metropick-onboarding-owner'
const LOCAL_ONBOARDING_STORAGE_KEYS = [
  'metropick-onboarding-stations',
  'metropick-onboarding-business-types',
  'metropick-onboarding-notifications',
  ONBOARDING_COMPLETED_STORAGE_KEY,
  'metropick-onboarding-summary',
]

type AuthUserIdentity = Pick<StoredAuthUser, 'email' | 'id'>

function getAuthUserStorageKey(user: AuthUserIdentity): string {
  const id = user.id?.trim()

  if (id) {
    return `id:${id}`
  }

  return `email:${user.email.trim().toLowerCase()}`
}

function clearLocalOnboardingState(): void {
  for (const key of LOCAL_ONBOARDING_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
  }
  window.localStorage.removeItem(ONBOARDING_OWNER_STORAGE_KEY)
}

function preventOnboardingStateLeak(user: AuthUserIdentity): void {
  const completed =
    window.localStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY) === 'true'

  if (!completed) {
    return
  }

  const ownerKey = window.localStorage.getItem(ONBOARDING_OWNER_STORAGE_KEY)

  if (ownerKey !== getAuthUserStorageKey(user)) {
    clearLocalOnboardingState()
  }
}

export function saveAuthUser(user: StoredAuthUser): void {
  if (typeof window === 'undefined') {
    return
  }

  preventOnboardingStateLeak(user)
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
    source: user.source === 'supabase' ? 'supabase' : 'demo',
  }
}

export function getStoredAuthUserId(): string | undefined {
  const user = getStoredAuthUser()
  return user?.id
}

export function hasCompletedOnboardingForAuthUser(user: AuthUserIdentity): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const completed =
    window.localStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY) === 'true'
  const ownerKey = window.localStorage.getItem(ONBOARDING_OWNER_STORAGE_KEY)

  return completed && ownerKey === getAuthUserStorageKey(user)
}

export function hasStoredAuthUserCompletedOnboarding(): boolean {
  const user = getStoredAuthUser()

  return user ? hasCompletedOnboardingForAuthUser(user) : false
}

export function markStoredAuthUserOnboardingCompleted(): void {
  if (typeof window === 'undefined') {
    return
  }

  const user = getStoredAuthUser()

  window.localStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, 'true')

  if (user) {
    window.localStorage.setItem(
      ONBOARDING_OWNER_STORAGE_KEY,
      getAuthUserStorageKey(user),
    )
  } else {
    window.localStorage.removeItem(ONBOARDING_OWNER_STORAGE_KEY)
  }
}
