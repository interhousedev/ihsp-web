"use client"

import type { LegalKind } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, Skeleton } from "@ihsp/ui"
import { LegalDocumentView } from "./legal-document-view"
import { useLegalDocument } from "./use-legal-documents"

/** A public page with the current text of one document. */
export function LegalDocumentPage({ kind }: { kind: LegalKind }) {
  const t = useT("legal")
  const errorMessage = useErrorMessage()
  const document = useLegalDocument(kind)

  if (document.isError) return <Alert variant="destructive">{errorMessage(document.error)}</Alert>
  if (!document.data) return <Skeleton className="h-64 w-full" aria-label={t("loading")} />
  return (
    <article className="grid gap-4">
      <h1 className="text-2xl font-semibold">{document.data.title}</h1>
      <LegalDocumentView markdown={document.data.body_markdown} />
    </article>
  )
}
