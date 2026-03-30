import {
  BarChart3,
  type LucideIcon,
  Mail,
  PlusCircle,
  Ticket,
} from "lucide-react"

import { UserRole, isUserRole } from "@/types/roles"

export type NavItem = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  /** Roles that see this item. Empty = all authenticated users. */
  roles?: readonly UserRole[]
}

/**
 * Portal navigation aligned with SRS / role matrix.
 * Ticket detail lives under /tickets/[id] (no separate top-level link).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "create-ticket",
    label: "Create ticket",
    href: "/tickets/new",
    icon: PlusCircle,
    roles: [
      UserRole.SYSTEM_ADMIN,
      UserRole.CCTNS_INCHARGE_DISTRICT,
      UserRole.NOC_INCHARGE_HQ,
    ],
  },
  {
    id: "tickets",
    label: "Tickets",
    href: "/tickets",
    icon: Ticket,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: [
      UserRole.CCTNS_INCHARGE_DISTRICT,
      UserRole.NOC_TEAM_PUNJAB_POLICE,
      UserRole.NOC_INCHARGE_HQ,
    ],
  },
  {
    id: "contact",
    label: "Contact directory",
    href: "/contact",
    icon: Mail,
  },
] as const

/** Roles allowed to open the create-ticket screen (matches nav). */
export const ROLES_CREATE_TICKET: readonly UserRole[] = [
  UserRole.SYSTEM_ADMIN,
  UserRole.CCTNS_INCHARGE_DISTRICT,
  UserRole.NOC_INCHARGE_HQ,
]

/**
 * Roles allowed to open `/analytics` (matches nav).
 * CCTNS Incharge (District), NOC Team (Punjab Police), NOC Incharge (HQ) only —
 * not System Admin, DBA, etc.
 */
export const ROLES_ANALYTICS: readonly UserRole[] = [
  UserRole.CCTNS_INCHARGE_DISTRICT,
  UserRole.NOC_TEAM_PUNJAB_POLICE,
  UserRole.NOC_INCHARGE_HQ,
]

/**
 * Roles that may change ticket status on the detail screen.
 */
export const ROLES_UPDATE_TICKET_STATUS: readonly UserRole[] = [
  UserRole.NOC_TEAM_PUNJAB_POLICE,
  UserRole.DBA_TEAM_WEEXCEL,
  UserRole.NOC_INCHARGE_HQ,
]

export function canUpdateTicketStatus(role: string): boolean {
  return isUserRole(role) && ROLES_UPDATE_TICKET_STATUS.includes(role)
}

/** Roles that may change assigned team on the ticket detail screen. */
export const ROLES_UPDATE_TICKET_TEAM: readonly UserRole[] = [
  UserRole.NOC_TEAM_PUNJAB_POLICE,
  UserRole.NOC_INCHARGE_HQ,
]

export function canUpdateTicketTeam(role: string): boolean {
  return isUserRole(role) && ROLES_UPDATE_TICKET_TEAM.includes(role)
}

export function navItemsForRole(role: string): NavItem[] {
  const known = isUserRole(role) ? role : null

  return NAV_ITEMS.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    if (!known) return false
    return item.roles.includes(known)
  })
}

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.id === "create-ticket") {
    return pathname === "/tickets/new" || pathname.startsWith("/tickets/new/")
  }
  if (item.id === "tickets") {
    if (pathname.startsWith("/tickets/new")) return false
    return pathname === "/tickets" || pathname.startsWith("/tickets/")
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
