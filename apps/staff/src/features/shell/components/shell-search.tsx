"use client"

import { getConfig } from "@ihsp/config"
import { staffRoutes, usePaletteSearch } from "@ihsp/features-core"
import { CommandPalette, type NavGroup } from "@ihsp/ui"
import { useMemo } from "react"

/** The search entry (Ctrl/Cmd+K): the navigation plus the server search over the teacher's data. */
export function ShellSearch({ nav }: { nav: NavGroup[] }) {
  const libraryUrl = getConfig().LIBRARY_URL
  const routes = useMemo(() => staffRoutes(libraryUrl), [libraryUrl])
  const search = usePaletteSearch(routes)
  return <CommandPalette nav={nav} search={search} />
}
