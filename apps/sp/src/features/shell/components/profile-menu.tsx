"use client"

import { useSession, logout } from "@ihsp/auth"
import { usePlatformLinks, useUpdatePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { UserMenu } from "@ihsp/ui"
import { clearPersistedQueries } from "../../offline/utils/persisted-queries"

/** Profile menu in the header: Profile, Settings, language, theme and log out (WEB-2). */
export function ProfileMenu() {
  const t = useT("nav")
  const { session } = useSession()
  const update = useUpdatePreferences()
  const platforms = usePlatformLinks()
  if (!session) return null
  const { first_name, last_name, login } = session.user

  return (
    <UserMenu
      name={`${last_name} ${first_name}`}
      subtitle={login}
      items={[
        { key: "profile", title: t("profile"), icon: "profile", href: "/profile/" },
        { key: "settings", title: t("settings"), icon: "settings", href: "/settings/" },
      ]}
      platforms={platforms}
      onLocaleChange={(locale) => update.mutate({ locale })}
      onLogout={() => {
        clearPersistedQueries()
        void logout()
      }}
    />
  )
}
