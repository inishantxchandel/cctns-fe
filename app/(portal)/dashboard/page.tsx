import { redirect } from "next/navigation"

/** Legacy route — home for the portal is the ticket queue. */
export default function DashboardPage() {
  redirect("/tickets")
}
