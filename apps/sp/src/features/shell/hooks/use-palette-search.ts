"use client"

import { getMeSearch } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import type { CommandPaletteResult } from "@ihsp/ui"
import { useCallback } from "react"
import { toPaletteResults } from "../utils/search-results"

/** The `search` function of the header command palette: `GET /v1/me/search?q=` mapped to grouped rows. */
export function usePaletteSearch(): (query: string) => Promise<CommandPaletteResult[]> {
  const t = useT("search")
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
        },
        { date: (value) => f.date(value, { day: "numeric", month: "short" }) },
      )
    },
    [t, f],
  )
}
