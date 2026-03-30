export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

export function getErrorMessageFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null
  const o = body as Record<string, unknown>
  if (typeof o.message === "string") return o.message
  if (typeof o.error === "string") return o.error
  if (Array.isArray(o.message) && o.message.every((m) => typeof m === "string")) {
    return o.message.join(", ")
  }
  return null
}
