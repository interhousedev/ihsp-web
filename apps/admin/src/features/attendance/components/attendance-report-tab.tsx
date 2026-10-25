"use client"

import {
  getAdminAttendance,
  getAdminAttendanceCsv,
  type AdminAttendanceParams,
  type AdminAttendanceView,
} from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import { ExportButton } from "../../shared/components/export-button"
import { LabeledField } from "../../shared/components/labeled-field"
import { QueryState } from "../../shared/components/query-state"
import { SelectField } from "../../shared/components/select-field"
import { useGroupOptions } from "../../shared/hooks/use-lookups"
import { downloadBlob } from "../../shared/utils/csv"
import { TOUCH } from "../../shared/utils/touch"
import { DateRangeFields } from "./date-range-fields"

const VIEWS = ["group", "student", "subject", "teacher"] as const

function percent(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`
}

/** Attendance report for a date range in four views, with CSV export (ADM-12, ADM-16, UF-ADM-09). */
export function AttendanceReportTab() {
  const t = useT("attendance.report")
  const f = useFormatters()
  const groups = useGroupOptions()
  const [state, setState] = useQueryStates({
    view: parseAsStringLiteral(VIEWS).withDefault("group"),
    from: parseAsString,
    to: parseAsString,
    group_id: parseAsString,
  })
  const params: AdminAttendanceParams = {
    view: state.view as AdminAttendanceView,
    from: state.from ?? undefined,
    to: state.to ?? undefined,
    group_id: state.view === "student" ? (state.group_id ?? undefined) : undefined,
  }
  const query = useQuery({
    queryKey: ["admin", "attendance", "report", params],
    queryFn: ({ signal }) => getAdminAttendance(params, { signal }),
  })

  async function exportCsv() {
    downloadBlob(await getAdminAttendanceCsv(params), `attendance-${state.view}.csv`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <span className="text-sm leading-none font-medium">{t("view")}</span>
          <div role="group" aria-label={t("view")} className="flex flex-wrap gap-1">
            {VIEWS.map((view) => (
              <Button
                key={view}
                type="button"
                variant={state.view === view ? "default" : "outline"}
                aria-pressed={state.view === view}
                className={TOUCH}
                onClick={() => void setState({ view })}
              >
                {t(`views.${view}`)}
              </Button>
            ))}
          </div>
        </div>
        <DateRangeFields from={state.from} to={state.to} onChange={(from, to) => void setState({ from, to })} />
        {state.view === "student" ? (
          <LabeledField label={t("group")} htmlFor="attendance-group" className="w-48">
            <SelectField
              id="attendance-group"
              value={state.group_id}
              emptyLabel={t("allGroups")}
              options={(groups.data ?? []).map((group) => ({ value: group.id, label: group.name }))}
              onChange={(value) => void setState({ group_id: value || null })}
            />
          </LabeledField>
        ) : null}
        <div className="ms-auto">
          <ExportButton onExport={exportCsv} />
        </div>
      </div>

      <QueryState query={query} rows={4} isEmpty={(report) => report.rows.length === 0} emptyText={t("empty")}>
        {(report) => (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">
              {t("period", { from: f.date(report.from), to: f.date(report.to) })}
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t(`labels.${state.view}`)}</TableHead>
                    <TableHead className="text-end">{t("lessons")}</TableHead>
                    <TableHead className="text-end">{t("absences")}</TableHead>
                    <TableHead className="text-end">{t("excused")}</TableHead>
                    <TableHead className="text-end">{t("notTaken")}</TableHead>
                    <TableHead className="text-end">{t("rate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-end tabular-nums">{row.lessons}</TableCell>
                      <TableCell className="text-end tabular-nums">{row.absences}</TableCell>
                      <TableCell className="text-end tabular-nums">{row.excused}</TableCell>
                      <TableCell className="text-end tabular-nums">{row.not_taken}</TableCell>
                      <TableCell className="text-end tabular-nums">{percent(row.rate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </QueryState>
    </div>
  )
}
