"use client"

import { getConfig } from "@ihsp/config"
import { ComposeMailButton, NotificationBell, staffRoutes, usePaletteSearch } from "@ihsp/features-core"
import { CommandPalette, OfflineBadge, type NavGroup } from "@ihsp/ui"
import { useMemo } from "react"
import { ProfileMenu } from "./profile-menu"

/** Right side of the top bar: offline badge, search (Ctrl/Cmd+K), write an email, notification bell, profile menu. */
export function ShellHeader({ nav }: { nav: NavGroup[] }) {
  const libraryUrl = getConfig().LIBRARY_URL
  const routes = useMemo(() => staffRoutes(libraryUrl), [libraryUrl])
  const search = usePaletteSearch(routes)
  return (
    <>
      <OfflineBadge />
      <CommandPalette nav={nav} search={search} />
      <ComposeMailButton />
      <NotificationBell />
      <ProfileMenu />
    </>
  )
}
