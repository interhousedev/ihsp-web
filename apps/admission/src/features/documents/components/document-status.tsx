"use client"

import { useT } from "@ihsp/i18n"
import { StatusBadge } from "@ihsp/ui"
import { DOCUMENT_TONE, documentState } from "../kinds"
import type { AdmissionDocument } from "../api"

export function DocumentStatus({ doc }: { doc: AdmissionDocument }) {
  const t = useT("documents")
  const state = documentState(doc)
  return <StatusBadge tone={DOCUMENT_TONE[state]} label={t(`state.${state}`)} />
}
