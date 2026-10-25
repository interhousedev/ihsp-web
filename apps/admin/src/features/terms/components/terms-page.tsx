"use client"

import { getAdminTermsQuery, type Term } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { TOUCH } from "../../shared/utils/touch"
import { TermCard } from "./term-card"
import { TermEditorDialog } from "./term-editor-dialog"

/** Terms & bells (ADM-8, ADM-18, UF-ADM-05): the terms, their bell schedule, non-study days and moved days. */
export function TermsPage() {
  const t = useT("terms")
  const query = useQuery(getAdminTermsQuery())
  const [editing, setEditing] = useState<Term | null>(null)
  const [open, setOpen] = useState(false)
  const template = query.data?.find((term) => term.is_current) ?? query.data?.[0]

  function openEditor(term: Term | null) {
    setEditing(term)
    setOpen(true)
  }

  return (
    <PageContainer
      title={t("title")}
      actions={
        <Button type="button" className={TOUCH} onClick={() => openEditor(null)}>
          <Icons.add aria-hidden />
          {t("new")}
        </Button>
      }
    >
      <QueryState query={query} isEmpty={(terms) => terms.length === 0} emptyText={t("empty")}>
        {(terms) => (
          <div className="flex flex-col gap-4">
            {terms.map((term) => (
              <TermCard key={term.id} term={term} onEdit={() => openEditor(term)} />
            ))}
          </div>
        )}
      </QueryState>
      <TermEditorDialog term={editing} template={template} open={open} onOpenChange={setOpen} />
    </PageContainer>
  )
}
