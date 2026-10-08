"use client"

import { NotificationBell } from "@ihsp/features-core"
import { CommandPalette, OfflineBadge, type NavGroup } from "@ihsp/ui"
import { ProfileMenu } from "./profile-menu"

/** Right side of the top bar: offline badge, quick navigation (Ctrl/Cmd+K), notification bell, profile menu. */
export function ShellHeader({ nav }: { nav: NavGroup[] }) {
  return (
    <>
      <OfflineBadge />
      <CommandPalette nav={nav} />
      <NotificationBell />
      <ProfileMenu />
    </>
  )
}
