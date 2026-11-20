"use client"

import { getConfig } from "@ihsp/config"
import { AssistantEntry, NotificationBell, staffRoutes, usePaletteSearch } from "@ihsp/features-core"
import { AppHeaderActions, CommandPalette, OfflineBadge, type NavGroup } from "@ihsp/ui"
import { useMemo } from "react"
import { ProfileMenu } from "./profile-menu"

/** Right side of the top bar: offline badge, search (Ctrl/Cmd+K), AI entry, notification bell, avatar menu with the app switcher. */
export function ShellHeader({ nav }: { nav: NavGroup[] }) {
  const libraryUrl = getConfig().LIBRARY_URL
  const routes = useMemo(() => staffRoutes(libraryUrl), [libraryUrl])
  const search = usePaletteSearch(routes)
  return (
    <AppHeaderActions ai={<AssistantEntry href="/assistant/" />} bell={<NotificationBell />} profile={<ProfileMenu />}>
      <OfflineBadge />
      <CommandPalette nav={nav} search={search} />
    </AppHeaderActions>
  )
}
