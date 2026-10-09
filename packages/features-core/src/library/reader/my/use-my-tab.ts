"use client"

import { parseAsStringLiteral, useQueryState } from "nuqs"
import type { MyLibraryTab } from "../../utils/hrefs"

export const MY_TABS = ["continue", "shelf", "notes", "lists", "uploads"] as const satisfies readonly MyLibraryTab[]

/** The active tab of My library lives in the address (`?tab=`), so a link opens it and Back works. */
export function useMyTab() {
  return useQueryState("tab", parseAsStringLiteral(MY_TABS).withDefault("continue"))
}
