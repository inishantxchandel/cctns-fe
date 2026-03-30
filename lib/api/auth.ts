import { getApiBaseUrl } from "@/lib/config"
import { ApiError, getErrorMessageFromBody } from "@/lib/api/errors"
import type { LoginResponse } from "@/types/auth"

export type LoginInput = {
  email: string
  password: string
}

export async function loginRequest(input: LoginInput): Promise<LoginResponse> {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
    }),
  })

  let data: unknown
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const fallback =
      res.status === 401
        ? "Invalid email or password."
        : `Request failed (${res.status})`
    const msg = getErrorMessageFromBody(data) ?? fallback
    throw new ApiError(res.status, msg, data)
  }

  const parsed = data as Partial<LoginResponse>
  if (
    typeof parsed.access_token !== "string" ||
    !parsed.user ||
    typeof parsed.user !== "object"
  ) {
    throw new ApiError(res.status, "Unexpected response from server.", data)
  }

  return parsed as LoginResponse
}
