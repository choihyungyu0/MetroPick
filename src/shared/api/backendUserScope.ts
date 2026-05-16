import { getStoredAuthUserId } from '@/shared/auth/authStorage'

type UserScopedInput = {
  user_id?: string | null
}

export function getBackendUserId(): string | undefined {
  return getStoredAuthUserId()
}

export function buildUserScopedPath(path: string): string {
  const userId = getBackendUserId()
  if (!userId) {
    return path
  }

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}user_id=${encodeURIComponent(userId)}`
}

export function withBackendUserId<TInput extends UserScopedInput>(
  input: TInput,
): TInput {
  const userId = getBackendUserId()
  if (!userId || input.user_id) {
    return input
  }

  return {
    ...input,
    user_id: userId,
  }
}
