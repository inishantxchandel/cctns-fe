"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { Label } from "@/components/ui/label"
import { SearchableCombobox } from "@/components/ui/searchable-combobox"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchTickets } from "@/lib/api/tickets"
import { fetchReferenceDropdowns } from "@/lib/api/reference"
import { ApiError } from "@/lib/api/errors"
import {
  dateInputToISOEnd,
  dateInputToISOStart,
  defaultLastSevenDaysRange,
} from "@/lib/date-range"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

const TICKETS_POLL_MS = 10_000
const TICKETS_FETCH_DEBOUNCE_MS = 320
import { UserRole } from "@/types/roles"
import type { ReferenceDropdowns } from "@/types/reference"
import type { TicketListItem, TicketsListResult } from "@/types/ticket-list"

const ALL = "__all__"

function withAllOption(
  options: { value: string; label: string }[],
  allLabel: string
) {
  return [{ value: ALL, label: allLabel }, ...options]
}

type FilterFieldsProps = {
  className?: string
  isDistrictLocked: boolean
  lockedDistrictLabel: string
  districtId: string | null
  onDistrictChange: (id: string) => void
  policeStationId: string | null
  onPoliceChange: (id: string) => void
  statusFilter: string | null
  onStatusChange: (v: string) => void
  teamFilter: string | null
  onTeamChange: (v: string) => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
  dropdowns: ReferenceDropdowns | null
  dropdownsLoading: boolean
  formDisabled: boolean
  districtOptions: { value: string; label: string }[]
  policeOptions: { value: string; label: string }[]
  statusOptions: { value: string; label: string }[]
  teamOptions: { value: string; label: string }[]
}

function TicketFilterFields({
  className,
  isDistrictLocked,
  lockedDistrictLabel,
  districtId,
  onDistrictChange,
  policeStationId,
  onPoliceChange,
  statusFilter,
  onStatusChange,
  teamFilter,
  onTeamChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  dropdownsLoading,
  formDisabled,
  districtOptions,
  policeOptions,
  statusOptions,
  teamOptions,
}: FilterFieldsProps) {
  const disabled = formDisabled || dropdownsLoading

  return (
    <FieldGroup
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}
    >
      <Field className="sm:col-span-2 lg:col-span-1">
        <FieldLabel>District</FieldLabel>
        <FieldContent>
          {isDistrictLocked ? (
            <Input
              readOnly
              disabled
              value={lockedDistrictLabel || "Your district"}
              className="cursor-not-allowed bg-muted/70"
              aria-label="District (fixed)"
            />
          ) : (
            <SearchableCombobox
              aria-label="District filter"
              options={withAllOption(districtOptions, "All districts")}
              value={districtId ?? ALL}
              onValueChange={(v) => onDistrictChange(v)}
              disabled={disabled}
              placeholder="All districts"
              searchPlaceholder="Search districts…"
              emptyMessage="No district found."
            />
          )}
        </FieldContent>
      </Field>

      <Field className="sm:col-span-2 lg:col-span-1">
        <FieldLabel>Police station</FieldLabel>
        <FieldContent>
          <SearchableCombobox
            aria-label="Police station filter"
            options={withAllOption(policeOptions, "All stations")}
            value={policeStationId ?? ALL}
            onValueChange={(v) => onPoliceChange(v)}
            disabled={disabled || (!isDistrictLocked && !districtId)}
            placeholder={
              !isDistrictLocked && !districtId
                ? "Select a district first"
                : policeOptions.length === 0
                  ? "No stations"
                  : "All stations"
            }
            searchPlaceholder="Search stations…"
            emptyMessage="No station found."
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>Status</FieldLabel>
        <FieldContent>
          <SearchableCombobox
            aria-label="Status filter"
            options={withAllOption(statusOptions, "All statuses")}
            value={statusFilter ?? ALL}
            onValueChange={(v) => onStatusChange(v)}
            disabled={disabled}
            placeholder="All statuses"
            searchPlaceholder="Search status…"
            emptyMessage="No status found."
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>Team</FieldLabel>
        <FieldContent>
          <SearchableCombobox
            aria-label="Team filter"
            options={withAllOption(teamOptions, "All teams")}
            value={teamFilter ?? ALL}
            onValueChange={(v) => onTeamChange(v)}
            disabled={disabled}
            placeholder="All teams"
            searchPlaceholder="Search teams…"
            emptyMessage="No team found."
          />
        </FieldContent>
      </Field>

      <Field className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
        <FieldLabel>Created between</FieldLabel>
        <FieldContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              disabled={disabled}
              className="min-w-0 sm:max-w-[11rem]"
              aria-label="From date"
            />
            <span className="hidden text-muted-foreground sm:inline">–</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              disabled={disabled}
              className="min-w-0 sm:max-w-[11rem]"
              aria-label="To date"
            />
          </div>
        </FieldContent>
      </Field>
    </FieldGroup>
  )
}

function formatWhen(iso?: string) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

function TicketCard({ ticket }: { ticket: TicketListItem }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug font-medium">
            <Link
              href={`/tickets/${ticket.id}`}
              className="text-foreground hover:text-primary hover:underline"
            >
              {ticket.title}
            </Link>
          </CardTitle>
          {ticket.status ? (
            <Badge variant="outline" className="shrink-0 font-normal">
              {ticket.status}
            </Badge>
          ) : null}
        </div>
        <CardDescription className="font-mono text-xs">
          #{ticket.id.slice(0, 8)}…
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 text-sm">
        {ticket.districtName ? (
          <p>
            <span className="text-muted-foreground">District: </span>
            {ticket.districtName}
          </p>
        ) : null}
        {ticket.policeStationName ? (
          <p>
            <span className="text-muted-foreground">Station: </span>
            {ticket.policeStationName}
          </p>
        ) : null}
        {ticket.issueTypeName ? (
          <p>
            <span className="text-muted-foreground">Issue type: </span>
            {ticket.issueTypeName}
          </p>
        ) : null}
        {ticket.teamAssigned ? (
          <p>
            <span className="text-muted-foreground">Team: </span>
            {ticket.teamAssigned.replaceAll("_", " ")}
          </p>
        ) : null}
        {ticket.createdByEmail ? (
          <p className="break-all">
            <span className="text-muted-foreground">Reporter: </span>
            {ticket.createdByEmail}
          </p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          {formatWhen(ticket.createdAt)}
        </p>
        <Link
          href={`/tickets/${ticket.id}`}
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "mt-2 inline-flex w-full items-center justify-center"
          )}
        >
          View details
        </Link>
      </CardContent>
    </Card>
  )
}

export function TicketsListClient() {
  const { user } = useAuth()
  const initialRange = useMemo(() => defaultLastSevenDaysRange(), [])

  const isDistrictIncharge = user?.role === UserRole.CCTNS_INCHARGE_DISTRICT
  const lockedDistrictId = user?.district?.id ?? null
  const lockedDistrictLabel = user?.district?.name ?? ""
  const isDistrictLocked =
    Boolean(isDistrictIncharge) && Boolean(lockedDistrictId)

  const [page, setPage] = useState(1)
  const limit = 20

  const [districtId, setDistrictId] = useState<string | null>(null)
  const [policeStationId, setPoliceStationId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [teamFilter, setTeamFilter] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState(initialRange.fromInput)
  const [dateTo, setDateTo] = useState(initialRange.toInput)

  const [dropdowns, setDropdowns] = useState<ReferenceDropdowns | null>(null)
  const [dropdownsLoading, setDropdownsLoading] = useState(true)

  const [result, setResult] = useState<TicketsListResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [pollingEnabled, setPollingEnabled] = useState(true)

  const pollingEnabledRef = useRef(pollingEnabled)
  const prevPollingEnabledRef = useRef(pollingEnabled)
  const paramsRef = useRef({
    page,
    limit,
    apiDistrictId: null as string | null | undefined,
    policeStationId,
    dateFrom,
    dateTo,
    statusFilter,
    teamFilter,
  })
  const pollTimerRef = useRef<number | null>(null)
  const pollAbortRef = useRef<AbortController | null>(null)
  const runSilentPollRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    pollingEnabledRef.current = pollingEnabled
  }, [pollingEnabled])

  const loadDropdowns = useCallback(async (districtForPs?: string | null) => {
    setDropdownsLoading(true)
    try {
      const data = await fetchReferenceDropdowns(districtForPs ?? undefined)
      setDropdowns(data)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not load filter options."
      )
      setDropdowns(null)
    } finally {
      setDropdownsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isDistrictLocked && lockedDistrictId) {
      setDistrictId(lockedDistrictId)
      void loadDropdowns(lockedDistrictId)
      return
    }
    setDistrictId(null)
    void loadDropdowns(undefined)
  }, [isDistrictLocked, lockedDistrictId, loadDropdowns])

  const bumpPage = useCallback(() => setPage(1), [])

  const onDistrictChange = useCallback(
    (v: string) => {
      bumpPage()
      const next = v === ALL ? null : v
      setDistrictId(next)
      setPoliceStationId(null)
      void loadDropdowns(next)
    },
    [bumpPage, loadDropdowns]
  )

  const onPoliceChange = useCallback(
    (v: string) => {
      bumpPage()
      setPoliceStationId(v === ALL ? null : v)
    },
    [bumpPage]
  )

  const onStatusChange = useCallback(
    (v: string) => {
      bumpPage()
      setStatusFilter(v === ALL ? null : v)
    },
    [bumpPage]
  )

  const onTeamChange = useCallback(
    (v: string) => {
      bumpPage()
      setTeamFilter(v === ALL ? null : v)
    },
    [bumpPage]
  )

  const onDateFromChange = useCallback(
    (v: string) => {
      bumpPage()
      setDateFrom(v)
    },
    [bumpPage]
  )

  const onDateToChange = useCallback(
    (v: string) => {
      bumpPage()
      setDateTo(v)
    },
    [bumpPage]
  )

  const resetFilters = useCallback(() => {
    const r = defaultLastSevenDaysRange()
    setDateFrom(r.fromInput)
    setDateTo(r.toInput)
    setPoliceStationId(null)
    setStatusFilter(null)
    setTeamFilter(null)
    setPage(1)
    if (isDistrictLocked && lockedDistrictId) {
      setDistrictId(lockedDistrictId)
      void loadDropdowns(lockedDistrictId)
    } else {
      setDistrictId(null)
      void loadDropdowns(undefined)
    }
  }, [isDistrictLocked, lockedDistrictId, loadDropdowns])

  const apiDistrictId = isDistrictLocked
    ? lockedDistrictId
    : districtId || undefined

  paramsRef.current = {
    page,
    limit,
    apiDistrictId,
    policeStationId,
    dateFrom,
    dateTo,
    statusFilter,
    teamFilter,
  }

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const scheduleNextPoll = useCallback(() => {
    clearPollTimer()
    if (!pollingEnabledRef.current) return
    pollTimerRef.current = window.setTimeout(() => {
      pollTimerRef.current = null
      if (!pollingEnabledRef.current) return
      void runSilentPollRef.current()
    }, TICKETS_POLL_MS)
  }, [clearPollTimer])

  const silentPoll = useCallback(async () => {
    const ac = new AbortController()
    pollAbortRef.current = ac
    const p = paramsRef.current
    try {
      const data = await fetchTickets(
        {
          page: p.page,
          limit: p.limit,
          districtId: p.apiDistrictId ?? null,
          policeStationId: p.policeStationId || undefined,
          createdFrom: dateInputToISOStart(p.dateFrom),
          createdTo: dateInputToISOEnd(p.dateTo),
          status: p.statusFilter || undefined,
          teamAssigned: p.teamFilter || undefined,
        },
        { signal: ac.signal }
      )
      if (!ac.signal.aborted) setResult(data)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
    } finally {
      if (!ac.signal.aborted && pollingEnabledRef.current) scheduleNextPoll()
    }
  }, [scheduleNextPoll])

  useEffect(() => {
    runSilentPollRef.current = silentPoll
  }, [silentPoll])

  useEffect(() => {
    if (!pollingEnabled) {
      clearPollTimer()
      pollAbortRef.current?.abort()
      prevPollingEnabledRef.current = false
      return
    }
    const wasOff = !prevPollingEnabledRef.current
    prevPollingEnabledRef.current = true
    if (wasOff) void silentPoll()
  }, [pollingEnabled, silentPoll, clearPollTimer])

  useEffect(() => {
    const ac = new AbortController()
    pollAbortRef.current?.abort()
    clearPollTimer()

    const t = setTimeout(() => {
      void (async () => {
        setLoading(true)
        try {
          const p = paramsRef.current
          const data = await fetchTickets(
            {
              page: p.page,
              limit: p.limit,
              districtId: p.apiDistrictId ?? null,
              policeStationId: p.policeStationId || undefined,
              createdFrom: dateInputToISOStart(p.dateFrom),
              createdTo: dateInputToISOEnd(p.dateTo),
              status: p.statusFilter || undefined,
              teamAssigned: p.teamFilter || undefined,
            },
            { signal: ac.signal }
          )
          if (!ac.signal.aborted) setResult(data)
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return
          toast.error(
            err instanceof ApiError ? err.message : "Could not load tickets."
          )
          if (!ac.signal.aborted) setResult(null)
        } finally {
          if (!ac.signal.aborted) setLoading(false)
          if (!ac.signal.aborted && pollingEnabledRef.current) scheduleNextPoll()
        }
      })()
    }, TICKETS_FETCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(t)
      ac.abort()
      clearPollTimer()
      pollAbortRef.current?.abort()
    }
  }, [
    page,
    limit,
    apiDistrictId,
    policeStationId,
    statusFilter,
    teamFilter,
    dateFrom,
    dateTo,
    clearPollTimer,
    scheduleNextPoll,
  ])

  const districtOptions = dropdowns?.districts ?? []
  const policeOptions = dropdowns?.policeStations ?? []
  const statusOptions = dropdowns?.statuses ?? []
  const teamOptions = dropdowns?.teams ?? []

  const items = result?.items ?? []
  const total = result?.total ?? 0
  const totalPages =
    result?.totalPages ??
    Math.max(1, Math.ceil(total / Math.max(limit, 1)))
  const fromIdx = total === 0 ? 0 : (page - 1) * limit + 1
  const toIdx = Math.min(page * limit, total)

  const formDisabled = dropdownsLoading || !dropdowns

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-lg font-semibold tracking-tight md:text-xl">
            Tickets
          </h1>
          <p className="text-sm text-muted-foreground">
            Search and filter the queue. Table on larger screens; cards on
            mobile.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "gap-2 md:hidden"
              )}
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              Filters
            </SheetTrigger>
            <SheetContent
              side="bottom"
              showCloseButton
              className="max-h-[90vh] overflow-y-auto rounded-t-2xl"
            >
              <SheetHeader className="px-5 pt-2 sm:px-6">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="px-5 sm:px-6">
                <TicketFilterFields
                  isDistrictLocked={isDistrictLocked}
                  lockedDistrictLabel={lockedDistrictLabel}
                  districtId={districtId}
                  onDistrictChange={onDistrictChange}
                  policeStationId={policeStationId}
                  onPoliceChange={onPoliceChange}
                  statusFilter={statusFilter}
                  onStatusChange={onStatusChange}
                  teamFilter={teamFilter}
                  onTeamChange={onTeamChange}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onDateFromChange={onDateFromChange}
                  onDateToChange={onDateToChange}
                  dropdowns={dropdowns}
                  dropdownsLoading={dropdownsLoading}
                  formDisabled={formDisabled}
                  districtOptions={districtOptions}
                  policeOptions={policeOptions}
                  statusOptions={statusOptions}
                  teamOptions={teamOptions}
                />
              </div>
              <SheetFooter className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setFiltersOpen(false)}
                >
                  Done
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={resetFilters}
          >
            Reset filters
          </Button>
        </div>
      </div>

      <Card className="hidden border-border/80 shadow-sm md:block">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Results update automatically. District incharge users are scoped to
            their district.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <TicketFilterFields
            isDistrictLocked={isDistrictLocked}
            lockedDistrictLabel={lockedDistrictLabel}
            districtId={districtId}
            onDistrictChange={onDistrictChange}
            policeStationId={policeStationId}
            onPoliceChange={onPoliceChange}
            statusFilter={statusFilter}
            onStatusChange={onStatusChange}
            teamFilter={teamFilter}
            onTeamChange={onTeamChange}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={onDateFromChange}
            onDateToChange={onDateToChange}
            dropdowns={dropdowns}
            dropdownsLoading={dropdownsLoading}
            formDisabled={formDisabled}
            districtOptions={districtOptions}
            policeOptions={policeOptions}
            statusOptions={statusOptions}
            teamOptions={teamOptions}
          />
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">Results</CardTitle>
            <CardDescription>
              {loading
                ? "Loading…"
                : total === 0
                  ? "No tickets match these filters."
                  : `Showing ${fromIdx}–${toIdx} of ${total}`}
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:pt-0.5">
            <Label
              htmlFor="tickets-auto-refresh"
              className="text-muted-foreground cursor-pointer font-normal"
            >
              Auto-refresh
            </Label>
            <button
              id="tickets-auto-refresh"
              type="button"
              role="switch"
              aria-checked={pollingEnabled}
              aria-label="Auto-refresh ticket list every 10 seconds"
              onClick={() => setPollingEnabled((v) => !v)}
              className={cn(
                "relative inline-flex h-7 w-11 shrink-0 items-center rounded-full border border-transparent px-0.5 transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                pollingEnabled
                  ? "bg-primary"
                  : "bg-muted dark:bg-input/50"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none block size-5 rounded-full bg-background shadow-sm ring-1 ring-border/60 transition-transform",
                  pollingEnabled ? "translate-x-5" : "translate-x-0"
                )}
                aria-hidden
              />
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-0">
          {loading ? (
            <div className="space-y-3 p-4 md:p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-0 w-[22%]">Title</TableHead>
                      <TableHead className="hidden min-w-0 md:table-cell md:w-[14%]">
                        Issue type
                      </TableHead>
                      <TableHead className="hidden min-w-0 lg:table-cell lg:w-[10%]">
                        District
                      </TableHead>
                      <TableHead className="hidden min-w-0 xl:table-cell xl:w-[12%]">
                        Station
                      </TableHead>
                      <TableHead className="w-24 shrink-0">Status</TableHead>
                      <TableHead className="hidden min-w-0 lg:table-cell lg:w-[12%]">
                        Team
                      </TableHead>
                      <TableHead className="hidden min-w-0 xl:table-cell xl:w-[14%]">
                        Reporter
                      </TableHead>
                      <TableHead className="w-38 min-w-38 shrink-0 text-right">
                        Created
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No tickets to display.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="min-w-0 whitespace-normal font-medium">
                            <Link
                              href={`/tickets/${row.id}`}
                              className="line-clamp-2 block text-foreground hover:text-primary hover:underline"
                            >
                              {row.title}
                            </Link>
                          </TableCell>
                          <TableCell className="hidden min-w-0 whitespace-normal md:table-cell text-muted-foreground text-xs">
                            <span className="line-clamp-2 block">
                              {row.issueTypeName ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden min-w-0 lg:table-cell text-muted-foreground">
                            <span className="block truncate" title={row.districtName}>
                              {row.districtName ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden min-w-0 xl:table-cell text-muted-foreground">
                            <span
                              className="block truncate"
                              title={row.policeStationName}
                            >
                              {row.policeStationName ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="shrink-0">
                            {row.status ? (
                              <Badge variant="outline" className="font-normal">
                                {row.status}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="hidden min-w-0 lg:table-cell text-muted-foreground text-xs">
                            <span
                              className="block truncate"
                              title={
                                row.teamAssigned
                                  ? row.teamAssigned.replaceAll("_", " ")
                                  : undefined
                              }
                            >
                              {row.teamAssigned
                                ? row.teamAssigned.replaceAll("_", " ")
                                : "—"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden min-w-0 xl:table-cell text-muted-foreground text-xs">
                            <span
                              className="block max-w-full truncate"
                              title={row.createdByEmail ?? undefined}
                            >
                              {row.createdByEmail ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="w-38 min-w-38 shrink-0 whitespace-nowrap text-right text-muted-foreground text-xs">
                            {formatWhen(row.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {items.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No tickets to display.
                  </p>
                ) : (
                  items.map((t) => <TicketCard key={t.id} ticket={t} />)
                )}
              </div>
            </>
          )}

          {!loading && total > 0 ? (
            <div className="flex flex-col gap-4 border-t border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
              <p className="text-center text-sm text-muted-foreground sm:text-left">
                Page {page} of {totalPages}
              </p>
              <div className="flex justify-center gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
