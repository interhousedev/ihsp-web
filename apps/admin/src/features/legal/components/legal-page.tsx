"use client"

import { getAdminLegalAcceptancesQuery, getAdminLegalDocumentsQuery, LEGAL_KINDS, type LegalKind } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { kindState } from "../utils"
import { LegalEditor } from "./legal-editor"
import { LegalKindList } from "./legal-kind-list"

/** Legal documents: the four kinds, their versions and acceptance counts, and the draft editor. */
export function LegalPage() {
  const t = useT("legal")
  const documents = useQuery(getAdminLegalDocumentsQuery())
  const acceptances = useQuery(getAdminLegalAcceptancesQuery())
  const [selected, setSelected] = useState<LegalKind | null>(null)

  return (
    <PageContainer title={t("title")}>
      <QueryState query={documents} rows={4}>
        {(data) => {
          const states = LEGAL_KINDS.map((kind) => kindState(kind, data.items, acceptances.data?.items ?? []))
          const current = states.find((state) => state.kind === selected)
          return (
            <>
              <LegalKindList states={states} selected={selected} onSelect={setSelected} />
              {current ? <LegalEditor key={current.kind} state={current} onClose={() => setSelected(null)} /> : null}
            </>
          )
        }}
      </QueryState>
    </PageContainer>
  )
}
