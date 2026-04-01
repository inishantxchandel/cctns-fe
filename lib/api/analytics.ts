import { apiFetch } from "@/lib/api/client"
import { ApiError, getErrorMessageFromBody } from "@/lib/api/errors"
import {
  AnalyticsGroupBy,
  clampAnalyticsTopN,
  type AnalyticsDashboardResponse,
} from "@/types/analytics"

export type AnalyticsDashboardQuery = {
  groupBy: AnalyticsGroupBy
  topN: number
  from: string
  to: string
}

function isAnalyticsGroupBy(v: string): v is AnalyticsGroupBy {
  return (Object.values(AnalyticsGroupBy) as string[]).includes(v)
}

export async function fetchAnalyticsDashboard(
  query: AnalyticsDashboardQuery,
  init?: RequestInit
): Promise<AnalyticsDashboardResponse> {
  const params = new URLSearchParams()
  params.set(
    "groupBy",
    isAnalyticsGroupBy(query.groupBy) ? query.groupBy : AnalyticsGroupBy.MONTH
  )
  params.set("topN", String(clampAnalyticsTopN(query.topN)))
  params.set("from", query.from)
  params.set("to", query.to)

  const res = await apiFetch(`/analytics/dashboard?${params.toString()}`, {
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
      `Could not load analytics (${res.status})`
    throw new ApiError(res.status, msg, data)
  }

  if (!data || typeof data !== "object") {
    throw new ApiError(res.status, "Invalid analytics response", data)
  }

  return data as AnalyticsDashboardResponse
}
