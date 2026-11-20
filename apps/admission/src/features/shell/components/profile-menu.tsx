"use client"

import { logout, useSession } from "@ihsp/auth"
import { useInstallAppMenuItem } from "@ihsp/features-core/pwa"
import { useFeedbackMenu, useLicenseMenu, usePlatformLinks, useUpdatePreferences } from "@ihsp/features-core"
import { UserMenu } from "@ihsp/ui"

/** Profile menu (the only place the account is shown): language, theme, the other IHSP platforms and log out. */
export function ProfileMenu() {
  const { session } = useSession()
  const update = useUpdatePreferences()
  const platforms = usePlatformLinks()
  const installItem = useInstallAppMenuItem()
  const feedback = useFeedbackMenu({ area: "other" })
  const license = useLicenseMenu()
  if (!session) return null
  const { first_name, last_name, photo_url } = session.user
  return (
    <>
      <UserMenu
        name={`${last_name} ${first_name}`}
        imageUrl={photo_url}
        items={[...feedback.items, ...license.items, ...(installItem ? [installItem] : [])]}
        platforms={platforms}
        onLocaleChange={(locale) => update.mutate({ locale })}
        onLogout={() => void logout()}
      />
      {feedback.dialog}
      {license.dialog}
    </>
  )
}
