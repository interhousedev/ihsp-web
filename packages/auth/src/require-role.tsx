"use client"

import type { Role } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons, StateView } from "@ihsp/ui"
import type { ReactNode } from "react"
import { useSession } from "./use-session"

/** True when the user has at least one of the roles. */
export function hasRole(userRoles: readonly Role[] | undefined, role: Role | readonly Role[]): boolean {
  const wanted = Array.isArray(role) ? (role as readonly Role[]) : [role as Role]
  return wanted.some((item) => userRoles?.includes(item))
}

/**
 * Shows `children` when the logged-in user has one of the roles, otherwise `fallback` (a "No access" screen).
 *
 * This is a UI guard only: the roles come from `GET /v1/id/me` and a user can bypass it with devtools. It hides screens
 * that would only fail; the protection is the backend, which checks `require_roles` plus the per-use-case rules on
 * every route. Never rely on this component for security.
 */
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
      <StateView
        state="empty"
        className="border-0"
        icon={<Icons.lock aria-hidden />}
        title={t("auth.forbiddenTitle")}
        description={t("auth.forbiddenDescription")}
      />
    </div>
  )
}
