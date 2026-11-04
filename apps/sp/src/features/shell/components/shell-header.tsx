"use client"

import { getConfig } from "@ihsp/config"
import { NotificationBell, studentRoutes, usePaletteSearch } from "@ihsp/features-core"
import { CommandPalette, type NavGroup } from "@ihsp/ui"
import { useMemo } from "react"
import { OfflineIndicator } from "../../offline/components/offline-indicator"

/** Right side of the top bar: offline badge, search (Ctrl/Cmd+K), notification bell. */
export function ShellHeader({ nav }: { nav: NavGroup[] }) {
  const libraryUrl = getConfig().LIBRARY_URL
  const routes = useMemo(() => studentRoutes(libraryUrl), [libraryUrl])
  const search = usePaletteSearch(routes)
  return (
    <>
      <OfflineIndicator />
      <CommandPalette nav={nav} search={search} />
      <NotificationBell />
    </>
  )
}
