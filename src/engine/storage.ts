import { useEffect, useState } from 'react'

export function readStored<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v == null ? fallback : (JSON.parse(v) as T)
  } catch {
    return fallback
  }
}

export function store(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* storage unavailable */
  }
}

/** useState that survives reloads (per browser). */
export function useStored<T>(key: string, fallback: T) {
  const [v, setV] = useState<T>(() => readStored(key, fallback))
  useEffect(() => store(key, v), [key, v])
  return [v, setV] as const
}
