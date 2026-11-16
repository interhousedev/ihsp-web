import type { Role } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

/** The roles of a user as a set of chips; Administration is drawn filled. */
export function RoleChips({ roles }: { roles: readonly Role[] }) {
  const t = useT("users.roles")
  return (
    <span className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role} variant={role === "admin" ? "default" : "outline"}>
          {t(role)}
        </Badge>
      ))}
    </span>
  )
}
