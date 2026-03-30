import { RoleGate } from "@/components/layout/role-gate"
import { CreateTicketForm } from "@/components/tickets/create-ticket-form"
import { ROLES_CREATE_TICKET } from "@/lib/navigation"

export default function CreateTicketPage() {
  return (
    <RoleGate allow={ROLES_CREATE_TICKET}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="font-heading text-lg font-semibold tracking-tight">
            Create ticket
          </h1>
          <p className="text-sm text-muted-foreground">
            Submit a new CCTNS issue for your district and police station.
          </p>
        </div>
        <CreateTicketForm />
      </div>
    </RoleGate>
  )
}
