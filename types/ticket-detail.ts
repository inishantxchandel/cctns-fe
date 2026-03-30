export type TicketDetailDistrict = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type TicketDetailPoliceStation = {
  id: string
  name: string
  district: TicketDetailDistrict
  createdAt: string
  updatedAt: string
}

export type TicketDetailIssueType = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type TicketDetailCreatedBy = {
  id: string
  email: string
  role: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export type TicketDetail = {
  id: string
  title: string
  description: string
  status: string
  teamAssigned: string
  createdAt: string
  updatedAt: string
  createdBy: TicketDetailCreatedBy
  district: TicketDetailDistrict
  policeStation: TicketDetailPoliceStation
  issueType: TicketDetailIssueType
}
