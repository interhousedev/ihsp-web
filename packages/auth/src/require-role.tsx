"use client"

import type { Role } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Icons } from "@ihsp/ui"
import type { ReactNode } from "react"
import { useSession } from "./use-session"

/** True when the user has at least one of the roles. */
export function hasRole(userRoles: readonly Role[] | undefined, role: Role | readonly Role[]): boolean {
  const wanted = Array.isArray(role) ? (role as readonly Role[]) : [role as Role]
  return wanted.some((item) => userRoles?.includes(item))
}

/** Shows `children` when the logged-in user has one of the roles, otherwise `fallback` (a "No access" screen). */
export function RequireRole({
  role,
  children,
  fallback,
}: {
  role: Role | Role[]
  children: ReactNode
  fallback?: ReactNode
}) {
  const t = useT()
  const { session } = useSession()
  if (!session) return null
  if (hasRole(session.user.roles, role)) return <>{children}</>
  if (fallback !== undefined) return <>{fallback}</>
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icons.lock aria-hidden />
          </EmptyMedia>
          <EmptyTitle>{t("auth.forbiddenTitle")}</EmptyTitle>
          <EmptyDescription>{t("auth.forbiddenDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
