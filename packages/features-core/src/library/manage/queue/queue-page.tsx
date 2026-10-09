"use client"

import type { ManageQueueRow, ModerationAction, QueueTab } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView, useIsMobile } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { useEffect, useRef, useState } from "react"
import { ItemPreviewPane } from "./item-preview-pane"
import { ModerationDialog, type ReasonedAction } from "./moderation-dialog"
import { QueueActions } from "./queue-actions"
import { QueueTable } from "./queue-table"
import { QueueTabs } from "./queue-tabs"
import { actionsFor, neighbourKey, queueQuery, QUEUE_TABS, rowKey } from "./queue-utils"
import { ReportResolveDialog } from "./report-resolve-dialog"
import { useQueueActions } from "./use-queue-actions"
import { useQueueCounts } from "./use-queue-counts"
import { useQueueShortcuts } from "./use-queue-shortcuts"

const tabParser = parseAsStringLiteral(QUEUE_TABS).withDefault("review")

/**
 * `/manage/queue/?tab=`: the librarian's review queue. Tabs with counts and age; a split view (the list on the left,
 * the preview with the scan findings, the uploader and the reports on the right; stacked on phones); sticky actions
 * with reason dialogs; `a` `c` `r` `h` act on the selected row, `j` `k` move; results are announced politely.
 */
export function QueuePage() {
  const t = useT("library.manage.queue")
  const [tab, setTab] = useQueryState("tab", tabParser)
  const counts = useQueueCounts()
  const list = useQuery(queueQuery(tab))
  const actions = useQueueActions(tab)
  const isMobile = useIsMobile()
  const previewRef = useRef<HTMLDivElement>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [reasoned, setReasoned] = useState<{ action: ReasonedAction; row: ManageQueueRow } | null>(null)
  const [resolving, setResolving] = useState<ManageQueueRow | null>(null)

  const rows = list.data?.items ?? []
  const selected = rows.find((row) => rowKey(row) === selectedKey) ?? null
  const blocked = actions.blocked
  const dialogOpen = reasoned !== null || resolving !== null

  // A phone shows the preview below the list: bring it into view when a row is chosen.
  useEffect(() => {
    if (isMobile && selectedKey) previewRef.current?.scrollIntoView?.({ block: "nearest" })
  }, [isMobile, selectedKey])

  function changeTab(next: QueueTab) {
    setSelectedKey(null)
    setReasoned(null)
    setResolving(null)
    void setTab(next)
  }

  /** Run `start` and move the selection on to the neighbour; the failed row is selected again. */
  function handle(row: ManageQueueRow, start: (callbacks: { onSuccess: () => void; onError: () => void }) => void) {
    const key = rowKey(row)
    if (selectedKey === key) setSelectedKey(neighbourKey(rows, key))
    start({
      onSuccess: () => {
        setReasoned(null)
        setResolving(null)
      },
      onError: () => setSelectedKey(key),
    })
  }

  function begin(row: ManageQueueRow, action: ModerationAction | "resolve") {
    if (!actionsFor(tab, row).includes(action)) return
    actions.resetError()
    if (action === "resolve") setResolving(row)
    else if (action === "approve") {
      if (blocked.has(rowKey(row))) return
      handle(row, (callbacks) => actions.moderate(row, "approve", undefined, callbacks))
    } else setReasoned({ action, row })
  }

  const run = (action: ModerationAction | "resolve") => () => {
    if (selected && !actions.pending) begin(selected, action)
  }
  const move = (step: 1 | -1) => () => {
    const index = rows.findIndex((row) => rowKey(row) === selectedKey)
    const next = rows[index < 0 ? (step === 1 ? 0 : rows.length - 1) : index + step]
    if (next) setSelectedKey(rowKey(next))
  }
  useQueueShortcuts(
    {
      approve: run("approve"),
      requestChanges: run("request-changes"),
      reject: run("reject"),
      hold: run("hold"),
      next: move(1),
      previous: move(-1),
    },
    !dialogOpen,
  )

  return (
    <PageContainer title={t("title")} description={t("description")}>
      <QueueTabs tab={tab} counts={counts} onTabChange={changeTab} />

      <div role="status" aria-live="polite" className="text-sm font-medium">
        {actions.status?.tone === "ok" ? actions.status.text : null}
      </div>
      {actions.status?.tone === "error" ? (
        <p role="alert" className="text-destructive text-sm font-medium">
          {actions.status.text}
        </p>
      ) : null}

      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-label={t(`tab.${tab}`)} className="flex min-w-0 flex-col gap-2">
          {list.isPending ? (
            <StateView state="loading" rows={4} />
          ) : list.isError ? (
            <StateView state="error" error={list.error} onRetry={() => void list.refetch()} />
          ) : rows.length === 0 ? (
            <StateView state="empty" emptyText={t(`empty.${tab}`)} />
          ) : (
            <>
              <QueueTable
                rows={rows}
                selectedKey={selectedKey}
                blocked={blocked}
                label={t("listLabel", { tab: t(`tab.${tab}`) })}
                onSelect={setSelectedKey}
              />
              <p className="text-muted-foreground hidden text-xs md:block">{t("shortcutsHint")}</p>
            </>
          )}
        </section>

        <div
          ref={previewRef}
          className="bg-card min-w-0 rounded-xl border p-4 md:sticky md:top-16 md:max-h-[calc(100dvh-5rem)] md:overflow-y-auto"
        >
          {selected ? (
            <div className="flex flex-col gap-2">
              <ItemPreviewPane row={selected} needsAnotherLibrarian={blocked.has(rowKey(selected))} />
              <QueueActions
                tab={tab}
                row={selected}
                pending={actions.pending}
                needsAnotherLibrarian={blocked.has(rowKey(selected))}
                onAction={(action) => begin(selected, action)}
              />
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">{t("selectHint")}</p>
          )}
        </div>
      </div>

      <ModerationDialog
        action={reasoned?.action ?? null}
        title={reasoned ? (reasoned.row.suggestion?.title ?? reasoned.row.item.title) : ""}
        pending={actions.pending}
        error={actions.error}
        onClose={() => {
          setReasoned(null)
          actions.resetError()
        }}
        onSubmit={(action, reason, note) => {
          if (reasoned) {
            handle(reasoned.row, (callbacks) => actions.moderate(reasoned.row, action, reason, callbacks, note))
          }
        }}
      />
      <ReportResolveDialog
        open={resolving !== null}
        title={resolving ? (resolving.suggestion?.title ?? resolving.item.title) : ""}
        pending={actions.pending}
        error={actions.error}
        onOpenChange={(open) => {
          if (!open) {
            setResolving(null)
            actions.resetError()
          }
        }}
        onSubmit={(action) => {
          if (resolving) handle(resolving, (callbacks) => actions.resolve(resolving, action, callbacks))
        }}
      />
    </PageContainer>
  )
}
