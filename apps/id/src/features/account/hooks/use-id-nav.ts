"use client"

import { filterNavGroups, type NavGroup } from "@ihsp/ui"
import { useMemo } from "react"
import { buildIdNav } from "../../../config/nav"
import { useTr } from "../../shared/hooks/use-tr"

/** The translated security navigation, filtered by the user's roles. */
export function useIdNav(roles: readonly string[]): NavGroup[] {
  const t = useTr()
  return useMemo(() => filterNavGroups(buildIdNav(t), roles), [t, roles])
}
