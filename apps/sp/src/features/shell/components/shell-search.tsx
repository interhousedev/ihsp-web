"use client"

import { getConfig } from "@ihsp/config"
import { studentRoutes, usePaletteSearch } from "@ihsp/features-core"
import { CommandPalette, type NavGroup } from "@ihsp/ui"
import { useMemo } from "react"

/** The search entry (Ctrl/Cmd+K): the navigation plus the server search over the student's own data. */
export function ShellSearch({ nav }: { nav: NavGroup[] }) {
  const libraryUrl = getConfig().LIBRARY_URL
  const routes = useMemo(() => studentRoutes(libraryUrl), [libraryUrl])
  const search = usePaletteSearch(routes)
  return <CommandPalette nav={nav} search={search} />
}
