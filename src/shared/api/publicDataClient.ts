import { publicDataSources } from '@/shared/data/publicDataSources'
import type { PublicDataSource } from '@/shared/types/publicData'

export type PublicDataClientStatus = {
  mode: 'mock'
  baseUrl: string
  sources: PublicDataSource[]
}

export function withMockDelay<T>(data: T, delay = 150): Promise<T> {
  return new Promise((resolve) => {
    globalThis.setTimeout(() => resolve(data), delay)
  })
}

export function readStorageList<T>(key: string): T[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : []

    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function writeStorageList<T>(key: string, value: T[]): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function appendStorageItem<T>(key: string, value: T): T[] {
  const next = [...readStorageList<T>(key), value]
  writeStorageList(key, next)

  return next
}

export function getPublicDataClientStatus(): Promise<PublicDataClientStatus> {
  return withMockDelay({
    mode: 'mock',
    baseUrl: '/api',
    sources: publicDataSources,
  })
}
