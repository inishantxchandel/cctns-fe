import { apiFetch } from "@/lib/api/client"
import { ApiError, getErrorMessageFromBody } from "@/lib/api/errors"
import type { TicketsListResult, TicketListItem } from "@/types/ticket-list"
import type {
  TicketDetail,
  TicketDetailCreatedBy,
  TicketDetailDistrict,
  TicketDetailIssueType,
  TicketDetailPoliceStation,
} from "@/types/ticket-detail"
import type { CreateTicketPayload } from "@/types/tickets"

export type TicketsQueryParams = {
  page: number
  limit: number
  districtId?: string | null
  policeStationId?: string | null
  createdFrom: string
  createdTo: string
  status?: string | null
  teamAssigned?: string | null
}

function nestedName(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined
  const o = obj as Record<string, unknown>
  if (typeof o.name === "string") return o.name
  if (typeof o.label === "string") return o.label
  return undefined
}

function str(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.length > 0) return v
  }
  return undefined
}

function createdByEmailFrom(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const c = raw as Record<string, unknown>
  return str(c.email)
}

/**
 * Normalizes API ticket rows (nested district / policeStation / issueType / createdBy).
 */
function normalizeTicket(raw: unknown): TicketListItem {
  if (!raw || typeof raw !== "object") {
    return { id: "", title: "" }
  }
  const o = raw as Record<string, unknown>
  const id = str(o.id, o.ticketId) ?? ""
  const title = str(o.title, o.subject) ?? "—"
  const description = str(o.description)
  const status = str(o.status, o.statusName)
  const teamAssigned = str(o.teamAssigned, o.team_assigned, o.team)
  const createdAt = str(o.createdAt, o.created_at)
  const updatedAt = str(o.updatedAt, o.updated_at)
  const districtName =
    str(o.districtName, o.district_name) ?? nestedName(o.district)
  const policeStationName =
    str(o.policeStationName, o.police_station_name, o.psName) ??
    nestedName(o.policeStation) ??
    nestedName(o.police_station)
  const issueTypeName =
    str(o.issueTypeName, o.issue_type_name) ?? nestedName(o.issueType)
  const createdByEmail = createdByEmailFrom(o.createdBy)

  return {
    id,
    title,
    description,
    status,
    districtName,
    policeStationName,
    issueTypeName,
    teamAssigned,
    createdByEmail,
    createdAt,
    updatedAt,
  }
}

function parseTicketsListPayload(data: unknown): TicketsListResult {
  let items: TicketListItem[] = []
  let total = 0
  let page = 1
  let limit = 20
  let totalPagesFromApi: number | undefined

  if (Array.isArray(data)) {
    items = data.map(normalizeTicket)
    total = items.length
    page = 1
    limit = Math.max(items.length, 1)
    return {
      items,
      total,
      page,
      limit,
      totalPages: 1,
    }
  }

  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>
    const rawList = o.data ?? o.items ?? o.results ?? o.tickets ?? o.records
    if (Array.isArray(rawList)) {
      items = rawList.map(normalizeTicket)
    }

    const meta = o.meta ?? o.pagination
    if (meta && typeof meta === "object") {
      const m = meta as Record<string, unknown>
      if (typeof m.total === "number") total = m.total
      if (typeof m.page === "number") page = m.page
      if (typeof m.limit === "number") limit = m.limit
      if (typeof m.totalCount === "number") total = m.totalCount
      if (typeof m.totalPages === "number") totalPagesFromApi = m.totalPages
    }

    if (typeof o.total === "number") total = o.total
    if (typeof o.page === "number") page = o.page
    if (typeof o.limit === "number") limit = o.limit
    if (typeof o.totalCount === "number") total = o.totalCount
    if (typeof o.totalPages === "number") totalPagesFromApi = o.totalPages

    if (!total && items.length) {
      total = items.length
    }
  }

  const totalPages =
    totalPagesFromApi != null && totalPagesFromApi >= 1
      ? totalPagesFromApi
      : Math.max(1, Math.ceil(total / Math.max(limit, 1)))

  return { items, total, page, limit, totalPages }
}

export async function fetchTickets(
  query: TicketsQueryParams,
  init?: RequestInit
): Promise<TicketsListResult> {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("limit", String(query.limit))
  params.set("createdFrom", query.createdFrom)
  params.set("createdTo", query.createdTo)

  if (query.districtId) {
    params.set("districtId", query.districtId)
  }
  if (query.policeStationId) {
    params.set("policeStationId", query.policeStationId)
  }
  if (query.status) {
    params.set("status", query.status)
  }
  if (query.teamAssigned) {
    params.set("teamAssigned", query.teamAssigned)
  }

  const res = await apiFetch(`/tickets?${params.toString()}`, {
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
      getErrorMessageFromBody(data) ?? `Could not load tickets (${res.status})`
    throw new ApiError(res.status, msg, data)
  }

  return parseTicketsListPayload(data)
}

function strVal(v: unknown): string | undefined {
  if (typeof v === "string" && v.length > 0) return v
  return undefined
}

function parseDistrict(raw: unknown): TicketDetailDistrict | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = strVal(o.id)
  const name = strVal(o.name)
  const createdAt = strVal(o.createdAt) ?? ""
  const updatedAt = strVal(o.updatedAt) ?? ""
  if (!id || !name) return null
  return { id, name, createdAt, updatedAt }
}

function parseCreatedBy(raw: unknown): TicketDetailCreatedBy | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = strVal(o.id)
  const email = strVal(o.email)
  const role = strVal(o.role) ?? ""
  const createdAt = strVal(o.createdAt) ?? ""
  const updatedAt = strVal(o.updatedAt) ?? ""
  if (!id || !email) return null
  return {
    id,
    email,
    role,
    phone: strVal(o.phone),
    createdAt,
    updatedAt,
  }
}

function parseIssueType(raw: unknown): TicketDetailIssueType | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = strVal(o.id)
  const name = strVal(o.name)
  const createdAt = strVal(o.createdAt) ?? ""
  const updatedAt = strVal(o.updatedAt) ?? ""
  if (!id || !name) return null
  return { id, name, createdAt, updatedAt }
}

function parsePoliceStation(raw: unknown): TicketDetailPoliceStation | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = strVal(o.id)
  const name = strVal(o.name)
  const createdAt = strVal(o.createdAt) ?? ""
  const updatedAt = strVal(o.updatedAt) ?? ""
  const district = parseDistrict(o.district)
  if (!id || !name || !district) return null
  return { id, name, district, createdAt, updatedAt }
}

function parseTicketDetail(data: unknown): TicketDetail {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid ticket response")
  }
  const o = data as Record<string, unknown>
  const id = strVal(o.id)
  const title = strVal(o.title)
  const description = strVal(o.description) ?? ""
  const status = strVal(o.status) ?? ""
  const teamAssigned = strVal(o.teamAssigned) ?? ""
  const createdAt = strVal(o.createdAt) ?? ""
  const updatedAt = strVal(o.updatedAt) ?? ""
  const createdBy = parseCreatedBy(o.createdBy)
  const district = parseDistrict(o.district)
  const policeStation = parsePoliceStation(o.policeStation)
  const issueType = parseIssueType(o.issueType)

  if (
    !id ||
    !title ||
    !createdBy ||
    !district ||
    !policeStation ||
    !issueType
  ) {
    throw new Error("Invalid ticket response")
  }

  return {
    id,
    title,
    description,
    status,
    teamAssigned,
    createdAt,
    updatedAt,
    createdBy,
    district,
    policeStation,
    issueType,
  }
}

export async function fetchTicketById(
  ticketId: string,
  init?: RequestInit
): Promise<TicketDetail> {
  const id = encodeURIComponent(ticketId)
  const res = await apiFetch(`/tickets/${id}`, {
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
      `Could not load ticket (${res.status})`
    throw new ApiError(res.status, msg, data)
  }

  return parseTicketDetail(data)
}

export async function patchTicketStatus(
  ticketId: string,
  status: string,
  init?: RequestInit
): Promise<string> {
  const id = encodeURIComponent(ticketId)
  const res = await apiFetch(`/tickets/${id}/status`, {
    ...init,
    method: "PATCH",
    body: JSON.stringify({ status }),
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
      `Could not update status (${res.status})`
    throw new ApiError(res.status, msg, data)
  }

  if (data && typeof data === "object") {
    const s = (data as Record<string, unknown>).status
    if (typeof s === "string" && s.length > 0) return s
  }

  return status
}

export async function patchTicketTeam(
  ticketId: string,
  teamAssigned: string,
  init?: RequestInit
): Promise<string> {
  const id = encodeURIComponent(ticketId)
  const res = await apiFetch(`/tickets/${id}/team`, {
    ...init,
    method: "PATCH",
    body: JSON.stringify({ teamAssigned }),
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
      `Could not update team (${res.status})`
    throw new ApiError(res.status, msg, data)
  }

  if (data && typeof data === "object") {
    const t = (data as Record<string, unknown>).teamAssigned
    if (typeof t === "string" && t.length > 0) return t
  }

  return teamAssigned
}

export async function createTicket(
  payload: CreateTicketPayload
): Promise<unknown> {
  const res = await apiFetch("/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  let data: unknown
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const msg =
      getErrorMessageFromBody(data) ?? `Could not create ticket (${res.status})`
    throw new ApiError(res.status, msg, data)
  }

  return data
}
