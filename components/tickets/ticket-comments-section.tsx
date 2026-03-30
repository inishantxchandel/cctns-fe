"use client"

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  createTicketComment,
  fetchTicketComments,
} from "@/lib/api/ticket-comments"
import { ApiError } from "@/lib/api/errors"
import { cn } from "@/lib/utils"
import type { TicketComment } from "@/types/ticket-comment"

const COMMENTS_PAGE_SIZE = 20

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

function CommentItem({ comment }: { comment: TicketComment }) {
  return (
    <article
      className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3 sm:px-4"
      aria-labelledby={`comment-${comment.id}-author`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
        <div className="min-w-0">
          <p
            id={`comment-${comment.id}-author`}
            className="text-sm font-medium break-all"
          >
            {comment.author.email}
          </p>
          {comment.author.role ? (
            <p className="text-muted-foreground text-xs">
              {humanizeUnderscores(comment.author.role)}
            </p>
          ) : null}
        </div>
        <time
          className="text-muted-foreground shrink-0 text-xs whitespace-nowrap"
          dateTime={comment.createdAt}
        >
          {formatWhen(comment.createdAt)}
        </time>
      </div>
      <p className="mt-2 text-sm whitespace-pre-wrap">{comment.body}</p>
    </article>
  )
}

type TicketCommentsSectionProps = {
  ticketId: string
  className?: string
}

export function TicketCommentsSection({
  ticketId,
  className,
}: TicketCommentsSectionProps) {
  const [items, setItems] = useState<TicketComment[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setListError(null)
    try {
      const result = await fetchTicketComments(ticketId, {
        page,
        limit: COMMENTS_PAGE_SIZE,
      })
      setItems(result.items)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (e) {
      setItems([])
      setTotal(0)
      setTotalPages(1)
      setListError(
        e instanceof Error ? e.message : "Could not load comments."
      )
    } finally {
      setLoading(false)
    }
  }, [ticketId, page])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text || submitting) return

    setSubmitting(true)
    try {
      await createTicketComment(ticketId, { body: text })
      setBody("")
      toast.success("Comment added")
      if (page !== 1) {
        setPage(1)
      } else {
        const result = await fetchTicketComments(ticketId, {
          page: 1,
          limit: COMMENTS_PAGE_SIZE,
        })
        setItems(result.items)
        setTotal(result.total)
        setTotalPages(result.totalPages)
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not add comment."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className={cn("border-border/80 shadow-sm", className)}>
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Comments</CardTitle>
          {!loading && total > 0 ? (
            <Badge variant="secondary" className="font-normal">
              {total} {total === 1 ? "comment" : "comments"}
            </Badge>
          ) : null}
        </div>
        <CardDescription>
          Updates and notes on this ticket (paged from your API).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-4">
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor={`ticket-comment-${ticketId}`}>Add a comment</Label>
            <Textarea
              id={`ticket-comment-${ticketId}`}
              placeholder="Write an update for this ticket…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              disabled={submitting}
              className="min-h-22 resize-y"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !body.trim()}
            >
              {submitting ? "Posting…" : "Post comment"}
            </Button>
          </div>
        </form>

        <Separator />

        {loading ? (
          <div className="grid gap-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : listError ? (
          <p className="text-destructive text-sm">{listError}</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-2 text-center text-sm">
            No comments yet. Be the first to add one.
          </p>
        ) : (
          <ul className="grid list-none gap-3 p-0">
            {items.map((c) => (
              <li key={c.id}>
                <CommentItem comment={c} />
              </li>
            ))}
          </ul>
        )}

        {!loading && !listError && total > 0 && totalPages > 1 ? (
          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
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
  )
}
