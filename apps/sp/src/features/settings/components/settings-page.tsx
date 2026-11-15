"use client"

import { useSearchParams } from "next/navigation"
import { SettingsGroupPage } from "./settings-group-page"
import { parseSettingsGroup } from "./settings-groups"
import { SettingsIndex } from "./settings-index"

/** Settings (WEB-29, UF-WEB-17): an index of topics, and one page per topic at `/settings/?section=<topic>`. */
export function SettingsPage() {
  const group = parseSettingsGroup(useSearchParams().get("section"))
  return group ? <SettingsGroupPage group={group} /> : <SettingsIndex />
}
