/** Backend JWT / API role values */
export enum UserRole {
  /** System Admin (SA) */
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  /** CCTNS Incharge (District) */
  CCTNS_INCHARGE_DISTRICT = "CCTNS_INCHARGE_DISTRICT",
  /** NOC Team (Punjab Police) */
  NOC_TEAM_PUNJAB_POLICE = "NOC_TEAM_PUNJAB_POLICE",
  /** DBA Team (Weexcel) */
  DBA_TEAM_WEEXCEL = "DBA_TEAM_WEEXCEL",
  /** NOC Incharge (HQ) */
  NOC_INCHARGE_HQ = "NOC_INCHARGE_HQ",
}

export function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole)
}
