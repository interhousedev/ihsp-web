"use client"

import type { ManageQueueRow, QueueTab } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { queueQuery, rowKey } from "../queue/queue-utils"
import { ReportResolveDialog } from "../queue/report-resolve-dialog"
import { useQueueActions } from "../queue/use-queue-actions"
import { ReportRow } from "./report-row"

type Section = { tab: Extract<QueueTab, "reports" | "held">; titleKey: "open" | "held" }
const SECTIONS: readonly Section[] = [
  { tab: "reports", titleKey: "open" },
  { tab: "held", titleKey: "held" },
]

function ReportsSection({
  section,
  onResolve,
}: {
  section: Section
  onResolve: (row: ManageQueueRow, tab: Section["tab"]) => void
}) {
  const t = useT("library.manage.reports")
  const query = useQuery(queueQuery(section.tab))
  const rows = query.data?.items ?? []
  return (
    <section aria-labelledby={`reports-${section.tab}`} className="flex flex-col gap-3">
      <h2 id={`reports-${section.tab}`} className="text-lg font-semibold">
        {t(`section.${section.titleKey}`)}
      </h2>
      {query.isPending ? (
        <StateView state="loading" rows={2} />
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : rows.length === 0 ? (
        <StateView state="empty" emptyText={t(`empty.${section.titleKey}`)} />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <ReportRow
              key={rowKey(row)}
              row={row}
              held={section.tab === "held"}
              onResolve={() => onResolve(row, section.tab)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * `/manage/reports/`: the reported items (the queue's `reports` and `held` tabs) with the resolve dialog: dismiss,
 * hold, unpublish, or unpublish and warn the uploader. The decision applies to every open report of the item.
 */
export function ReportsPage() {
  const t = useT("library.manage.reports")
  const [target, setTarget] = useState<{ row: ManageQueueRow; tab: Section["tab"] } | null>(null)
  const actions = useQueueActions(target?.tab ?? "reports")

  return (
    <PageContainer title={t("title")} description={t("description")}>
      <div role="status" aria-live="polite" className="text-sm font-medium">
        {actions.status?.tone === "ok" ? actions.status.text : null}
      </div>
      {actions.status?.tone === "error" ? (
        <p role="alert" className="text-destructive text-sm font-medium">
          {actions.status.text}
        </p>
      ) : null}
      {SECTIONS.map((section) => (
        <ReportsSection
          key={section.tab}
          section={section}
          onResolve={(row, tab) => {
            actions.resetError()
            setTarget({ row, tab })
          }}
        />
      ))}
      <ReportResolveDialog
        open={target !== null}
        title={target?.row.item.title ?? ""}
        pending={actions.pending}
        error={actions.error}
        onOpenChange={(open) => {
          if (!open) setTarget(null)
        }}
        onSubmit={(action) => {
          if (target) actions.resolve(target.row, action, { onSuccess: () => setTarget(null) })
        }}
      />
    </PageContainer>
  )
}
