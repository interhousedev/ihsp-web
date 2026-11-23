"use client"

import { logout, useSession } from "@ihsp/auth"
import { useFeedbackMenu, useLicenseMenu, usePlatformLinks, useUpdatePreferences } from "@ihsp/features-core"
import { useInstallAppMenuItem } from "@ihsp/features-core/pwa"
import { useT } from "@ihsp/i18n"
import { UserMenu } from "@ihsp/ui"
import { hrefs } from "../../shared/utils/hrefs"

/** Profile menu in the header: language, theme, "Install the app" (pwa mode) and log out. */
export function ProfileMenu({ variant = "avatar" }: { variant?: "avatar" | "row" }) {
  const { session } = useSession()
  const update = useUpdatePreferences()
  const platforms = usePlatformLinks()
  const installItem = useInstallAppMenuItem()
  const feedback = useFeedbackMenu({ area: "lms" })
  const license = useLicenseMenu()
  const t = useT("skin")
  if (!session) return null
  const { first_name, last_name, login, photo_url } = session.user
  return (
    <>
      <UserMenu
        name={`${last_name} ${first_name}`}
        subtitle={login}
        imageUrl={photo_url}
        variant={variant}
        items={[
          { key: "appearance", title: t("appearance.menu"), icon: "palette", href: `${hrefs.profile()}#appearance` },
          ...feedback.items,
          ...license.items,
          ...(installItem ? [installItem] : []),
        ]}
        platforms={platforms}
        onLocaleChange={(locale) => update.mutate({ locale })}
        onLogout={() => void logout()}
      />
      {feedback.dialog}
      {license.dialog}
    </>
  )
}
