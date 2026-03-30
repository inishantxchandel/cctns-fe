/** Query / response `groupBy` (must match API). */
export enum AnalyticsGroupBy {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
}

export type AnalyticsTrendPoint = {
  period: string
  total: number
}

export type AnalyticsIssueSeries = {
  issueTypeId: string
  issueTypeName: string
  points: AnalyticsTrendPoint[]
}

export type AnalyticsResolutionOverall = {
  totalTickets: number
  resolvedTickets: number
  unresolvedTickets: number
  avgResolutionHours: number | null
  p50ResolutionHours: number | null
  p90ResolutionHours: number | null
}

export type AnalyticsResolutionByTeam = {
  teamAssigned: string
  totalTickets: number
  resolvedTickets: number
  avgResolutionHours: number | null
  p50ResolutionHours: number | null
  p90ResolutionHours: number | null
}

export type AnalyticsTeamPerformanceRow = {
  teamAssigned: string
  totalTickets: number
  resolvedTickets: number
  /** Status label → count (API keys match ticket status strings). */
  statusCounts: Record<string, number>
}

export type AnalyticsDashboardResponse = {
  range: { from: string; to: string }
  issueTrends: {
    groupBy: AnalyticsGroupBy | string
    series: AnalyticsIssueSeries[]
  }
  frequentProblems: Array<{
    issueTypeId: string
    issueTypeName: string
    count: number
  }>
  resolutionTime: {
    overall: AnalyticsResolutionOverall
    byTeam: AnalyticsResolutionByTeam[]
  }
  teamPerformance: {
    byTeam: AnalyticsTeamPerformanceRow[]
  }
}
