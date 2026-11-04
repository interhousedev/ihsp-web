"use client"

import { getConfig } from "@ihsp/config"
import { NotificationBell, staffRoutes, usePaletteSearch } from "@ihsp/features-core"
import { CommandPalette, OfflineBadge, type NavGroup } from "@ihsp/ui"
import { useMemo } from "react"

/** Right side of the top bar: offline badge, search (Ctrl/Cmd+K), notification bell. */
export function ShellHeader({ nav }: { nav: NavGroup[] }) {
  const libraryUrl = getConfig().LIBRARY_URL
  const routes = useMemo(() => staffRoutes(libraryUrl), [libraryUrl])
  const search = usePaletteSearch(routes)
  return (
    <>
      <OfflineBadge />
      <CommandPalette nav={nav} search={search} />
      <NotificationBell />
    </>
  )
}
