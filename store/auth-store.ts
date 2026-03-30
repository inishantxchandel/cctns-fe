import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { AuthUser } from "@/types/auth"

type AuthState = {
  accessToken: string | null
  user: AuthUser | null
  setSession: (accessToken: string, user: AuthUser) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      clearSession: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "cctns-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        user: s.user,
      }),
    }
  )
)

/** For use outside React (e.g. apiFetch, interceptors). */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken
}

export function getAuthUser(): AuthUser | null {
  return useAuthStore.getState().user
}
