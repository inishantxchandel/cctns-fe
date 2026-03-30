"use client"

import { useSyncExternalStore } from "react"

import { useAuthStore } from "@/store/auth-store"

/**
 * `true` after persisted auth has been read from storage.
 * Before this, `accessToken` / `user` can be null even when the session exists (e.g. full page refresh).
 */
export function useAuthHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) =>
      useAuthStore.persist.onFinishHydration(() => {
        onStoreChange()
      }),
    () => useAuthStore.persist.hasHydrated(),
    () => false
  )
}

/**
 * Client-only hook for session state. Use in client components or after mount.
 */
export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)

  return {
    accessToken,
    user,
    isAuthenticated: Boolean(accessToken && user),
    setSession,
    clearSession,
  }
}
