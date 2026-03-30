"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { patchTicketStatus } from "@/lib/api/tickets"
import { ApiError } from "@/lib/api/errors"
import { ticketStatusSelectOptions } from "@/types/ticket-status"

type TicketStatusSelectProps = {
  ticketId: string
  status: string
  onUpdated: (next: string) => void
}

export function TicketStatusSelect({
  ticketId,
  status,
  onUpdated,
}: TicketStatusSelectProps) {
  const [patching, setPatching] = useState(false)

  const options = useMemo(
    () => ticketStatusSelectOptions(status),
    [status]
  )

  const selectItems = useMemo(
    () => options.map((opt) => ({ value: opt.value, label: opt.label })),
    [options]
  )

  async function handleChange(next: string | null) {
    if (next == null || next === status || patching) return
    setPatching(true)
    try {
      const resolved = await patchTicketStatus(ticketId, next)
      onUpdated(resolved)
      toast.success("Status updated")
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not update status"
      )
    } finally {
      setPatching(false)
    }
  }

  return (
    <Select
      value={status.length > 0 ? status : null}
      onValueChange={(v) => void handleChange(v)}
      disabled={patching}
      items={selectItems}
    >
      <SelectTrigger
        size="sm"
        className="min-w-42 max-w-full border-border bg-background font-normal shadow-sm"
        aria-label="Ticket status"
      >
        <SelectValue placeholder="Set status" />
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
