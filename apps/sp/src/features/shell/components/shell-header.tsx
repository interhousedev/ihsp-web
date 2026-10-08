"use client"

import { NotificationBell } from "@ihsp/features-core"
import { CommandPalette, type NavGroup } from "@ihsp/ui"
import { OfflineIndicator } from "../../offline/components/offline-indicator"
import { usePaletteSearch } from "../hooks/use-palette-search"
import { ProfileMenu } from "./profile-menu"

/** Right side of the top bar: offline badge, search (Ctrl/Cmd+K), notification bell, profile menu. */
export function ShellHeader({ nav }: { nav: NavGroup[] }) {
  const search = usePaletteSearch()
  return (
    <>
      <OfflineIndicator />
      <CommandPalette nav={nav} search={search} />
      <NotificationBell />
      <ProfileMenu />
    </>
  )
}
