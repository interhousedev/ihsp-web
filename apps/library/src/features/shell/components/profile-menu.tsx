"use client"

import { logout, useSession } from "@ihsp/auth"
import { useFeedbackMenu, usePlatformLinks, useUpdatePreferences } from "@ihsp/features-core"
import { useInstallAppMenuItem } from "@ihsp/features-core/pwa"
import { UserMenu } from "@ihsp/ui"

/** Profile menu in the header: language, theme, the other IHSP platforms and log out. */
export function ProfileMenu() {
  const { session } = useSession()
  const update = useUpdatePreferences()
  const platforms = usePlatformLinks()
  const installItem = useInstallAppMenuItem()
  const feedback = useFeedbackMenu({ area: "library" })
  if (!session) return null
  const { first_name, last_name, login } = session.user
  return (
    <>
      <UserMenu
        name={`${last_name} ${first_name}`}
        subtitle={login}
        items={[...feedback.items, ...(installItem ? [installItem] : [])]}
        platforms={platforms}
        onLocaleChange={(locale) => update.mutate({ locale })}
        onLogout={() => void logout()}
      />
      {feedback.dialog}
    </>
  )
}
