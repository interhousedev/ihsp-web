"use client"

import { getManageStatsQuery, type ItemStatus, type LibraryReportReason } from "@ihsp/api"
import { addDays, todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Input, Label, PageContainer, Stat, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { CountList, QueueBlock, StatsSection, SubjectsWithoutMaterials, TopItems, UploadsBars } from "./stats-sections"

const RANGE_DAYS = 30

/**
 * `/manage/stats/`: the librarian's dashboard (§ 3.6): queue length and age against the two-school-day service level,
 * uploads by day, searches without results, top items, items by status, reports by reason and the subjects that still
 * have no materials. The date range filters what the API counts.
 */
export function StatsPage() {
  const t = useT("library.manage.stats")
  const status = useT("library.item.status")
  const reason = useT("library.report.reason")
  const { locale } = useFormatters()
  const [from, setFrom] = useState(() => addDays(todayIso(), -RANGE_DAYS))
  const [to, setTo] = useState(() => todayIso())
  const valid = from !== "" && to !== "" && from <= to
  const query = useQuery({ ...getManageStatsQuery({ from, to }), enabled: valid })
  const number = new Intl.NumberFormat(locale)

  return (
    <PageContainer title={t("title")}>
      <div role="group" aria-label={t("range")} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stats-from">{t("from")}</Label>
          <Input
            id="stats-from"
            type="date"
            value={from}
            max={to || undefined}
            className="min-h-11 md:min-h-8"
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stats-to">{t("to")}</Label>
          <Input
            id="stats-to"
            type="date"
            value={to}
            min={from || undefined}
            className="min-h-11 md:min-h-8"
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
      </div>
      {!valid ? (
        <p role="alert" className="text-destructive text-sm">
          {t("rangeInvalid")}
        </p>
      ) : query.isPending ? (
        <StateView state="loading" rows={4} />
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <StatsSection title={t("overview")} wide>
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label={t("opens")} value={number.format(query.data.opens)} />
              <Stat label={t("readers")} value={number.format(query.data.readers)} />
            </div>
          </StatsSection>
          <StatsSection title={t("queue.title")}>
            <QueueBlock queue={query.data.queue} />
          </StatsSection>
          <StatsSection title={t("uploads")}>
            <UploadsBars days={query.data.uploads_by_day} />
          </StatsSection>
          <StatsSection title={t("searchesWithout")}>
            <CountList
              label={t("searchesWithout")}
              empty={t("noSearches")}
              rows={query.data.searches_without_results.map((row) => ({ key: row.q, name: row.q, count: row.count }))}
            />
          </StatsSection>
          <StatsSection title={t("topItems")}>
            <TopItems rows={query.data.top_items} />
          </StatsSection>
          <StatsSection title={t("byStatus")}>
            <CountList
              label={t("byStatus")}
              empty={t("noItems")}
              rows={(Object.entries(query.data.items_by_status) as [ItemStatus, number][]).map(([key, count]) => ({
                key,
                name: status(key),
                count,
              }))}
            />
          </StatsSection>
          <StatsSection title={t("byReason")}>
            <CountList
              label={t("byReason")}
              empty={t("noReports")}
              rows={(Object.entries(query.data.reports_by_reason) as [LibraryReportReason, number][]).map(
                ([key, count]) => ({ key, name: reason(key), count }),
              )}
            />
          </StatsSection>
          <StatsSection title={t("subjectsWithout")} wide>
            <SubjectsWithoutMaterials rows={query.data.subjects_without_materials} />
          </StatsSection>
        </div>
      )}
    </PageContainer>
  )
}
