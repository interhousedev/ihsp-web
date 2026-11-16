"use client"

import { logout, useSession } from "@ihsp/auth"
import { useFeedbackMenu, useLicenseMenu, usePlatformLinks, useUpdatePreferences } from "@ihsp/features-core"
import { UserMenu } from "@ihsp/ui"

/** Profile menu: language, theme, the other IHSP platforms and log out. */
export function ProfileMenu({ variant = "avatar" }: { variant?: "avatar" | "row" }) {
  const { session } = useSession()
  const update = useUpdatePreferences()
  const platforms = usePlatformLinks()
  const feedback = useFeedbackMenu({ area: "other" })
  const license = useLicenseMenu()
  if (!session) return null
  const { first_name, last_name, login } = session.user
  return (
    <>
      <UserMenu
        name={`${last_name} ${first_name}`}
        subtitle={login}
        variant={variant}
        items={[...feedback.items, ...license.items]}
        platforms={platforms}
        onLocaleChange={(locale) => update.mutate({ locale })}
        onLogout={() => void logout()}
      />
      {feedback.dialog}
      {license.dialog}
    </>
  )
}
