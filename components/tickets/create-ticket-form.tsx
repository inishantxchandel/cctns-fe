"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea"
import { fetchReferenceDropdowns } from "@/lib/api/reference"
import { createTicket } from "@/lib/api/tickets"
import { ApiError } from "@/lib/api/errors"
import { useAuth } from "@/hooks/use-auth"
import { UserRole } from "@/types/roles"
import type { ReferenceDropdowns } from "@/types/reference"

const emptyForm = {
  title: "",
  description: "",
  issueTypeId: null as string | null,
  policeStationId: null as string | null,
}

export function CreateTicketForm() {
  const { user } = useAuth()

  const isDistrictIncharge = user?.role === UserRole.CCTNS_INCHARGE_DISTRICT
  const lockedDistrictId = user?.district?.id ?? null
  const lockedDistrictLabel = user?.district?.name ?? ""
  const districtInchargeBlocked =
    Boolean(isDistrictIncharge) && !lockedDistrictId
  const isDistrictLocked =
    Boolean(isDistrictIncharge) && Boolean(lockedDistrictId)

  const [dropdowns, setDropdowns] = useState<ReferenceDropdowns | null>(null)
  const [dropdownsLoading, setDropdownsLoading] = useState(true)

  const [title, setTitle] = useState(emptyForm.title)
  const [description, setDescription] = useState(emptyForm.description)
  const [districtId, setDistrictId] = useState<string | null>(null)
  const [issueTypeId, setIssueTypeId] = useState<string | null>(null)
  const [policeStationId, setPoliceStationId] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)

  const loadDropdowns = useCallback(async (districtForPs?: string | null) => {
    setDropdownsLoading(true)
    try {
      const data = await fetchReferenceDropdowns(districtForPs ?? undefined)
      setDropdowns(data)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Could not load form options."
      toast.error(msg)
      setDropdowns(null)
    } finally {
      setDropdownsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (districtInchargeBlocked) {
      setDistrictId(null)
      setPoliceStationId(null)
      setIssueTypeId(null)
      setDropdowns(null)
      setDropdownsLoading(false)
      return
    }
    if (isDistrictLocked && lockedDistrictId) {
      setDistrictId(lockedDistrictId)
      void loadDropdowns(lockedDistrictId)
      return
    }
    setDistrictId(null)
    void loadDropdowns(undefined)
  }, [
    districtInchargeBlocked,
    isDistrictLocked,
    lockedDistrictId,
    loadDropdowns,
  ])

  async function resetAfterSuccess() {
    setTitle(emptyForm.title)
    setDescription(emptyForm.description)
    setIssueTypeId(emptyForm.issueTypeId)
    setPoliceStationId(emptyForm.policeStationId)
    if (isDistrictLocked && lockedDistrictId) {
      setDistrictId(lockedDistrictId)
      await loadDropdowns(lockedDistrictId)
    } else {
      setDistrictId(null)
      await loadDropdowns(undefined)
    }
  }

  async function onDistrictChange(value: string) {
    if (isDistrictLocked) return
    setDistrictId(value)
    setPoliceStationId(null)
    await loadDropdowns(value)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!districtId || !policeStationId || !issueTypeId) {
      toast.error("Please fill district, police station, and issue type.")
      return
    }
    setSubmitting(true)
    try {
      await createTicket({
        title: title.trim(),
        description: description.trim(),
        districtId,
        policeStationId,
        issueTypeId,
      })
      toast.success("Ticket created successfully.")
      await resetAfterSuccess()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not create ticket."
      )
    } finally {
      setSubmitting(false)
    }
  }

  const policeOptions = dropdowns?.policeStations ?? []
  const issueTypeOptions = dropdowns?.issueTypes ?? []
  const districtOptions = dropdowns?.districts ?? []

  const canPickPolice =
    Boolean(districtId) && policeOptions.length > 0 && !dropdownsLoading

  const formDisabled =
    dropdownsLoading || !dropdowns || districtInchargeBlocked

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b border-border/60">
        <CardTitle>New ticket</CardTitle>
        <CardDescription>
          Describe the issue and link it to the correct police station.
        </CardDescription>
        {districtInchargeBlocked ? (
          <p className="pt-2 text-sm text-destructive">
            Your profile has no district assigned. Ask an administrator to fix
            your account before creating tickets.
          </p>
        ) : null}
      </CardHeader>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <CardContent className="pt-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ticket-title">Title</FieldLabel>
              <FieldContent>
                <Input
                  id="ticket-title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short summary of the issue"
                  required
                  disabled={formDisabled || submitting}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="ticket-description">Description</FieldLabel>
              <FieldContent>
                <Textarea
                  id="ticket-description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Steps to reproduce, expected behaviour, and any error messages."
                  required
                  rows={5}
                  disabled={formDisabled || submitting}
                  className="min-h-28"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>District</FieldLabel>
              <FieldContent>
                {isDistrictLocked ? (
                  <Input
                    readOnly
                    disabled
                    value={lockedDistrictLabel || "Your district"}
                    aria-label="District (fixed for your role)"
                    className="cursor-not-allowed bg-muted/70"
                  />
                ) : (
                  <SearchableCombobox
                    aria-label="District"
                    options={districtOptions}
                    value={districtId}
                    onValueChange={(v) => void onDistrictChange(v)}
                    disabled={formDisabled || submitting}
                    placeholder="Select district"
                    searchPlaceholder="Search districts…"
                    emptyMessage="No district found."
                  />
                )}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Police station</FieldLabel>
              <FieldContent>
                <SearchableCombobox
                  aria-label="Police station"
                  options={policeOptions}
                  value={policeStationId}
                  onValueChange={(v) => setPoliceStationId(v)}
                  disabled={
                    !canPickPolice || submitting || !districtId
                  }
                  placeholder={
                    !districtId
                      ? "Select a district first"
                      : policeOptions.length === 0
                        ? "No stations for this district"
                        : "Select police station"
                  }
                  searchPlaceholder="Search police stations…"
                  emptyMessage="No station found."
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Issue type</FieldLabel>
              <FieldContent>
                <SearchableCombobox
                  aria-label="Issue type"
                  options={issueTypeOptions}
                  value={issueTypeId}
                  onValueChange={(v) => setIssueTypeId(v)}
                  disabled={formDisabled || submitting}
                  placeholder="Select issue type"
                  searchPlaceholder="Search issue types…"
                  emptyMessage="No issue type found."
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t bg-transparent pt-4">
          <Button
            type="submit"
            className="w-full"
            disabled={
              formDisabled ||
              districtInchargeBlocked ||
              submitting ||
              !title.trim() ||
              !description.trim() ||
              !districtId ||
              !policeStationId ||
              !issueTypeId
            }
          >
            {submitting ? "Submitting…" : "Submit ticket"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
