import { AnalyticsDashboardClient } from "@/components/analytics/analytics-dashboard-client"
import { RoleGate } from "@/components/layout/role-gate"
import { ROLES_ANALYTICS } from "@/lib/navigation"

/** District incharge, NOC Punjab team, NOC HQ only — others are redirected to tickets. */
export default function AnalyticsPage() {
  return (
    <RoleGate allow={ROLES_ANALYTICS}>
      <AnalyticsDashboardClient />
    </RoleGate>
  )
}
