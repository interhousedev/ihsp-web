"use client"

import { getMeSearch } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import type { CommandPaletteResult } from "@ihsp/ui"
import { useCallback } from "react"
import { toPaletteResults, type PaletteRoutes } from "./palette-results"

/**
 * The `search` function of the header command palette: `GET /v1/me/search?q=` mapped to grouped rows with the deep links
 * of the calling app. Pass a memoised `routes`.
 */
export function usePaletteSearch(routes: PaletteRoutes): (query: string) => Promise<CommandPaletteResult[]> {
  const t = useT("paletteSearch")
  const f = useFormatters()
  return useCallback(
    async (query) => {
      const results = await getMeSearch({ q: query })
      return toPaletteResults(
        results,
        {
          subjects: t("sections.subjects"),
          lessons: t("sections.lessons"),
          homework: t("sections.homework"),
          files: t("sections.files"),
          flashcardSets: t("sections.flashcardSets"),
          notebooks: t("sections.notebooks"),
          marks: t("sections.marks"),
          libraryItems: t("sections.libraryItems"),
        },
        { date: (value) => f.date(value, { day: "numeric", month: "short" }) },
        routes,
      )
    },
    [t, f, routes],
  )
}
