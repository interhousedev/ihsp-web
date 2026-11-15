"use client"

import { RequireAuth, useSession, useSilentSignIn } from "@ihsp/auth"
import { PageLoading } from "@ihsp/features-core"
import type { ReactNode } from "react"

/**
 * `auth`: the page needs a sign-in (anonymous visitors are sent to the login). `public`: guests may read it; the shell
 * waits for the session check, joins a platform session silently and otherwise leaves the visitor anonymous.
 */
export type Access = "auth" | "public"

export function AccessGate({ access, children }: { access: Access; children: ReactNode }) {
  if (access === "auth") return <RequireAuth>{children}</RequireAuth>
  return <PublicGate>{children}</PublicGate>
}

function PublicGate({ children }: { children: ReactNode }) {
  const { status } = useSession()
  useSilentSignIn({ always: true })
  if (status === "loading") return <PageLoading />
  return <>{children}</>
}
