import { TicketDetailClient } from "@/components/tickets/ticket-detail-client"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params

  return <TicketDetailClient ticketId={id} />
}
