"use client"

import { getConfig } from "@ihsp/config"
import { NotificationBell, QuickAssistant, studentRoutes, usePaletteSearch } from "@ihsp/features-core"
import { AppHeaderActions, CommandPalette, type NavGroup } from "@ihsp/ui"
import { useMemo } from "react"
import { OfflineIndicator } from "../../offline/components/offline-indicator"
import { ProfileMenu } from "./profile-menu"

/** Right side of the top bar: offline badge, search (Ctrl/Cmd+K), AI entry, notification bell, avatar menu with the app switcher. */
export function ShellHeader({ nav }: { nav: NavGroup[] }) {
  const libraryUrl = getConfig().LIBRARY_URL
  const routes = useMemo(() => studentRoutes(libraryUrl), [libraryUrl])
  const search = usePaletteSearch(routes)
  return (
    <AppHeaderActions ai={<QuickAssistant />} bell={<NotificationBell />} profile={<ProfileMenu />}>
      <OfflineIndicator />
      <CommandPalette nav={nav} search={search} />
    </AppHeaderActions>
  )
}
