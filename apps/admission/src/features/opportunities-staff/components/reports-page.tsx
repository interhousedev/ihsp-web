"use client"

import { formatDateTime, useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { toast } from "sonner"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { CURATOR_ROLES } from "../../../config/nav"
import { useCommentMutations, useDismissReport, useReports, type OppReport } from "../../opportunities/api"
import { detailHref } from "../../opportunities/components/scholarship-card"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { QueryError } from "../../shell/components/query-error"

function ReportRow({ report }: { report: OppReport }) {
  const t = useT("opportunitiesStaff")
  const errorMessage = useErrorMessage()
  const dismiss = useDismissReport()
  const { hide } = useCommentMutations(report.comment.opportunity_id)
  const onError = (error: unknown) => toast.error(errorMessage(error))
  const busy = dismiss.isPending || hide.isPending

  function hideAndClose() {
    hide.mutate(
      { id: report.comment.id, hidden: true },
      { onError, onSuccess: () => dismiss.mutate(report.id, { onError }) },
    )
  }

  return (
    <li className="bg-card flex flex-col gap-3 rounded-card border p-4">
      <p className="text-sm whitespace-pre-wrap">{report.comment.body}</p>
      <p className="text-muted-foreground text-xs">
        {report.comment.author_name} · {formatDateTime(report.comment.created_at)}
      </p>
      <p className="text-sm">
        <span className="text-muted-foreground">{t("reports.reportedBy", { name: report.reporter_name })}: </span>
        {report.reason}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={busy} onClick={hideAndClose}>
          {t("reports.hide")}
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => dismiss.mutate(report.id, { onError })}>
          {t("reports.dismiss")}
        </Button>
        <Link href={detailHref(report.comment.opportunity_id)} className="text-primary text-sm hover:underline">
          {t("reports.open")}
        </Link>
      </div>
    </li>
  )
}

export function OpportunityReportsBody() {
  const t = useT("opportunitiesStaff")
  const query = useReports()
  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (query.data.items.length === 0) body = <StateView state="empty" title={t("reports.empty")} />
  else
    body = (
      <ul className="flex flex-col gap-3">
        {query.data.items.map((r) => (
          <ReportRow key={r.id} report={r} />
        ))}
      </ul>
    )
  return (
    <div className={pageClass()}>
      <AppPageHeader icon="flag" title={t("reports.title")} />
      {body}
    </div>
  )
}

export function OpportunityReportsPage() {
  return (
    <AdmissionShell roles={[...CURATOR_ROLES]}>
      <OpportunityReportsBody />
    </AdmissionShell>
  )
}
