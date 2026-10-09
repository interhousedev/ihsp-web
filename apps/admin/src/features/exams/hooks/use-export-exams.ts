"use client"

import { getAdminAssessments, type ControlName, type StaffAssessmentsParams } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { useControlLabel } from "../../shared/hooks/use-control-label"
import { downloadCsv } from "../../shared/utils/csv"
import { examCsvRows, type ExamCsvText } from "../utils/exam-csv"
import { inControl, sortExams } from "../utils/exam-filters"

/**
 * The CSV export of the exams list (ADM-16): asks for every row of the current filters again, in the language of the
 * page, and downloads `exams.csv`.
 */
export function useExportExams(params: StaffAssessmentsParams, control: ControlName | null): () => Promise<void> {
  const t = useT("exams")
  const tKind = useT("exams.kind")
  const tStatus = useT("exams.status")
  const tSource = useT("exams.source")
  const controlLabel = useControlLabel()
  const f = useFormatters()

  return async () => {
    const { items } = await getAdminAssessments(params)
    const text: ExamCsvText = {
      header: [
        t("columns.date"),
        t("csv.week"),
        t("columns.subject"),
        t("columns.groups"),
        t("columns.kind"),
        t("csv.control"),
        t("columns.time"),
        t("columns.room"),
        t("columns.status"),
        t("columns.source"),
        t("columns.setBy"),
        t("csv.title"),
        t("columns.note"),
      ],
      kind: tKind,
      control: controlLabel,
      status: tStatus,
      source: tSource,
      time: (iso) => f.time(iso),
    }
    downloadCsv("exams.csv", examCsvRows(sortExams(items.filter((item) => inControl(item, control))), text))
  }
}
