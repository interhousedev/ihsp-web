"use client"

import { usePlatformLinks } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { BottomNav, type BottomNavItem, type NavGroup, type NavItem } from "@ihsp/ui"
import { useMemo } from "react"
import { useBottomBar } from "../hooks/use-bottom-bar"
import { DESTINATION_URLS } from "../utils/bottom-bar"
import { ProfileMenu } from "./profile-menu"

/**
 * The phone bottom bar of the student app: the pages the user chose in Settings (icon and short label) plus "More", a
 * sheet with every other page. The shared `BottomNav` draws it; hidden from 768 px, where the sidebar takes over.
 */
export function SpBottomNav({ groups }: { groups: NavGroup[] }) {
  const t = useT()
  const { ids } = useBottomBar()
  const platforms = usePlatformLinks()
  const byUrl = useMemo(() => {
    const map = new Map<string, NavItem>()
    for (const group of groups) for (const item of group.items) map.set(item.url, item)
    return map
  }, [groups])
  const tabs: BottomNavItem[] = ids.flatMap((id) => {
    const item = byUrl.get(DESTINATION_URLS[id])
    return item ? [{ title: t(`nav.short.${id}`), url: item.url, icon: item.icon ?? "dots", match: item.match }] : []
  })
  return (
    <BottomNav
      items={tabs}
      more={groups}
      moreFooter={<ProfileMenu variant="row" />}
      platforms={platforms}
      excludeVisibleFromMore
      testId="mobile-tab-bar"
    />
  )
}
