"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
import { SearchableCombobox } from "@/components/ui/searchable-combobox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchContactDirectory } from "@/lib/api/contact-directory"
import { fetchReferenceDropdowns } from "@/lib/api/reference"
import { ApiError } from "@/lib/api/errors"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { UserRole } from "@/types/roles"
import type { ReferenceDropdowns } from "@/types/reference"
import type { ContactDirectoryUser } from "@/types/contact-directory"

const ALL = "__all__"
const PAGE_SIZE = 20

function withAllOption(
  options: { value: string; label: string }[],
  allLabel: string
) {
  return [{ value: ALL, label: allLabel }, ...options]
}

function humanizeRole(role: string) {
  return role ? role.replaceAll("_", " ") : "—"
}

/** Multiline-safe chip (Badge uses fixed height + nowrap and clips long roles). */
function RoleChip({ children }: { children: string }) {
  return (
    <span className="inline-block max-w-full rounded-lg bg-secondary px-2.5 py-1.5 text-left text-xs leading-snug wrap-break-word font-medium text-secondary-foreground ring-1 ring-foreground/10">
      {children}
    </span>
  )
}

function stationsSummary(row: ContactDirectoryUser): string {
  const names = row.policeStationsAllocated.map((p) => p.name)
  if (names.length === 0) return "—"
  if (names.length <= 2) return names.join(", ")
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`
}

function stationsTitle(row: ContactDirectoryUser): string | undefined {
  if (row.policeStationsAllocated.length === 0) return undefined
  return row.policeStationsAllocated.map((p) => p.name).join("\n")
}

function ContactCard({ row }: { row: ContactDirectoryUser }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="space-y-2 pb-2">
        <CardTitle className="text-base font-medium">{row.name}</CardTitle>
        <div>
          <RoleChip>{humanizeRole(row.role)}</RoleChip>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs font-medium">Email</p>
          <p className="break-all">{row.email || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">Phone</p>
          <p>{row.phone ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">District</p>
          <p>{row.district?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            Police stations
          </p>
          <p className="whitespace-pre-wrap" title={stationsTitle(row)}>
            {stationsSummary(row)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ContactDirectoryClient() {
  const { user } = useAuth()
  const isDistrictIncharge = user?.role === UserRole.CCTNS_INCHARGE_DISTRICT
  const lockedDistrictId = user?.district?.id ?? null
  const lockedDistrictLabel = user?.district?.name ?? ""
  const isDistrictLocked =
    Boolean(isDistrictIncharge) && Boolean(lockedDistrictId)

  const [page, setPage] = useState(1)
  const [districtId, setDistrictId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [searchDebounced, setSearchDebounced] = useState("")

  const [dropdowns, setDropdowns] = useState<ReferenceDropdowns | null>(null)
  const [dropdownsLoading, setDropdownsLoading] = useState(true)

  const [items, setItems] = useState<ContactDirectoryUser[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 400)
    return () => clearTimeout(t)
  }, [search])

  const loadDropdowns = useCallback(async () => {
    setDropdownsLoading(true)
    try {
      const data = await fetchReferenceDropdowns()
      setDropdowns(data)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not load districts."
      )
      setDropdowns(null)
    } finally {
      setDropdownsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDropdowns()
  }, [loadDropdowns])

  useEffect(() => {
    if (isDistrictLocked && lockedDistrictId) {
      setDistrictId(lockedDistrictId)
    } else if (!isDistrictLocked) {
      setDistrictId(null)
    }
  }, [isDistrictLocked, lockedDistrictId])

  useEffect(() => {
    setPage(1)
  }, [searchDebounced])

  const apiDistrictId = isDistrictLocked
    ? lockedDistrictId
    : districtId || undefined

  useEffect(() => {
    const ac = new AbortController()
    void (async () => {
      setLoading(true)
      try {
        const data = await fetchContactDirectory(
          {
            page,
            limit: PAGE_SIZE,
            districtId: apiDistrictId ?? null,
            search: searchDebounced || null,
          },
          { signal: ac.signal }
        )
        if (!ac.signal.aborted) {
          setItems(data.items)
          setTotal(data.total)
          setTotalPages(data.totalPages)
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        if (!ac.signal.aborted) {
          toast.error(
            err instanceof ApiError
              ? err.message
              : "Could not load contact directory."
          )
          setItems([])
          setTotal(0)
          setTotalPages(1)
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    })()
    return () => ac.abort()
  }, [page, apiDistrictId, searchDebounced])

  const districtOptions = dropdowns?.districts ?? []

  const onDistrictChange = useCallback((v: string) => {
    setPage(1)
    setDistrictId(v === ALL ? null : v)
  }, [])

  const resetFilters = useCallback(() => {
    setSearch("")
    setSearchDebounced("")
    setPage(1)
    if (isDistrictLocked && lockedDistrictId) {
      setDistrictId(lockedDistrictId)
    } else {
      setDistrictId(null)
    }
  }, [isDistrictLocked, lockedDistrictId])

  const formDisabled = dropdownsLoading || !dropdowns

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-lg font-semibold tracking-tight md:text-xl">
          Contact directory
        </h1>
        <p className="text-sm text-muted-foreground">
          Find contacts by district, name, phone, or email.
        </p>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Search</CardTitle>
          <CardDescription>
            Narrow the list by district or search. Results load page by page.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field>
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
                    onValueChange={onDistrictChange}
                    disabled={formDisabled}
                    placeholder="All districts"
                    searchPlaceholder="Search districts…"
                    emptyMessage="No district found."
                  />
                )}
              </FieldContent>
            </Field>
            <Field className="sm:col-span-2 lg:col-span-2">
              <FieldLabel htmlFor="contact-search">Search</FieldLabel>
              <FieldContent>
                <Input
                  id="contact-search"
                  type="search"
                  placeholder="Name, phone, email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoComplete="off"
                />
              </FieldContent>
            </Field>
          </FieldGroup>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={formDisabled}
            >
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-col gap-1 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Contacts</CardTitle>
            <CardDescription>
              {!loading && total > 0
                ? `Showing ${Math.min((page - 1) * PAGE_SIZE + 1, total)}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
                : loading
                  ? "Loading…"
                  : "No results"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && items.length === 0 ? (
            <div className="space-y-3 p-4 md:p-6">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-0 w-[16%]">Name</TableHead>
                      <TableHead className="min-w-44 w-[22%]">Role</TableHead>
                      <TableHead className="min-w-0 w-[12%]">District</TableHead>
                      <TableHead className="w-[9%]">Phone</TableHead>
                      <TableHead className="min-w-0 w-[20%]">Email</TableHead>
                      <TableHead className="min-w-0">Stations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-muted-foreground py-10 text-center text-sm"
                        >
                          No contacts match your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="min-w-0 align-top whitespace-normal font-medium">
                            {row.name}
                          </TableCell>
                          <TableCell className="min-w-0 align-top whitespace-normal">
                            <RoleChip>{humanizeRole(row.role)}</RoleChip>
                          </TableCell>
                          <TableCell className="min-w-0 align-top whitespace-normal text-muted-foreground text-sm">
                            <span className="line-clamp-2">
                              {row.district?.name ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap text-muted-foreground text-sm">
                            {row.phone ?? "—"}
                          </TableCell>
                          <TableCell className="min-w-0 align-top whitespace-normal text-sm">
                            <span className="break-all">{row.email}</span>
                          </TableCell>
                          <TableCell
                            className="min-w-0 align-top whitespace-normal text-muted-foreground text-xs"
                            title={stationsTitle(row)}
                          >
                            <span className="line-clamp-3">
                              {stationsSummary(row)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {items.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    No contacts match your filters.
                  </p>
                ) : (
                  items.map((row) => (
                    <ContactCard key={row.id} row={row} />
                  ))
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
