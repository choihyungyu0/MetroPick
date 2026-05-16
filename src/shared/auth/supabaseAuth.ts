import type { Session, User } from '@supabase/supabase-js'

import { getSupabaseClient } from '@/shared/supabase/supabaseClient'

type SupabaseAuthFailureReason = 'auth_error' | 'missing_client'

export type SupabaseAuthResult =
  | {
      ok: true
      session: Session | null
      user: User
    }
  | {
      message: string
      ok: false
      reason: SupabaseAuthFailureReason
    }

function missingClientResult(): SupabaseAuthResult {
  return {
    ok: false,
    reason: 'missing_client',
    message: 'Supabase Auth is not configured.',
  }
}

function authErrorResult(message: string): SupabaseAuthResult {
  return {
    ok: false,
    reason: 'auth_error',
    message,
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<SupabaseAuthResult> {
  const client = getSupabaseClient()
  if (!client) {
    return missingClientResult()
  }

  const { data, error } = await client.auth.signUp({ email, password })
  if (error) {
    return authErrorResult(error.message)
  }

  return data.user
    ? { ok: true, user: data.user, session: data.session }
    : authErrorResult('Supabase Auth did not return a user.')
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<SupabaseAuthResult> {
  const client = getSupabaseClient()
  if (!client) {
    return missingClientResult()
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    return authErrorResult(error.message)
  }

  return data.user
    ? { ok: true, user: data.user, session: data.session }
    : authErrorResult('Supabase Auth did not return a user.')
}

export async function signOut(): Promise<{ message?: string; ok: boolean }> {
  const client = getSupabaseClient()
  if (!client) {
    return { ok: false, message: 'Supabase Auth is not configured.' }
  }

  const { error } = await client.auth.signOut()
  return error ? { ok: false, message: error.message } : { ok: true }
}

export async function getCurrentUser(): Promise<SupabaseAuthResult> {
  const client = getSupabaseClient()
  if (!client) {
    return missingClientResult()
  }

  const { data, error } = await client.auth.getUser()
  if (error) {
    return authErrorResult(error.message)
  }

  return data.user
    ? { ok: true, user: data.user, session: null }
    : authErrorResult('No Supabase Auth user is signed in.')
}

export async function getCurrentSession(): Promise<
  | {
      ok: true
      session: Session | null
    }
  | {
      message: string
      ok: false
      reason: SupabaseAuthFailureReason
    }
> {
  const client = getSupabaseClient()
  if (!client) {
    return {
      ok: false,
      reason: 'missing_client',
      message: 'Supabase Auth is not configured.',
    }
  }

  const { data, error } = await client.auth.getSession()
  if (error) {
    return {
      ok: false,
      reason: 'auth_error',
      message: error.message,
    }
  }

  return { ok: true, session: data.session }
}
