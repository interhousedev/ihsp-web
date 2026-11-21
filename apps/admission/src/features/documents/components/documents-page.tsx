"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { NextStep } from "../../../components/next-step"
import { ScrollFade } from "../../../components/scroll-fade"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { TranscriptSection } from "../../transcripts/components/transcript-section"
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

const TABS = ["checklist", "files", "transcripts", "process"] as const
type DocumentsTab = (typeof TABS)[number]

/** The panel of a tab: long lists scroll inside it so the page itself stays within the viewport. */
function TabPanel({ tab }: { tab: DocumentsTab }) {
  const scrollMax = "calc(100svh - 23rem)"
  if (tab === "files") {
    return (
      <section className="flex flex-col gap-3">
        <UploadForm />
        <ScrollFade maxHeight={scrollMax}>
          <DocumentList />
        </ScrollFade>
      </section>
    )
  }
  if (tab === "transcripts") {
    return (
      <ScrollFade maxHeight={scrollMax}>
        <TranscriptSection />
      </ScrollFade>
    )
  }
  if (tab === "process") {
    return (
      <ScrollFade maxHeight={scrollMax}>
        <DocumentProcess />
      </ScrollFade>
    )
  }
  return (
    <ScrollFade maxHeight={scrollMax}>
      <ChecklistSection />
    </ScrollFade>
  )
}

function DocumentsContent() {
  const t = useT("documents")
  const tTranscripts = useT("transcripts")
  const router = useRouter()
  const params = useSearchParams()
  const entry = params.get("entry")
  const wanted = params.get("tab") ?? ""
  const tab = (TABS as readonly string[]).includes(wanted) ? (wanted as DocumentsTab) : "checklist"
  // The tab lives in the URL (`?tab=`), next to the `entry` the student came from.
  const setTab = (next: string) => {
    const query = new URLSearchParams(params.toString())
    if (next === "checklist") query.delete("tab")
    else query.set("tab", next)
    const qs = query.toString()
    router.replace(qs ? `/documents/?${qs}` : "/documents/")
  }
  return (
    <AdmissionShell>
      <div className={pageClass()}>
        <AppPageHeader
          icon="files"
          title={t("title")}
          actions={
            <>
              {entry ? (
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/chooser/?step=list&entry=${encodeURIComponent(entry)}`} />}
                  nativeButton={false}
                >
                  <Icons.chevronLeft data-icon="inline-start" aria-hidden />
                  {t("backToList")}
                </Button>
              ) : null}
              <Button variant="outline" size="sm" render={<Link href="/tasks/" />} nativeButton={false}>
                <Icons.calendarEvent data-icon="inline-start" aria-hidden />
                {t("deadlinesLink")}
              </Button>
            </>
          }
        />
        <UnderlineTabs
          label={t("title")}
          value={tab}
          onValueChange={setTab}
          tabs={[
            { value: "checklist", label: t("checklistTitle"), icon: "checks" },
            { value: "files", label: t("filesTitle"), icon: "files" },
            { value: "transcripts", label: tTranscripts("title"), icon: "page" },
            { value: "process", label: t("processLink"), icon: "route" },
          ]}
        />
        <TabPanel tab={tab} />
        <NextStep href="/review/" label={t("nextReview")} hint={t("nextReviewHint")} />
      </div>
    </AdmissionShell>
  )
}

export function DocumentsPage() {
  return (
    <Suspense>
      <DocumentsContent />
    </Suspense>
  )
}
