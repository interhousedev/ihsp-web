"use client"

import {
  getStaffGroupAttendanceCsv,
  getStaffGroupAttendanceQuery,
  type GroupAttendanceView,
  type GroupItem,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, DatePicker, Icons, PageContainer, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { useState } from "react"
import { toast } from "sonner"
import { QueryState } from "../../shared/components/query-state"
import { downloadBlob } from "../../shared/utils/download-blob"
import { parseView, reportParams, VIEWS } from "../utils/report-params"
import { AttendanceReportView } from "./attendance-report"
import { ExcuseDialog } from "./excuse-dialog"
import { GroupScope } from "./group-scope"

function ReportOfGroup({ group }: { group: GroupItem }) {
  const t = useT("group.attendance")
  const errorMessage = useErrorMessage()
  const [viewParam, setView] = useQueryState("view", parseAsString)
  const [fromParam, setFrom] = useQueryState("from", parseAsString)
  const [toParam, setTo] = useQueryState("to", parseAsString)
  const [excuse, setExcuse] = useState<{ id: string; label: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const params = reportParams(parseView(viewParam), fromParam, toParam)
  const query = useQuery(getStaffGroupAttendanceQuery(group.id, params))

  async function exportCsv() {
    setExporting(true)
    try {
      downloadBlob(await getStaffGroupAttendanceCsv(group.id, params), `attendance-${group.name}-${params.view}.csv`)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t("from")}</span>
          <div className="w-44">
            <DatePicker
              value={params.from}
              aria-label={t("from")}
              onChange={(date) => void setFrom(date)}
              max={params.to}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t("to")}</span>
          <div className="w-44">
            <DatePicker
              value={params.to}
              aria-label={t("to")}
              onChange={(date) => void setTo(date)}
              min={params.from}
            />
          </div>
        </div>
        <Button variant="outline" className="min-h-11 md:min-h-8" disabled={exporting} onClick={() => void exportCsv()}>
          <Icons.upload aria-hidden />
          {t("export")}
        </Button>
      </div>
      <Tabs value={params.view} onValueChange={(value) => void setView(parseView(String(value)))}>
        <TabsList className="h-auto min-h-11 w-full flex-wrap md:h-8 md:min-h-0 md:w-fit">
          {VIEWS.map((view: GroupAttendanceView) => (
            <TabsTrigger key={view} value={view} className="min-h-11 px-3 md:min-h-0">
              {t(`views.${view}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <p className="text-muted-foreground text-xs">{t("notTakenHint")}</p>
      <QueryState query={query} rows={4} isEmpty={(report) => report.rows.length === 0} emptyText={t("empty")}>
        {(report) => (
          <AttendanceReportView report={report} onExcuse={(row) => setExcuse({ id: row.key, label: row.label })} />
        )}
      </QueryState>
      <ExcuseDialog lessonId={excuse?.id ?? null} label={excuse?.label ?? ""} onClose={() => setExcuse(null)} />
    </>
  )
}

/**
 * My group → Attendance (STF-13, ACA-12, ACA-20, UF-STF-11): the group's attendance per student, subject, day or
 * lesson for a date range, with CSV export and excuse marking.
 */
export function GroupAttendancePage() {
  const t = useT("group.attendance")
  return (
    <PageContainer title={t("title")} description={t("description")}>
      <GroupScope>{(group) => <ReportOfGroup key={group.id} group={group} />}</GroupScope>
    </PageContainer>
  )
}
