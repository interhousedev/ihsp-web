"use client"

import { logout, useSession } from "@ihsp/auth"
import { UserMenu, type UserMenuItem } from "@ihsp/ui"
import { useInstallAppMenuItem } from "../pwa/hooks/use-install-app-menu-item"
import { usePlatformLinks } from "../platform-links/use-platform-links"
import { useUpdatePreferences } from "../notification-settings-form/use-update-preferences"

/**
 * Profile menu in the header: the app's own items (Profile, Settings), "Install the app" when it applies, language,
 * theme, the other IHSP platforms and log out. `onBeforeLogout` runs before the tokens are dropped (an app clears its
 * offline cache there).
 */
export function ProfileMenu({ items = [], onBeforeLogout }: { items?: UserMenuItem[]; onBeforeLogout?: () => void }) {
  const { session } = useSession()
  const update = useUpdatePreferences()
  const platforms = usePlatformLinks()
  const installItem = useInstallAppMenuItem()
  if (!session) return null
  const { first_name, last_name, login } = session.user
  return (
    <UserMenu
      name={`${last_name} ${first_name}`}
      subtitle={login}
      items={installItem ? [...items, installItem] : items}
      platforms={platforms}
      onLocaleChange={(locale) => update.mutate({ locale })}
      onLogout={() => {
        onBeforeLogout?.()
        void logout()
      }}
    />
  )
}
