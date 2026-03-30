export type TicketCommentAuthor = {
  id: string
  email: string
  role: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export type TicketComment = {
  id: string
  author: TicketCommentAuthor
  body: string
  createdAt: string
}

export type TicketCommentsResult = {
  items: TicketComment[]
  total: number
  page: number
  limit: number
  totalPages: number
}
