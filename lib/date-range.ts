/** `yyyy-mm-dd` in local calendar for `<input type="date" />`. */
export function toDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Inclusive last 7 calendar days (today + 6 prior days). */
export function defaultLastSevenDaysRange(): { fromInput: string; toInput: string } {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 6)
  return {
    fromInput: toDateInputValue(from),
    toInput: toDateInputValue(to),
  }
}

/** Inclusive last 30 calendar days (today + 29 prior days). */
export function defaultLastThirtyDaysRange(): { fromInput: string; toInput: string } {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 29)
  return {
    fromInput: toDateInputValue(from),
    toInput: toDateInputValue(to),
  }
}

/** Start of local calendar day → ISO (API `createdFrom`). */
export function dateInputToISOStart(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return new Date(0).toISOString()
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
}

/** End of local calendar day → ISO (API `createdTo`). */
export function dateInputToISOEnd(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return new Date(0).toISOString()
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}
