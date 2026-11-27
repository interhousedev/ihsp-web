"use client"

import { useSession, logout } from "@ihsp/auth"
import { useFeedbackMenu, usePlatformLinks, useSessionUserSync, useUpdatePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { isPwaMode } from "@ihsp/features-core/pwa"
import { UserAvatar, UserMenu } from "@ihsp/ui"
import Link from "next/link"
import { fullName } from "../../shared/utils/people"
import { clearPersistedQueries } from "../../offline/utils/persisted-queries"
import { useInstallMenuItem } from "../../pwa/hooks/use-install-menu-item"
import { useHomeHeroVisible } from "../../dashboard/hooks/use-home-hero"

/** Profile menu in the header: Profile, Settings, language, theme and log out (WEB-2). */
export function ProfileMenu({ variant = "avatar" }: { variant?: "avatar" | "row" }) {
  const t = useT("nav")
  const { session } = useSession()
  const update = useUpdatePreferences()
  const platforms = usePlatformLinks()
  // On a phone Home's hero already shows the face: the header avatar waits until the hero scrolls away.
  const heroVisible = useHomeHeroVisible()
  const installItem = useInstallMenuItem()
  const feedback = useFeedbackMenu({ area: "my", mineHref: "/feedback/" })
  useSessionUserSync()
  if (!session) return null
  const { login, photo_url } = session.user
  const name = fullName(session.user)
  const menu = (
    <UserMenu
      name={name}
      subtitle={login}
      imageUrl={photo_url}
      variant={variant}
      items={[
        {
          key: "profile",
          title: t("profile"),
          icon: "profile",
          href: "/profile/",
        },
        {
          key: "settings",
          title: t("settings"),
          icon: "settings",
          href: "/settings/",
        },
        ...feedback.items,
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
  if (variant === "row")
    return (
      <>
        {menu}
        {feedback.dialog}
      </>
    )
  if (!isPwaMode())
    return (
      <>
        <div className={`min-w-0 items-center gap-2 ${heroVisible ? "hidden md:flex" : "flex"}`}>
          <span data-testid="header-name" className="hidden max-w-48 truncate text-sm font-medium md:inline">
            {name}
          </span>
          {menu}
        </div>
        {feedback.dialog}
      </>
    )
  return (
    <>
      <Link
        href="/settings/"
        aria-label={t("settings")}
        className={`size-11 items-center justify-center rounded-full md:hidden ${heroVisible ? "hidden" : "flex"}`}
      >
        <UserAvatar name={name} imageUrl={photo_url} />
      </Link>
      <div className="hidden md:block">{menu}</div>
      {feedback.dialog}
    </>
  )
}
