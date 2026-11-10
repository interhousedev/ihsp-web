"use client"

import { filterNavGroups, type BottomNavItem, type NavGroup } from "@ihsp/ui"
import { useMemo } from "react"
import { buildIdBottom, buildIdNav } from "../../../config/nav"
import { useTr } from "@ihsp/features-core/id-account"

/** The translated security navigation, filtered by the user's roles. */
export function useIdNav(roles: readonly string[]): NavGroup[] {
  const t = useTr()
  return useMemo(() => filterNavGroups(buildIdNav(t), roles), [t, roles])
}

/** The phone bottom bar of the account pages. */
export function useIdBottom(): BottomNavItem[] {
  const t = useTr()
  return useMemo(() => buildIdBottom(t), [t])
}
