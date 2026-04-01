"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { loginRequest } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/errors"
import { useAuth } from "@/hooks/use-auth"

export function LoginScreen() {
  const router = useRouter()
  const { accessToken, user, setSession } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (accessToken && user) {
      router.replace("/tickets")
    }
  }, [accessToken, user, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const res = await loginRequest({ email, password })
      setSession(res.access_token, res.user)
      router.push("/tickets")
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_55%),linear-gradient(to_bottom,color-mix(in_oklab,var(--primary)_6%,var(--background)),var(--background))]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c41e3a] via-[#393185] to-[#5c5694]"
        aria-hidden
      />

      <div className="relative mb-8 flex flex-col items-center gap-2 text-center">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white/90 shadow-md ring-1 ring-[color-mix(in_oklab,var(--primary)_22%,transparent)]">
          <Image
            src="/punjab_police_logo.png"
            alt="Punjab Police"
            fill
            className="object-contain p-1"
            sizes="64px"
            priority
          />
        </div>
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Punjab Police
        </p>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          CCTNS Issue Tracking System
        </h1>
      </div>

      <Card className="relative w-full max-w-md border-border/80 shadow-md ring-1 ring-primary/[0.06]">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your issued email and password to access the portal.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <CardContent className="pt-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <FieldContent>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    inputMode="email"
                    placeholder="you@department.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={pending}
                    aria-invalid={!!error}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="login-password">Password</FieldLabel>
                <FieldContent>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={pending}
                    aria-invalid={!!error}
                  />
                </FieldContent>
              </Field>
              {error ? <FieldError>{error}</FieldError> : null}
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t bg-transparent pt-4">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
