import { apiFetch } from "@/lib/api/client"
import { ApiError, getErrorMessageFromBody } from "@/lib/api/errors"
import type {
  TicketComment,
  TicketCommentAuthor,
  TicketCommentsResult,
} from "@/types/ticket-comment"

function strVal(v: unknown): string | undefined {
  if (typeof v === "string" && v.length > 0) return v
  return undefined
}

function parseCommentAuthor(raw: unknown): TicketCommentAuthor | null {
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

function parseComment(raw: unknown): TicketComment | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = strVal(o.id)
  const body = strVal(o.body)
  const createdAt = strVal(o.createdAt) ?? ""
  const author = parseCommentAuthor(o.author)
  if (!id || body === undefined || !author) return null
  return { id, author, body, createdAt }
}

function parseCommentsListPayload(data: unknown): TicketCommentsResult {
  let items: TicketComment[] = []
  let total = 0
  let page = 1
  let limit = 20
  let totalPagesFromApi: number | undefined

  if (Array.isArray(data)) {
    items = data.map((row) => parseComment(row)).filter(Boolean) as TicketComment[]
    total = items.length
    page = 1
    limit = Math.max(items.length, 1)
    return { items, total, page, limit, totalPages: 1 }
  }

  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>
    const rawList = o.data ?? o.items ?? o.results ?? o.comments
    if (Array.isArray(rawList)) {
      items = rawList.map((row) => parseComment(row)).filter(Boolean) as TicketComment[]
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

export type FetchTicketCommentsParams = {
  page?: number
  limit?: number
}

export async function fetchTicketComments(
  ticketId: string,
  params: FetchTicketCommentsParams = {},
  init?: RequestInit
): Promise<TicketCommentsResult> {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  const id = encodeURIComponent(ticketId)
  const res = await apiFetch(`/tickets/${id}/comments?${qs}`, {
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
      `Could not load comments (${res.status})`
    throw new ApiError(res.status, msg, data)
  }

  return parseCommentsListPayload(data)
}

export async function createTicketComment(
  ticketId: string,
  payload: { body: string },
  init?: RequestInit
): Promise<TicketComment> {
  const id = encodeURIComponent(ticketId)
  const res = await apiFetch(`/tickets/${id}/comments`, {
    ...init,
    method: "POST",
    body: JSON.stringify({ body: payload.body }),
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
      `Could not add comment (${res.status})`
    throw new ApiError(res.status, msg, data)
  }

  const comment = parseComment(data)
  if (!comment) {
    throw new ApiError(
      res.status,
      "Invalid comment response from server",
      data
    )
  }
  return comment
}
