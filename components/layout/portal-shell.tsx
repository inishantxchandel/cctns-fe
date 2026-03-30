"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { navItemsForRole, isNavActive } from "@/lib/navigation"
import { useAuth, useAuthHydrated } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { accessToken, user, clearSession } = useAuth()
  const authHydrated = useAuthHydrated()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (!authHydrated) return
    if (!accessToken || !user) {
      router.replace("/")
    }
  }, [authHydrated, accessToken, user, router])

  useEffect(() => {
    queueMicrotask(() => setMobileNavOpen(false))
  }, [pathname])

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mobileNavOpen])

  useEffect(() => {
    if (!mobileNavOpen) return
    const mq = window.matchMedia("(min-width: 768px)")
    if (mq.matches) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileNavOpen])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const onChange = () => {
      if (mq.matches) setMobileNavOpen(false)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  if (!authHydrated || !accessToken || !user) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  const items = navItemsForRole(user.role)

  return (
    <div className="flex min-h-full flex-1">
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        id="portal-sidebar"
        className={cn(
          "flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0",
          mobileNavOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
          !mobileNavOpen && "pointer-events-none md:pointer-events-auto"
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-white/95 shadow-sm ring-1 ring-sidebar-border/50">
            <Image
              src="/punjab_police_logo.png"
              alt="Punjab Police"
              fill
              className="object-contain p-0.5"
              sizes="36px"
              priority
            />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold tracking-wide text-sidebar-foreground/80 uppercase">
              Punjab Police
            </p>
            <p className="truncate text-sm font-medium">CCTNS</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Main">
          {items.map((item) => {
            const Icon = item.icon
            const active = isNavActive(pathname, item)
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="portal-sidebar"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? (
                <X className="size-5" aria-hidden />
              ) : (
                <Menu className="size-5" aria-hidden />
              )}
            </Button>
            <p className="min-w-0 truncate text-sm text-muted-foreground">
              <span className="text-foreground/90">{user.email}</span>
              <span className="mx-2 text-border">·</span>
              <span className="font-medium text-foreground/80">
                {user.role.replaceAll("_", " ")}
              </span>
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              clearSession()
              router.replace("/")
              router.refresh()
            }}
          >
            Sign out
          </Button>
        </header>
        <main className="flex-1 bg-muted/30 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
