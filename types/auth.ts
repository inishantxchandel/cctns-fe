export type AuthRole = string

export type AuthDistrict = {
  id: string
  name: string
}

export type AuthUser = {
  id: string
  email: string
  role: AuthRole
  phone?: string | null
  district?: AuthDistrict | null
}

export type LoginResponse = {
  access_token: string
  user: AuthUser
}
