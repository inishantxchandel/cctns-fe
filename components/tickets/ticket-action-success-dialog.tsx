"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const contentClassName =
  "max-w-[min(32rem,calc(100%-2rem))] gap-6 p-8 sm:max-w-lg"

type TicketActionSuccessDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
}

export function TicketActionSuccessDialog({
  open,
  onOpenChange,
  title,
  description,
}: TicketActionSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={contentClassName}
      >
        <DialogHeader className="gap-3 text-center sm:text-center">
          <DialogTitle className="font-heading text-2xl font-semibold tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            className="min-w-40"
            onClick={() => onOpenChange(false)}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
