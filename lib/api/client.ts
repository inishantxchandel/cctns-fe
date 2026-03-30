/**
 * Authenticated fetch helper — import only from client components or client modules
 * (uses Zustand + localStorage).
 */
import { getApiBaseUrl } from "@/lib/config"
import { useAuthStore } from "@/store/auth-store"

type ApiFetchInit = RequestInit & {
  /** Skip attaching Authorization (e.g. login). */
  skipAuth?: boolean
}

/**
 * JSON API fetch with Bearer token from the auth store.
 * Use from client components, event handlers, or effects only.
 */
export async function apiFetch(path: string, init: ApiFetchInit = {}) {
  const { skipAuth, headers: initHeaders, ...rest } = init
  const url = path.startsWith("http") ? path : `${getApiBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`

  const headers = new Headers(initHeaders)
  if (!headers.has("Content-Type") && rest.body && !(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  if (!skipAuth) {
    const token = useAuthStore.getState().accessToken
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  return fetch(url, { ...rest, headers })
}
