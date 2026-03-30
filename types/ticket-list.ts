export type TicketListItem = {
  id: string
  title: string
  description?: string
  status?: string
  districtName?: string
  policeStationName?: string
  issueTypeName?: string
  teamAssigned?: string
  createdByEmail?: string
  createdAt?: string
  updatedAt?: string
}

/** Matches GET /tickets body: `{ data: Ticket[], meta }` */
export type TicketsListResult = {
  items: TicketListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}
