"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchReferenceDropdowns } from "@/lib/api/reference"
import { patchTicketTeam } from "@/lib/api/tickets"
import { ApiError } from "@/lib/api/errors"
import { cn } from "@/lib/utils"
import type { DropdownOption } from "@/types/reference"

/** Readable label when API value is missing from reference dropdowns. */
function fallbackTeamLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(" ")
}

function mergeTeamOptions(
  teams: DropdownOption[],
  currentTeam: string
): DropdownOption[] {
  const list = [...teams]
  if (currentTeam && !list.some((o) => o.value === currentTeam)) {
    list.unshift({
      value: currentTeam,
      label: fallbackTeamLabel(currentTeam),
    })
  }
  return list
}

type TicketTeamSelectProps = {
  ticketId: string
  teamAssigned: string
  onUpdated: (next: string) => void
}

export function TicketTeamSelect({
  ticketId,
  teamAssigned,
  onUpdated,
}: TicketTeamSelectProps) {
  const [patching, setPatching] = useState(false)
  const [teamOptions, setTeamOptions] = useState<DropdownOption[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)

  const loadTeams = useCallback(async () => {
    setOptionsLoading(true)
    try {
      const d = await fetchReferenceDropdowns()
      setTeamOptions(d.teams)
    } catch (e) {
      setTeamOptions([])
      toast.error(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load teams"
      )
    } finally {
      setOptionsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTeams()
  }, [loadTeams])

  const options = useMemo(
    () => mergeTeamOptions(teamOptions, teamAssigned),
    [teamOptions, teamAssigned]
  )

  const selectItems = useMemo(
    () => options.map((opt) => ({ value: opt.value, label: opt.label })),
    [options]
  )

  async function handleChange(next: string | null) {
    if (next == null || next === teamAssigned || patching) return
    setPatching(true)
    try {
      const resolved = await patchTicketTeam(ticketId, next)
      onUpdated(resolved)
      toast.success("Team updated")
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not update team"
      )
    } finally {
      setPatching(false)
    }
  }

  if (optionsLoading && options.length === 0) {
    return <Skeleton className="h-7 min-w-42 max-w-full rounded-lg" />
  }

  return (
    <Select
      value={teamAssigned.length > 0 ? teamAssigned : null}
      onValueChange={(v) => void handleChange(v)}
      disabled={patching || options.length === 0}
      items={selectItems}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          "min-w-42 max-w-full border-border bg-background font-normal shadow-sm",
          options.length === 0 && "opacity-80"
        )}
        aria-label="Assigned team"
      >
        <SelectValue placeholder="Assign team" />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-(--anchor-width)">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
