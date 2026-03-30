import { apiFetch } from "@/lib/api/client"
import { ApiError, getErrorMessageFromBody } from "@/lib/api/errors"
import type {
  ContactDirectoryDistrictRef,
  ContactDirectoryPoliceStationRef,
  ContactDirectoryResult,
  ContactDirectoryUser,
} from "@/types/contact-directory"

function strVal(v: unknown): string | undefined {
  if (typeof v === "string" && v.length > 0) return v
  return undefined
}

function parsePoliceStationRef(
  raw: unknown
): ContactDirectoryPoliceStationRef | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = strVal(o.id)
  const name = strVal(o.name)
  if (!id || !name) return null
  return { id, name }
}

function parseDistrictRef(raw: unknown): ContactDirectoryDistrictRef | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = strVal(o.id)
  const name = strVal(o.name)
  if (!id || !name) return null
  return { id, name }
}

function parseContactUser(raw: unknown): ContactDirectoryUser | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = strVal(o.id)
  const name = strVal(o.name)
  const role = strVal(o.role) ?? ""
  const email = strVal(o.email) ?? ""
  if (!id || !name) return null

  const districtRaw = o.district
  const district =
    districtRaw === null || districtRaw === undefined
      ? null
      : parseDistrictRef(districtRaw)

  let policeStationsAllocated: ContactDirectoryPoliceStationRef[] = []
  const ps = o.policeStationsAllocated ?? o.police_stations_allocated
  if (Array.isArray(ps)) {
    policeStationsAllocated = ps
      .map(parsePoliceStationRef)
      .filter(Boolean) as ContactDirectoryPoliceStationRef[]
  }

  const phone =
    o.phone === null || o.phone === undefined
      ? null
      : typeof o.phone === "string"
        ? o.phone
        : null

  return {
    id,
    name,
    role,
    district,
    policeStationsAllocated,
    phone,
    email,
  }
}

function parseContactDirectoryPayload(data: unknown): ContactDirectoryResult {
  let items: ContactDirectoryUser[] = []
  let total = 0
  let page = 1
  let limit = 20
  let totalPagesFromApi: number | undefined

  if (Array.isArray(data)) {
    items = data
      .map(parseContactUser)
      .filter(Boolean) as ContactDirectoryUser[]
    total = items.length
    page = 1
    limit = Math.max(items.length, 1)
    return { items, total, page, limit, totalPages: 1 }
  }

  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>
    const rawList = o.data ?? o.items ?? o.results ?? o.users
    if (Array.isArray(rawList)) {
      items = rawList
        .map(parseContactUser)
        .filter(Boolean) as ContactDirectoryUser[]
    }

    const meta = o.meta ?? o.pagination
    if (meta && typeof meta === "object") {
      const m = meta as Record<string, unknown>
      if (typeof m.total === "number") total = m.total
      if (typeof m.page === "number") page = m.page
      if (typeof m.limit === "number") limit = m.limit
      if (typeof m.totalPages === "number") totalPagesFromApi = m.totalPages
    }

    if (typeof o.total === "number") total = o.total
    if (typeof o.page === "number") page = o.page
    if (typeof o.limit === "number") limit = o.limit
    if (typeof o.totalPages === "number") totalPagesFromApi = o.totalPages

    if (!total && items.length) total = items.length
  }

  const totalPages =
    totalPagesFromApi != null && totalPagesFromApi >= 1
      ? totalPagesFromApi
      : Math.max(1, Math.ceil(total / Math.max(limit, 1)))

  return { items, total, page, limit, totalPages }
}

export type ContactDirectoryQuery = {
  page: number
  limit: number
  districtId?: string | null
  search?: string | null
}

export async function fetchContactDirectory(
  query: ContactDirectoryQuery,
  init?: RequestInit
): Promise<ContactDirectoryResult> {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("limit", String(query.limit))
  if (query.districtId) {
    params.set("districtId", query.districtId)
  }
  if (query.search && query.search.trim().length > 0) {
    params.set("search", query.search.trim())
  }

  const res = await apiFetch(`/users/contact-directory?${params.toString()}`, {
    ...init,
    method: "GET",
    headers: { Accept: "application/json", ...init?.headers },
  })

  let data: unknown
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const msg =
      getErrorMessageFromBody(data) ??
      `Could not load contact directory (${res.status})`
    throw new ApiError(res.status, msg, data)
  }

  return parseContactDirectoryPayload(data)
}
