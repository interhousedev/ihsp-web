"use client"

import { useT } from "@ihsp/i18n"
import { useList } from "../../chooser/hooks"

type Labelled = { kind: string; title: string; list_entry_id?: string | null }

/** The display title of an essay: a supplemental essay linked to a college reads "Supp letter for X". */
export function useEssayLabel() {
  const t = useT("essays")
  const list = useList()
  const college = (entryId?: string | null) => list.data?.find((e) => e.id === entryId)?.institution.name
  const label = (e: Labelled) => {
    const name = e.kind === "supplemental" ? college(e.list_entry_id) : undefined
    return e.title || (name ? t("supp.title", { college: name }) : t("untitled"))
  }
  return { label, college }
}
