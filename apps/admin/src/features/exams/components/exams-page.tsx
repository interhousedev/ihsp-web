"use client"

import type { StaffAssessmentItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, PageContainer } from "@ihsp/ui"
import { useCallback, useState } from "react"
import { ExportButton } from "../../shared/components/export-button"
import { ListToolbar } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { useArrayList } from "../../shared/hooks/use-paged-list"
import { TOUCH } from "../../shared/utils/touch"
import { useConfirmExam } from "../hooks/use-confirm-exam"
import { useExamColumns } from "../hooks/use-exam-columns"
import { useExamList } from "../hooks/use-exam-list"
import { useExamToolbarFilters } from "../hooks/use-exam-toolbar-filters"
import { useExportExams } from "../hooks/use-export-exams"
import { useTentativeCount } from "../hooks/use-tentative-count"
import { selectedControl, type ExamFilterKey } from "../utils/exam-filters"
import { ExamDialog, type ExamDialogMode } from "./exam-dialog"
import { ExamDismissDialog } from "./exam-dismiss-dialog"
import { ExamsToConfirmChip } from "./exams-to-confirm-chip"
import { UndatedSwitch } from "./undated-switch"

type DialogState = { mode: ExamDialogMode; item: StaffAssessmentItem | null }

/**
 * Exams (EXAM-2, EXAM-3, UF-ADM-10): every midterm and final control of every group, with the dates nobody has
 * confirmed yet and, on request, the control weeks that still have no date for a subject. Administration confirms,
 * edits, dismisses, sets missing dates and adds controls.
 */
export function ExamsPage() {
  const t = useT("exams")
  const { filters, params, periods, query } = useExamList()
  const source = useArrayList(query)
  const toolbarFilters = useExamToolbarFilters(periods)
  const tentative = useTentativeCount()
  const confirm = useConfirmExam()
  const exportCsv = useExportExams(params, selectedControl(filters.values.control))
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [dismissing, setDismissing] = useState<StaffAssessmentItem | null>(null)

  const onEdit = useCallback((item: StaffAssessmentItem) => setDialog({ mode: "edit", item }), [])
  const onSetDate = useCallback((item: StaffAssessmentItem) => setDialog({ mode: "setDate", item }), [])
  const onConfirm = useCallback((item: StaffAssessmentItem) => confirm.mutate(item), [confirm])
  const columns = useExamColumns({
    busyId: confirm.isPending ? (confirm.variables?.id ?? null) : null,
    onEdit,
    onConfirm,
    onDismiss: setDismissing,
    onSetDate,
  })

  const confirming = filters.values.status === "tentative"
  return (
    <PageContainer
      title={t("title")}
      description={t("description")}
      actions={
        <Button type="button" className={TOUCH} onClick={() => setDialog({ mode: "create", item: null })}>
          <Icons.add aria-hidden />
          {t("newAction")}
        </Button>
      }
    >
      <PagedTable
        source={source}
        columns={columns}
        getRowId={(item) => item.id}
        emptyText={t("empty")}
        toolbar={
          <div className="flex flex-col gap-3">
            <ExamsToConfirmChip
              count={tentative}
              active={confirming}
              onToggle={() => filters.set("status", confirming ? null : "tentative")}
            />
            <ListToolbar
              filters={toolbarFilters}
              values={filters.values}
              onChange={(key, value) => filters.set(key as ExamFilterKey, value)}
              onReset={filters.reset}
              active={filters.active}
            >
              <UndatedSwitch
                checked={filters.values.undated === "true"}
                onChange={(checked) => filters.set("undated", checked ? "true" : null)}
              />
              <ExportButton onExport={exportCsv} />
            </ListToolbar>
          </div>
        }
      />
      {dialog ? <ExamDialog mode={dialog.mode} item={dialog.item} onClose={() => setDialog(null)} /> : null}
      {dismissing ? <ExamDismissDialog item={dismissing} onClose={() => setDismissing(null)} /> : null}
    </PageContainer>
  )
}
