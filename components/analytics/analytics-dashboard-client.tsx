"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchAnalyticsDashboard } from "@/lib/api/analytics"
import {
  dateInputToISOEnd,
  dateInputToISOStart,
  defaultLastThirtyDaysRange,
} from "@/lib/date-range"
import { ApiError } from "@/lib/api/errors"
import { cn } from "@/lib/utils"
import { AnalyticsGroupBy } from "@/types/analytics"
import type { AnalyticsDashboardResponse } from "@/types/analytics"
import { TICKET_STATUS_ORDER } from "@/types/ticket-status"

const GROUP_BY_ITEMS: { value: AnalyticsGroupBy; label: string }[] = [
  { value: AnalyticsGroupBy.DAY, label: "Day" },
  { value: AnalyticsGroupBy.WEEK, label: "Week" },
  { value: AnalyticsGroupBy.MONTH, label: "Month" },
]

function humanizeTeam(value: string) {
  return value ? value.replaceAll("_", " ") : "—"
}

function formatHours(hours: number | null): string {
  if (hours == null || Number.isNaN(hours)) return "—"
  if (hours < 48) return `${hours.toFixed(1)} h`
  return `${(hours / 24).toFixed(1)} d`
}

/** Single boundary for the report period line (calendar dates only). */
function formatReportDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

/** Trend column headers — backend may send full ISO, `YYYY-MM`, etc. */
function formatTrendPeriodLabel(period: string, groupBy: string): string {
  const trimmed = period.trim()
  const gb = groupBy.trim().toLowerCase()

  const ym = /^(\d{4})-(\d{2})$/.exec(trimmed)
  if (ym) {
    const y = Number(ym[1])
    const m = Number(ym[2])
    if (y && m >= 1 && m <= 12) {
      const d = new Date(y, m - 1, 1)
      return d.toLocaleDateString(undefined, { month: "short", year: "numeric" })
    }
  }

  try {
    const d = new Date(trimmed)
    if (Number.isNaN(d.getTime())) return period
    if (gb === AnalyticsGroupBy.MONTH || gb === "months") {
      return d.toLocaleDateString(undefined, { month: "short", year: "numeric" })
    }
    if (gb === AnalyticsGroupBy.DAY || gb === "days") {
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    }
    if (gb === AnalyticsGroupBy.WEEK || gb === "weeks") {
      return `Week of ${d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`
    }
    return d.toLocaleDateString(undefined, { dateStyle: "medium" })
  } catch {
    return period
  }
}

function collectSortedPeriods(data: AnalyticsDashboardResponse | null): string[] {
  if (!data) return []
  const set = new Set<string>()
  for (const s of data.issueTrends.series) {
    for (const p of s.points) {
      set.add(p.period)
    }
  }
  return Array.from(set).sort()
}

function totalForSeriesPeriod(
  series: AnalyticsDashboardResponse["issueTrends"]["series"][0],
  period: string
): number {
  const pt = series.points.find((p) => p.period === period)
  return pt?.total ?? 0
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card px-4 py-4 shadow-sm ring-1 ring-foreground/5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold tracking-tight">
        {value}
      </p>
      {sub ? (
        <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>
      ) : null}
    </div>
  )
}

export function AnalyticsDashboardClient() {
  const initialRange = useMemo(() => defaultLastThirtyDaysRange(), [])
  const [dateFrom, setDateFrom] = useState(initialRange.fromInput)
  const [dateTo, setDateTo] = useState(initialRange.toInput)
  const [groupBy, setGroupBy] = useState<AnalyticsGroupBy>(
    AnalyticsGroupBy.MONTH
  )
  const [topN, setTopN] = useState(5)

  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const groupBySelectItems = useMemo(
    () => GROUP_BY_ITEMS.map((x) => ({ value: x.value, label: x.label })),
    []
  )

  const fetchDashboard = useCallback(
    async (opts?: { signal?: AbortSignal }) => {
      const signal = opts?.signal
      setLoading(true)
      try {
        const res = await fetchAnalyticsDashboard(
          {
            groupBy,
            topN: Number.isFinite(topN) ? topN : 5,
            from: dateInputToISOStart(dateFrom),
            to: dateInputToISOEnd(dateTo),
          },
          signal ? { signal } : undefined
        )
        if (!signal?.aborted) setData(res)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        if (!signal?.aborted) {
          setData(null)
          toast.error(
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Could not load analytics."
          )
        }
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [dateFrom, dateTo, groupBy, topN]
  )

  useEffect(() => {
    const ac = new AbortController()
    const t = setTimeout(() => {
      void fetchDashboard({ signal: ac.signal })
    }, 350)
    return () => {
      clearTimeout(t)
      ac.abort()
    }
  }, [fetchDashboard])

  const periods = useMemo(() => collectSortedPeriods(data), [data])
  const maxFrequent = useMemo(() => {
    if (!data?.frequentProblems.length) return 1
    return Math.max(
      1,
      ...data.frequentProblems.map((f) => f.count)
    )
  }, [data])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-lg font-semibold tracking-tight md:text-xl">
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Ticket volume, how long issues take to resolve, and how teams are
          performing.
        </p>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">Filters</CardTitle>
              <CardDescription>
                Choose the dates and how trends are grouped; applies to charts
                and top issue lists.
              </CardDescription>
            </div>
            {loading ? (
              <div
                className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-primary text-sm"
                role="status"
                aria-live="polite"
              >
                <Loader2
                  className="size-4 shrink-0 animate-spin"
                  aria-hidden
                />
                <span className="font-medium">Loading…</span>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="analytics-from">From</FieldLabel>
              <FieldContent>
                <Input
                  id="analytics-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  disabled={loading}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="analytics-to">To</FieldLabel>
              <FieldContent>
                <Input
                  id="analytics-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  disabled={loading}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Group by</FieldLabel>
              <FieldContent>
                <Select
                  value={groupBy}
                  onValueChange={(v) =>
                    setGroupBy(v as AnalyticsGroupBy)
                  }
                  disabled={loading}
                  items={groupBySelectItems}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_BY_ITEMS.map((x) => (
                      <SelectItem key={x.value} value={x.value}>
                        {x.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="analytics-topn">Top N</FieldLabel>
              <FieldContent>
                <Input
                  id="analytics-topn"
                  type="number"
                  min={1}
                  max={50}
                  value={topN}
                  disabled={loading}
                  onChange={(e) =>
                    setTopN(Number.parseInt(e.target.value, 10) || 5)
                  }
                />
              </FieldContent>
            </Field>
          </FieldGroup>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => {
                const r = defaultLastThirtyDaysRange()
                setDateFrom(r.fromInput)
                setDateTo(r.toInput)
                setGroupBy(AnalyticsGroupBy.MONTH)
                setTopN(5)
              }}
            >
              Reset to last 30 days
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={() => void fetchDashboard()}
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Refreshing…
                </>
              ) : (
                "Refresh now"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && !data ? (
        <div className="grid gap-4" aria-busy="true" aria-label="Loading analytics">
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/80 bg-card py-16 shadow-sm">
            <Loader2 className="size-10 text-primary animate-spin" aria-hidden />
            <p className="text-muted-foreground text-sm font-medium">
              Loading analytics…
            </p>
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : null}

      {data ? (
        <div className="relative min-h-[12rem]">
          {loading ? (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/80 backdrop-blur-sm"
              role="status"
              aria-live="polite"
              aria-busy="true"
              aria-label="Updating analytics"
            >
              <Loader2 className="size-12 text-primary animate-spin" aria-hidden />
              <p className="text-foreground text-sm font-medium">
                Updating analytics…
              </p>
              <p className="text-muted-foreground max-w-xs text-center text-xs">
                Applying your filters
              </p>
            </div>
          ) : null}
          <div
            className={cn(
              "flex flex-col gap-8",
              loading && "pointer-events-none select-none opacity-50"
            )}
          >
          <p className="text-muted-foreground text-xs sm:text-sm">
            Report period: {formatReportDate(data.range.from)} –{" "}
            {formatReportDate(data.range.to)}
          </p>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-base">Resolution overview</CardTitle>
              <CardDescription>
                Ticket counts and resolution-time percentiles (overall).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 pt-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-6">
              <StatCard
                label="Total tickets"
                value={String(data.resolutionTime.overall.totalTickets)}
              />
              <StatCard
                label="Resolved"
                value={String(data.resolutionTime.overall.resolvedTickets)}
                sub={`${data.resolutionTime.overall.unresolvedTickets} unresolved`}
              />
              <StatCard
                label="Avg resolution"
                value={formatHours(
                  data.resolutionTime.overall.avgResolutionHours
                )}
              />
              <StatCard
                label="p50 resolution"
                value={formatHours(
                  data.resolutionTime.overall.p50ResolutionHours
                )}
              />
              <StatCard
                label="p90 resolution"
                value={formatHours(
                  data.resolutionTime.overall.p90ResolutionHours
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-base">Issue trends</CardTitle>
              <CardDescription>
                How often each issue type appears, by{" "}
                {GROUP_BY_ITEMS.find(
                  (x) =>
                    String(x.value).toLowerCase() ===
                    String(data.issueTrends.groupBy).toLowerCase()
                )?.label?.toLowerCase() ?? "period"}
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-10 min-w-[10rem] bg-card">
                        Issue type
                      </TableHead>
                      {periods.map((p) => (
                        <TableHead
                          key={p}
                          className="max-w-[9rem] whitespace-normal text-right text-xs leading-tight sm:text-sm"
                        >
                          {formatTrendPeriodLabel(
                            p,
                            data.issueTrends.groupBy
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.issueTrends.series.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={Math.max(2, periods.length + 1)}
                          className="text-muted-foreground py-8 text-center text-sm"
                        >
                          No trend data for this range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.issueTrends.series.map((s) => (
                        <TableRow key={s.issueTypeId}>
                          <TableCell className="sticky left-0 z-10 max-w-[14rem] bg-card font-medium wrap-break-word whitespace-normal">
                            {s.issueTypeName}
                          </TableCell>
                          {periods.map((p) => (
                            <TableCell
                              key={p}
                              className="text-right tabular-nums"
                            >
                              {totalForSeriesPeriod(s, p)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-base">Frequent problems</CardTitle>
              <CardDescription>Top issue types by volume.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue type</TableHead>
                    <TableHead className="w-24 text-right">Count</TableHead>
                    <TableHead className="min-w-[140px]">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.frequentProblems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-muted-foreground py-8 text-center text-sm"
                      >
                        No data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.frequentProblems.map((f) => (
                      <TableRow key={f.issueTypeId}>
                        <TableCell className="max-w-[20rem] wrap-break-word font-medium whitespace-normal">
                          {f.issueTypeName}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {f.count}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 min-w-[80px] flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary/70"
                                style={{
                                  width: `${Math.min(100, (f.count / maxFrequent) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-base">Resolution by team</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Resolved</TableHead>
                      <TableHead className="text-right">Avg</TableHead>
                      <TableHead className="text-right">p50</TableHead>
                      <TableHead className="text-right">p90</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.resolutionTime.byTeam.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-muted-foreground py-8 text-center text-sm"
                        >
                          No team breakdown.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.resolutionTime.byTeam.map((row, i) => (
                        <TableRow key={`${row.teamAssigned}-${i}`}>
                          <TableCell className="font-medium">
                            {humanizeTeam(row.teamAssigned)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.totalTickets}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.resolvedTickets}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatHours(row.avgResolutionHours)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatHours(row.p50ResolutionHours)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatHours(row.p90ResolutionHours)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-base">Team performance</CardTitle>
              <CardDescription>Tickets by status per team.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-10 min-w-[10rem] bg-card">
                        Team
                      </TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Resolved</TableHead>
                      {TICKET_STATUS_ORDER.map((st) => (
                        <TableHead
                          key={st}
                          className="whitespace-nowrap text-right text-xs"
                        >
                          {st}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.teamPerformance.byTeam.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3 + TICKET_STATUS_ORDER.length}
                          className="text-muted-foreground py-8 text-center text-sm"
                        >
                          No team performance data.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.teamPerformance.byTeam.map((row, i) => (
                        <TableRow key={`${row.teamAssigned}-perf-${i}`}>
                          <TableCell className="sticky left-0 z-10 bg-card font-medium">
                            {humanizeTeam(row.teamAssigned)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.totalTickets}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.resolvedTickets}
                          </TableCell>
                          {TICKET_STATUS_ORDER.map((st) => (
                            <TableCell
                              key={st}
                              className="text-right tabular-nums text-sm"
                            >
                              {row.statusCounts[st] ?? 0}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      ) : !loading ? (
        <p className="text-muted-foreground text-sm">
          No data loaded. Adjust filters and try Refresh.
        </p>
      ) : null}
    </div>
  )
}
