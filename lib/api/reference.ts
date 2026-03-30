import { apiFetch } from "@/lib/api/client"
import { ApiError, getErrorMessageFromBody } from "@/lib/api/errors"
import type { ReferenceDropdowns } from "@/types/reference"

function normalizeOptions(raw: unknown): { value: string; label: string }[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const o = item as Record<string, unknown>
      const value = o.value
      const label = o.label
      if (typeof value !== "string" || typeof label !== "string") return null
      return { value, label }
    })
    .filter(Boolean) as { value: string; label: string }[]
}

export async function fetchReferenceDropdowns(
  districtId?: string | null
): Promise<ReferenceDropdowns> {
  const qs =
    districtId && districtId.length > 0
      ? `?districtId=${encodeURIComponent(districtId)}`
      : ""
  const res = await apiFetch(`/reference/dropdowns${qs}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  })

  let data: unknown
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const msg =
      getErrorMessageFromBody(data) ?? `Failed to load dropdowns (${res.status})`
    throw new ApiError(res.status, msg, data)
  }

  if (!data || typeof data !== "object") {
    throw new ApiError(res.status, "Invalid dropdowns response", data)
  }

  const o = data as Record<string, unknown>

  return {
    issueTypes: normalizeOptions(o.issueTypes),
    districts: normalizeOptions(o.districts),
    policeStations: normalizeOptions(o.policeStations),
    statuses: normalizeOptions(o.statuses),
    teams: normalizeOptions(o.teams),
  }
}
