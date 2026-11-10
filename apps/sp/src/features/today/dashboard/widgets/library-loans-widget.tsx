"use client"

import { getShelfQuery } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import type { Widget } from "../model"
import { CardEmpty, WidgetFrame } from "../widget-frame"
import { BigNumber, Lines, listRows } from "./shared"

/**
 * The books the student is reading now (the "reading" shelf of the library; the library keeps no loans or due dates).
 * 1x1 is the count; wider tiles list the titles. The tile opens the library app.
 */
export function LibraryLoansWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.dashboard")
  const query = useQuery(getShelfQuery({ state: "reading", limit: 10 }))
  const entries = (query.data?.items ?? []).filter((entry) => !entry.removed)
  const libraryUrl = getConfig().LIBRARY_URL
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("kinds.library_loans")}
      href={libraryUrl || undefined}
      status={query.isPending ? "loading" : query.isError ? "error" : undefined}
      onRetry={() => void query.refetch()}
    >
      {entries.length === 0 ? (
        <CardEmpty icon={Icons.journal} text={t("noLoans")} />
      ) : widget.size === "1x1" ? (
        <BigNumber value={entries.length} label={t("loansCount")} />
      ) : (
        <Lines items={entries.slice(0, listRows(widget) + 1).map((entry) => entry.item.title)} />
      )}
    </WidgetFrame>
  )
}
