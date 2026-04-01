import type { DropdownOption } from "@/types/reference"
import { UserRole } from "@/types/roles"

/** Roles not shown in team filter or ticket team assignment pickers. */
const EXCLUDED_FROM_TEAM_PICKERS = new Set<string>([
  UserRole.SYSTEM_ADMIN,
  UserRole.CCTNS_INCHARGE_DISTRICT,
])

export function filterTeamsForTicketUi(teams: DropdownOption[]): DropdownOption[] {
  return teams.filter((t) => !EXCLUDED_FROM_TEAM_PICKERS.has(t.value))
}
