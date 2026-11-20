"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton, StateView, Tabs, TabsTrigger } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { ScrollTabsList } from "../../essays/components/scroll-tabs-list"
import { DOCUMENT_ROLES } from "../../../config/nav"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { downloadDocument, useReviewDocument, useStaffDocuments, type AdmissionDocument } from "../api"
import { DocumentStatus } from "./document-status"
import { RejectDialog } from "./reject-dialog"
import { QueryError } from "../../shell/components/query-error"

const FILTERS = ["none", "accepted", "rejected"] as const

function QueueRow({ doc }: { doc: AdmissionDocument }) {
  const t = useT("documents")
  const errorMessage = useErrorMessage()
  const review = useReviewDocument()
  const [rejecting, setRejecting] = useState(false)

  async function open() {
    try {
      const link = await downloadDocument(doc.id)
      window.open(link.url, "_blank", "noopener")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <li className="bg-card flex flex-col gap-2 rounded-card border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{t(`kind.${doc.kind}`)}</span>
        <DocumentStatus doc={doc} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void open()}>
          <Icons.externalLink data-icon="inline-start" aria-hidden />
          {t("download")}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={review.isPending || doc.review_status === "accepted"}
          onClick={() => review.mutate({ id: doc.id, accept: true }, { onError: (e) => toast.error(errorMessage(e)) })}
        >
          {t("accept")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setRejecting(true)}>
          {t("reject")}
        </Button>
      </div>
      <RejectDialog id={doc.id} open={rejecting} onOpenChange={setRejecting} />
    </li>
  )
}

export function StaffDocumentsPage() {
  const t = useT("documents")
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("none")
  const query = useStaffDocuments(filter)
  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (query.data.length === 0) body = <StateView state="empty" title={t("queueEmpty")} />
  else
    body = (
      <ul className="flex flex-col gap-2">
        {query.data.map((doc) => (
          <QueueRow key={doc.id} doc={doc} />
        ))}
      </ul>
    )
  return (
    <AdmissionShell roles={[...DOCUMENT_ROLES]}>
      <div className={pageClass()}>
        <AppPageHeader icon="files" title={t("queueTitle")} />
        <Tabs value={filter} onValueChange={(value) => setFilter(value as (typeof FILTERS)[number])}>
          <ScrollTabsList>
            {FILTERS.map((value) => (
              <TabsTrigger key={value} value={value}>
                {t(`filter.${value}`)}
              </TabsTrigger>
            ))}
          </ScrollTabsList>
        </Tabs>
        {body}
      </div>
    </AdmissionShell>
  )
}
