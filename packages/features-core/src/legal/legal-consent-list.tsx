"use client"

import type { LegalDocument, LegalKind } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { Checkbox, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ihsp/ui"
import { useId } from "react"
import { LegalDocumentView } from "./legal-document-view"
import { legalHref } from "./use-legal-documents"

/** The `accepted_legal` payload of the registration: the ticked documents with their versions. */
export function acceptedLegalItems(documents: readonly LegalDocument[], accepted: readonly LegalKind[]) {
  return documents
    .filter((document) => accepted.includes(document.kind))
    .map((document) => ({ kind: document.kind, version: document.version }))
}

export function allLegalAccepted(documents: readonly LegalDocument[], accepted: readonly LegalKind[]): boolean {
  return documents.every((document) => accepted.includes(document.kind))
}

type LegalConsentListProps = {
  documents: readonly LegalDocument[]
  accepted: readonly LegalKind[]
  onChange: (accepted: LegalKind[]) => void
  disabled?: boolean
}

/** One checkbox per published document, with the text expandable in place and a link to the public page. */
export function LegalConsentList({ documents, accepted, onChange, disabled }: LegalConsentListProps) {
  const t = useT("legal")
  const idPrefix = useId()

  function toggle(kind: LegalKind, checked: boolean) {
    onChange(checked ? [...accepted.filter((item) => item !== kind), kind] : accepted.filter((item) => item !== kind))
  }

  return (
    <ul className="grid gap-3" aria-label={t("consent.title")}>
      {documents.map((document) => {
        const labelId = `${idPrefix}-${document.kind}`
        return (
          <li key={document.kind} className="grid gap-1.5">
            <div className="flex items-start gap-2.5">
              <Checkbox
                className="mt-0.5"
                aria-labelledby={labelId}
                checked={accepted.includes(document.kind)}
                disabled={disabled}
                onCheckedChange={(checked) => toggle(document.kind, checked)}
              />
              <span id={labelId} className="text-sm">
                {t("consent.accept", { title: document.title })}
              </span>
            </div>
            <Collapsible className="pl-6.5">
              <div className="flex gap-3 text-xs">
                <CollapsibleTrigger className="text-primary underline-offset-4 hover:underline">
                  {t("consent.read")}
                </CollapsibleTrigger>
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href={legalHref(getConfig().ID_URL, document.kind)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("consent.open")}
                </a>
              </div>
              <CollapsibleContent>
                <div className="mt-2 max-h-56 overflow-y-auto rounded-md border p-3">
                  <LegalDocumentView markdown={document.body_markdown} className="text-sm" />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </li>
        )
      })}
    </ul>
  )
}
