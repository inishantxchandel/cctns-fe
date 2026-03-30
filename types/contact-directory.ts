export type ContactDirectoryPoliceStationRef = {
  id: string
  name: string
}

export type ContactDirectoryDistrictRef = {
  id: string
  name: string
}

export type ContactDirectoryUser = {
  id: string
  name: string
  role: string
  district: ContactDirectoryDistrictRef | null
  policeStationsAllocated: ContactDirectoryPoliceStationRef[]
  phone: string | null
  email: string
}

export type ContactDirectoryResult = {
  items: ContactDirectoryUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}
