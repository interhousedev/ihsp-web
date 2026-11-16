"use client"

import { getAdminLegalAcceptancesQuery, getAdminLegalDocumentsQuery, LEGAL_SCOPES, type LegalScope } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer, Sheet, SheetContent, SheetDescription, SheetTitle } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { SelectField } from "../../shared/components/select-field"
import { kindState, legalRows, type LegalRow } from "../utils"
import { LegalEditor } from "./legal-editor"
import { LegalKindList } from "./legal-kind-list"

/** Legal documents: the kinds per app, their versions and acceptance counts, and the draft editor. */
export function LegalPage() {
  const t = useT("legal")
  const documents = useQuery(getAdminLegalDocumentsQuery())
  const acceptances = useQuery(getAdminLegalAcceptancesQuery())
  const [selected, setSelected] = useState<LegalRow | null>(null)
  const [scope, setScope] = useState<LegalScope | "">("")

  return (
    <PageContainer title={t("title")}>
      <div className="max-w-xs">
        <SelectField
          aria-label={t("scopeFilter")}
          value={scope}
          emptyLabel={t("allScopes")}
          options={LEGAL_SCOPES.map((value) => ({ value, label: t(`scopes.${value}`) }))}
          onChange={(value) => {
            setScope(value as LegalScope | "")
            setSelected(null)
          }}
        />
      </div>
      <QueryState query={documents} rows={4}>
        {(data) => {
          const states = legalRows(scope, data.items).map((row) =>
            kindState(row.kind, row.scope, data.items, acceptances.data?.items ?? []),
          )
          const current = states.find((state) => state.kind === selected?.kind && state.scope === selected.scope)
          return (
            <>
              <LegalKindList states={states} selected={selected} onSelect={setSelected} />
              <Sheet open={current !== undefined} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-5xl">
                  <SheetTitle className="sr-only">{t("title")}</SheetTitle>
                  <SheetDescription className="sr-only">{t("editor.publishHint")}</SheetDescription>
                  {current ? (
                    <LegalEditor
                      key={`${current.scope}:${current.kind}`}
                      state={current}
                      onClose={() => setSelected(null)}
                    />
                  ) : null}
                </SheetContent>
              </Sheet>
            </>
          )
        }}
      </QueryState>
    </PageContainer>
  )
}
