/**
 * Public API base URL (no trailing slash).
 * Set NEXT_PUBLIC_API_URL in `.env.local` for local/backend targets.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
  return raw.replace(/\/$/, "")
}
