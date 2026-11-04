"use client"

import { logout, useSession } from "@ihsp/auth"
import { useFeedbackMenu, useLicenseMenu, usePlatformLinks, useUpdatePreferences } from "@ihsp/features-core"
import { useInstallAppMenuItem } from "@ihsp/features-core/pwa"
import { UserMenu } from "@ihsp/ui"

/** Profile menu in the header: language, theme, "Install the app" (pwa mode) and log out. */
export function ProfileMenu({ variant = "avatar" }: { variant?: "avatar" | "row" }) {
  const { session } = useSession()
  const update = useUpdatePreferences()
  const platforms = usePlatformLinks()
  const installItem = useInstallAppMenuItem()
  const feedback = useFeedbackMenu({ area: "lms" })
  const license = useLicenseMenu()
  if (!session) return null
  const { first_name, last_name, login } = session.user
  return (
    <>
      <UserMenu
        name={`${last_name} ${first_name}`}
        subtitle={login}
        variant={variant}
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
