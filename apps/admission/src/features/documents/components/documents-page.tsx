"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton, StateView } from "@ihsp/ui"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { TranscriptSection } from "../../transcripts/components/transcript-section"
import { CalendarView } from "../../deadlines/components/calendar-view"
import { DocumentProcess } from "../../document-process/components/document-process"
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
      <div className={pageClass("narrow")}>
        <AppPageHeader
          icon="files"
          title={t("title")}
          actions={
            <Button variant="outline" size="sm" render={<a href="#document-process" />} nativeButton={false}>
              <Icons.route data-icon="inline-start" aria-hidden />
              {t("processLink")}
            </Button>
          }
        />
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t("checklistTitle")}</h2>
          <ChecklistSection />
        </section>
        <CalendarView />
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t("filesTitle")}</h2>
          <UploadForm />
          <DocumentList />
        </section>
        <TranscriptSection />
        <DocumentProcess />
      </div>
    </AdmissionShell>
  )
}
