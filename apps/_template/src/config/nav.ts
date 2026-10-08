"use client"

import type { BottomNavItem, NavGroup } from "@ihsp/ui"
import { useT } from "@ihsp/i18n"
import { useMemo } from "react"

/**
 * Sidebar groups and the phone bottom bar (at most four items plus "More"). Titles are translated here, so the
 * hook runs in a component. Items accept `roles` (hidden unless the user has one) and `visible`.
 */
export function useNav(): { groups: NavGroup[]; bottom: BottomNavItem[] } {
  const t = useT()
  return useMemo(
    () => ({
      groups: [{ label: t("nav.main"), items: [{ title: t("nav.home"), url: "/", icon: "home", match: "exact" }] }],
      bottom: [{ title: t("nav.home"), url: "/", icon: "home", match: "exact" }],
    }),
    [t],
  )
}
