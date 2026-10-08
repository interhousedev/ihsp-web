"use client"

import { logout, useSession } from "@ihsp/auth"
import { useUpdatePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { UserMenu } from "@ihsp/ui"

/** Profile menu in the header: Settings, language, theme and log out. */
export function ProfileMenu() {
  const t = useT("nav")
  const { session } = useSession()
  const update = useUpdatePreferences()
  if (!session) return null
  const { first_name, last_name, login } = session.user

  return (
    <UserMenu
      name={`${last_name} ${first_name}`}
      subtitle={login}
      items={[{ key: "settings", title: t("settings"), icon: "settings", href: "/settings/" }]}
      onLocaleChange={(locale) => update.mutate({ locale })}
      onLogout={() => void logout()}
    />
  )
}
