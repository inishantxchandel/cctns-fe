"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth, useAuthHydrated } from "@/hooks/use-auth"
import { type UserRole, isUserRole } from "@/types/roles"

type RoleGateProps = {
  allow: readonly UserRole[]
  children: React.ReactNode
}

export function RoleGate({ allow, children }: RoleGateProps) {
  const router = useRouter()
  const authHydrated = useAuthHydrated()
  const { user } = useAuth()

  const allowed =
    !!user &&
    isUserRole(user.role) &&
    allow.includes(user.role)

  useEffect(() => {
    if (!authHydrated) return
    if (user && !allowed) {
      router.replace("/tickets")
    }
  }, [authHydrated, user, allowed, router])

  if (!authHydrated || !user) {
    return (
      <div className="text-sm text-muted-foreground">Loading…</div>
    )
  }

  if (!allowed) {
    return (
      <div className="text-sm text-muted-foreground">Redirecting…</div>
    )
  }

  return <>{children}</>
}
