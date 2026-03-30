/** Canonical ticket lifecycle values (must match API `PATCH /tickets/:id/status`). */
export enum TicketStatus {
  PENDING = "Pending",
  IN_PROGRESS = "In Progress",
  FORWARDED = "Forwarded",
  RESOLVED = "Resolved",
  CLOSED = "Closed",
}

/** Stable order for selects and filters. */
export const TICKET_STATUS_ORDER: readonly TicketStatus[] = [
  TicketStatus.PENDING,
  TicketStatus.IN_PROGRESS,
  TicketStatus.FORWARDED,
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED,
]

export function isTicketStatus(value: string): value is TicketStatus {
  return TICKET_STATUS_ORDER.some((s) => s === value)
}

/** Options for UI selects; appends current value if API returns an unknown status. */
export function ticketStatusSelectOptions(
  currentStatus: string
): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = TICKET_STATUS_ORDER.map(
    (s) => ({ value: s, label: s })
  )
  if (currentStatus && !opts.some((o) => o.value === currentStatus)) {
    opts.push({ value: currentStatus, label: currentStatus })
  }
  return opts
}
