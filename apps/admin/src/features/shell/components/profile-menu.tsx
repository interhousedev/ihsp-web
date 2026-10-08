"use client"

import { logout, useSession } from "@ihsp/auth"
import { useUpdatePreferences } from "@ihsp/features-core"
import { UserMenu } from "@ihsp/ui"

/** Profile menu in the header: language, theme and log out. */
export function ProfileMenu() {
  const { session } = useSession()
  const update = useUpdatePreferences()
  if (!session) return null
  const { first_name, last_name, login } = session.user
  return (
    <UserMenu
      name={`${last_name} ${first_name}`}
      subtitle={login}
      onLocaleChange={(locale) => update.mutate({ locale })}
      onLogout={() => void logout()}
    />
  )
}
