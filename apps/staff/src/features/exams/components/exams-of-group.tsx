"use client"

import { getStaffAssessmentsQuery, type StaffAssessmentItem } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { QueryState } from "../../shared/components/query-state"
import { useTeachingTimetable } from "../hooks/use-teaching-timetable"
import { useUpdateExam } from "../hooks/use-update-exam"
import { filterBySubject, groupBySection, newestFirst, statusOf, weekPeriods } from "../utils/controls"
import { setDatePrefill, type EditorState } from "../utils/editor-state"
import { subjectChoices, type TeachingGroup } from "../utils/teaching"
import { ExamEditorDialog } from "./exam-editor-dialog"
import { ExamRow, type ExamRowActions } from "./exam-row"
import { ExamSection } from "./exam-section"
import { SubjectFilter } from "./subject-filter"
import { SuggestionRow } from "./suggestion-row"
import { SuggestionsBlock } from "./suggestions-block"

/**
 * The controls of one group: the suggested dates to confirm on top, then the controls by control week (Midterm 1,
 * Midterm 2, Final, Other) with the weeks that still have no date, filtered by subject (`?subject=`).
 */
export function ExamsOfGroup({ group }: { group: TeachingGroup }) {
  const t = useT("exams")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const query = useQuery(getStaffAssessmentsQuery({ group_id: group.id, undated: true }))
  const timetable = useTeachingTimetable()
  const review = useUpdateExam()
  const [subjectParam, setSubject] = useQueryState("subject", parseAsString)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [dismissing, setDismissing] = useState<StaffAssessmentItem | null>(null)

  const items = useMemo(() => query.data?.items ?? [], [query.data])
  const subjects = useMemo(
    () => subjectChoices(timetable.data ?? [], group.id, items),
    [timetable.data, group.id, items],
  )
  const periods = useMemo(() => weekPeriods(items), [items])
  const subjectId = subjects.some((subject) => subject.id === subjectParam) ? (subjectParam ?? "") : ""

  const actions: ExamRowActions = {
    onEdit: (item) => setEditor({ mode: "edit", item }),
    onSetDate: (item) => setEditor({ mode: "setDate", prefill: setDatePrefill(item) }),
    onDismiss: setDismissing,
    onConfirm: (item) =>
      review.mutate({ id: item.id, body: { status: "planned" } }, { onSuccess: () => toast.success(t("confirmed")) }),
  }

  function dismiss() {
    if (!dismissing) return
    const item = dismissing
    review.mutate(
      { id: item.id, body: { status: "cancelled" } },
      {
        onSuccess: () => toast.success(statusOf(item) === "tentative" ? t("dismissed") : t("cancelled")),
        onSettled: () => setDismissing(null),
      },
    )
  }

  function openAdd() {
    const choice = subjects.find((subject) => subject.id === subjectId)
    setEditor({ mode: "add", prefill: choice ? { subjectId: choice.id, subgroup: choice.subgroup } : {} })
  }

  const suggesting = dismissing !== null && statusOf(dismissing) === "tentative"
  const dismissValues = dismissing
    ? { subject: dismissing.subject.name, date: f.date(dismissing.date, { day: "numeric", month: "long" }) }
    : null
  const dismissText = dismissValues
    ? suggesting
      ? t("dismissDialog.textSuggestion", dismissValues)
      : t("dismissDialog.textCancel", dismissValues)
    : undefined

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        {subjects.length > 1 ? (
          <SubjectFilter subjects={subjects} value={subjectId} onChange={(id) => void setSubject(id || null)} />
        ) : (
          <span />
        )}
        <Button className="min-h-11 md:min-h-8" onClick={openAdd}>
          <Icons.add aria-hidden />
          {t("add")}
        </Button>
      </div>
      {review.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(review.error)}
        </p>
      ) : null}
      <QueryState
        query={query}
        rows={4}
        isEmpty={(list) => filterBySubject(list.items, subjectId).length === 0}
        emptyText={items.length === 0 ? t("empty") : t("emptyFiltered")}
      >
        {(list) => {
          const visible = filterBySubject(list.items, subjectId)
          const suggestions = newestFirst(visible.filter((item) => statusOf(item) === "tentative"))
          return (
            <>
              {suggestions.length > 0 ? (
                <SuggestionsBlock count={suggestions.length}>
                  {suggestions.map((item) => (
                    <SuggestionRow key={item.id} item={item} busy={review.isPending} actions={actions} />
                  ))}
                </SuggestionsBlock>
              ) : null}
              {groupBySection(visible).map(({ section, items: sectionItems }) => (
                <ExamSection
                  key={section}
                  section={section}
                  period={section === "other" ? undefined : periods[section]}
                >
                  {sectionItems.map((item) => (
                    <ExamRow key={item.id} item={item} busy={review.isPending} actions={actions} />
                  ))}
                </ExamSection>
              ))}
            </>
          )
        }}
      </QueryState>
      <ExamEditorDialog
        state={editor}
        group={group}
        subjects={subjects}
        periods={periods}
        onClose={() => setEditor(null)}
      />
      <ConfirmDialog
        open={dismissing !== null}
        onOpenChange={(open) => !open && setDismissing(null)}
        destructive
        loading={review.isPending}
        title={suggesting ? t("dismissDialog.titleSuggestion") : t("dismissDialog.titleCancel")}
        description={dismissText}
        confirmLabel={suggesting ? t("dismissDialog.confirmSuggestion") : t("dismissDialog.confirmCancel")}
        cancelLabel={t("dismissDialog.keep")}
        onConfirm={dismiss}
      />
    </>
  )
}
