"use client"

import { useT } from "@ihsp/i18n"
import { PageHeader, Skeleton, StateView } from "@ihsp/ui"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { TranscriptSection } from "../../transcripts/components/transcript-section"
import { useDocuments } from "../api"
import { ChecklistSection } from "./checklist-section"
import { DocumentRow } from "./document-row"
import { UploadForm } from "./upload-form"

function DocumentList() {
  const t = useT("documents")
  const query = useDocuments()
  if (query.isPending) return <Skeleton className="h-24 w-full" />
  if (query.isError) return <StateView state="error" onRetry={() => void query.refetch()} />
  if (query.data.length === 0) return <StateView state="empty" title={t("empty")} />
  return (
    <ul className="flex flex-col gap-2">
      {query.data.map((doc) => (
        <DocumentRow key={doc.id} doc={doc} />
      ))}
    </ul>
  )
}

export function DocumentsPage() {
  const t = useT("documents")
  return (
    <AdmissionShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
        <PageHeader title={t("title")} />
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t("checklistTitle")}</h2>
          <ChecklistSection />
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t("filesTitle")}</h2>
          <UploadForm />
          <DocumentList />
        </section>
        <TranscriptSection />
      </div>
    </AdmissionShell>
  )
}
