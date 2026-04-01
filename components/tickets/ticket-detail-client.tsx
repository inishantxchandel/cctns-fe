"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { TicketCommentsSection } from "@/components/tickets/ticket-comments-section"
import { TicketStatusSelect } from "@/components/tickets/ticket-status-select"
import { TicketTeamSelect } from "@/components/tickets/ticket-team-select"
import { useAuth } from "@/hooks/use-auth"
import { fetchTicketById } from "@/lib/api/tickets"
import {
  canUpdateTicketStatus,
  canUpdateTicketTeam,
} from "@/lib/navigation"
import { ApiError } from "@/lib/api/errors"
import { cn } from "@/lib/utils"
import type { TicketDetail } from "@/types/ticket-detail"

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

function humanizeUnderscores(value: string) {
  return value ? value.replaceAll("_", " ") : "—"
}

function DetailRow({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid gap-1 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-4", className)}>
      <dt className="text-muted-foreground text-xs font-medium sm:pt-0.5">
        {label}
      </dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  )
}

type TicketDetailClientProps = {
  ticketId: string
}

export function TicketDetailClient({ ticketId }: TicketDetailClientProps) {
  const { user } = useAuth()
  const canChangeStatus = Boolean(user?.role && canUpdateTicketStatus(user.role))
  const canChangeTeam = Boolean(user?.role && canUpdateTicketTeam(user.role))

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const data = await fetchTicketById(ticketId)
      setTicket(data)
    } catch (e) {
      setTicket(null)
      if (e instanceof ApiError && e.status === 404) {
        setNotFound(true)
        setError(null)
      } else {
        setError(
          e instanceof Error ? e.message : "Something went wrong loading this ticket."
        )
      }
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-6 w-full max-w-md" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Link
          href="/tickets"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit gap-1 px-0 text-muted-foreground hover:text-foreground"
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back to tickets
        </Link>
        <div>
          <h1 className="font-heading text-lg font-semibold tracking-tight">
            Ticket not found
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {ticketId}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          This ticket does not exist or you do not have access to it.
        </p>
        <Link
          href="/tickets"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
        >
          Return to list
        </Link>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Link
          href="/tickets"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit gap-1 px-0 text-muted-foreground hover:text-foreground"
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back to tickets
        </Link>
        <div>
          <h1 className="font-heading text-lg font-semibold tracking-tight">
            Could not load ticket
          </h1>
          <p className="mt-1 text-sm text-destructive">{error}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => void load()}>
            Try again
          </Button>
          <Link
            href="/tickets"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to list
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/tickets"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "w-fit gap-1 px-0 text-muted-foreground hover:text-foreground"
        )}
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to tickets
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            {ticket.title}
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canChangeStatus ? (
            <TicketStatusSelect
              ticketId={ticket.id}
              status={ticket.status ?? ""}
              onUpdated={(next) =>
                setTicket((t) => (t ? { ...t, status: next } : t))
              }
            />
          ) : ticket.status ? (
            <Badge variant="outline" className="font-normal">
              {ticket.status}
            </Badge>
          ) : null}
          {canChangeTeam ? (
            <TicketTeamSelect
              ticketId={ticket.id}
              teamAssigned={ticket.teamAssigned ?? ""}
              onUpdated={(next) =>
                setTicket((t) => (t ? { ...t, teamAssigned: next } : t))
              }
            />
          ) : ticket.teamAssigned ? (
            <Badge variant="secondary" className="max-w-full truncate font-normal">
              {humanizeUnderscores(ticket.teamAssigned)}
            </Badge>
          ) : null}
        </div>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Description</CardTitle>
          <CardDescription>Details submitted with the ticket</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {ticket.description ? (
            <p className="text-sm whitespace-pre-wrap text-foreground">
              {ticket.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No description provided.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Issue &amp; location</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4">
            <dl className="grid gap-4">
              <DetailRow label="Issue type">{ticket.issueType.name}</DetailRow>
              <Separator />
              <DetailRow label="District">{ticket.district.name}</DetailRow>
              <DetailRow label="Police station">
                {ticket.policeStation.name}
              </DetailRow>
            </dl>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Reporter</CardTitle>
            <CardDescription>User who created this ticket</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4">
            <dl className="grid gap-4">
              <DetailRow label="Email">
                <span className="break-all">{ticket.createdBy.email}</span>
              </DetailRow>
              <DetailRow label="Role">
                {humanizeUnderscores(ticket.createdBy.role)}
              </DetailRow>
              {ticket.createdBy.phone ? (
                <DetailRow label="Phone">{ticket.createdBy.phone}</DetailRow>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Record</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="grid gap-4 sm:max-w-md">
            <DetailRow label="Created">{formatWhen(ticket.createdAt)}</DetailRow>
            <DetailRow label="Last updated">{formatWhen(ticket.updatedAt)}</DetailRow>
          </dl>
        </CardContent>
      </Card>

      <TicketCommentsSection ticketId={ticket.id} />
    </div>
  )
}
