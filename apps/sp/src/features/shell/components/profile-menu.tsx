"use client"

import { useSession, logout } from "@ihsp/auth"
import { usePlatformLinks, useUpdatePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { isPwaMode } from "@ihsp/features-core/pwa"
import { UserAvatar, UserMenu } from "@ihsp/ui"
import Link from "next/link"
import { clearPersistedQueries } from "../../offline/utils/persisted-queries"
import { useInstallMenuItem } from "../../pwa/hooks/use-install-menu-item"

/** Profile menu in the header: Profile, Settings, language, theme and log out (WEB-2). */
export function ProfileMenu() {
  const t = useT("nav")
  const { session } = useSession()
  const update = useUpdatePreferences()
  const platforms = usePlatformLinks()
  const installItem = useInstallMenuItem()
  if (!session) return null
  const { first_name, last_name, login } = session.user

  const name = `${last_name} ${first_name}`
  const menu = (
    <UserMenu
      name={name}
      subtitle={login}
      items={[
        { key: "profile", title: t("profile"), icon: "profile", href: "/profile/" },
        { key: "settings", title: t("settings"), icon: "settings", href: "/settings/" },
        ...(installItem ? [installItem] : []),
      ]}
      platforms={platforms}
      onLocaleChange={(locale) => update.mutate({ locale })}
      onLogout={() => {
        clearPersistedQueries()
        void logout()
      }}
    />
  )
  // The installed app on a phone has no profile page of its own: the avatar goes straight to Settings.
  if (!isPwaMode()) return menu
  return (
    <>
      <Link
        href="/settings/"
        aria-label={t("settings")}
        className="flex size-11 items-center justify-center rounded-full md:hidden"
      >
        <UserAvatar name={name} />
      </Link>
      <div className="hidden md:block">{menu}</div>
    </>
  )
}
