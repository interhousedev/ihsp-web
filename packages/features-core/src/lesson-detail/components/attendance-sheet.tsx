"use client"

import { keys, type AttendanceSheet, type AttendanceSubmitBody, type LessonItem } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Card, CardContent, CardHeader, CardTitle, StateView } from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { toast } from "sonner"
import { fullName } from "../utils/people"
import { useAttendanceDraft } from "../hooks/use-attendance-draft"
import { useSubmitAttendance } from "../hooks/use-submit-attendance"
import { useWorkOffTemplates } from "../hooks/use-work-off-templates"
import { applyAttendanceSheet } from "../utils/cache"
import { conflictingSheet, isLessonCancelled, isWindowClosed } from "../utils/conflict"
import {
  absentCount,
  buildSubmitBody,
  lateCount,
  isUncounted,
  rosterOf,
  rosterSections,
  type AttendanceMark,
  type SheetRosterItem,
} from "../utils/marks"
import { buildWorkOffEntries, defaultDraft, toCommonWorkOff, workOffOf } from "../utils/work-offs"
import { AttendanceConflictDialog } from "./attendance-conflict-dialog"
import { RosterRow } from "./roster-row"
import { SaveAttendanceControls } from "./save-attendance-controls"
import { UncountedRow } from "./uncounted-row"
import { WorkOffDialog } from "./work-off-dialog"
import { WorkOffPanel } from "./work-off-panel"

/**
 * The attendance sheet of a lesson (STF-8, UF-STF-06, ACA-2, ACA-11): everyone starts present, the teacher taps the
 * absent students and submits exactly that list with the version they opened. Students without a subgroup have a
 * section of their own and count only when marked. After the 7-day window (or for a cancelled lesson) the sheet is
 * read-only. A `409` opens the conflict dialog with the current list.
 */
export function AttendanceSheetView({ lesson, sheet }: { lesson: LessonItem; sheet: AttendanceSheet }) {
  const t = useT("lessonDetail.attendance")
  const tw = useT("lessonDetail.workOff")
  const f = useFormatters()
  const titleId = useId()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const draft = useAttendanceDraft(sheet)
  const submit = useSubmitAttendance(lesson.id)
  const [conflict, setConflict] = useState<AttendanceSheet | null>(null)
  const templates = useWorkOffTemplates()
  /** The student whose work-off task is being chosen (right after marking them absent, or from the row). */
  const [choosing, setChoosing] = useState<string | null>(null)

  const cancelled = lesson.status === "cancelled"
  const readOnly = !sheet.editable || cancelled
  const sections = rosterSections(sheet)
  const counted = rosterOf(sheet).filter((item) => !isUncounted(item, sheet))
  const markedUncounted = rosterOf(sheet).filter(
    (item) => isUncounted(item, sheet) && (draft.marks[item.user_id] ?? "none") !== "none",
  ).length
  const total = counted.length + markedUncounted
  const absent = absentCount(draft.marks)
  const late = lateCount(draft.marks)
  const unmarkedCount = rosterOf(sheet).filter(
    (item) => isUncounted(item, sheet) && (draft.marks[item.user_id] ?? "none") === "none",
  ).length

  function save(extra: Partial<AttendanceSubmitBody> = perStudentWorkOffs()) {
    submit.mutate(
      { ...buildSubmitBody(draft.marks, sheet, draft.baseVersion), ...extra },
      {
        onSuccess: (saved) => {
          draft.reset(saved)
          toast.success(t("saved"))
        },
        onError: (error) => {
          const theirs = conflictingSheet(error)
          if (theirs) {
            setConflict(theirs)
            return
          }
          if (isWindowClosed(error) || isLessonCancelled(error)) {
            void queryClient.invalidateQueries({ queryKey: keys.staff.lesson(lesson.id) })
          }
        },
      },
    )
  }

  function studentName(userId: string): string {
    const item = rosterOf(sheet).find((entry) => entry.user_id === userId)
    return item ? fullName(item) : ""
  }

  function workOffPanel(item: SheetRosterItem) {
    return (
      <WorkOffPanel
        lessonId={lesson.id}
        name={fullName(item)}
        draft={draft.workOffs[item.user_id]}
        saved={workOffOf(sheet.work_offs, item.user_id)}
        templates={templates}
        readOnly={readOnly}
        onEditDraft={() => setChoosing(item.user_id)}
      />
    )
  }

  function perStudentWorkOffs(): Partial<AttendanceSubmitBody> {
    const entries = buildWorkOffEntries(draft.workOffs, draft.marks, sheet.work_offs, templates)
    return entries.length > 0 ? { work_offs: entries } : {}
  }

  /** Marks a student; a new absence opens the work-off dialog. */
  function markStudent(userId: string, mark: AttendanceMark, apply: (userId: string, mark: AttendanceMark) => void) {
    const wasAbsent = draft.marks[userId] === "absent"
    apply(userId, mark)
    if (mark === "absent" && !wasAbsent) setChoosing(userId)
  }

  function review(theirs: AttendanceSheet) {
    applyAttendanceSheet(queryClient, lesson.id, theirs)
    draft.reset(theirs)
    setConflict(null)
    submit.reset()
  }

  function keepMine(theirs: AttendanceSheet) {
    applyAttendanceSheet(queryClient, lesson.id, theirs)
    draft.rebase(theirs)
    setConflict(null)
    submit.reset()
  }

  return (
    <section id="attendance" aria-labelledby={titleId} className="scroll-mt-20">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle id={titleId} className="text-base">
            {t("title")}
          </CardTitle>
          {!readOnly ? (
            <Button variant="outline" className="min-h-11 md:min-h-8" onClick={draft.markEveryonePresent}>
              {t("everyonePresent")}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {cancelled ? (
            <Alert>
              <AlertDescription>{t("cancelled")}</AlertDescription>
            </Alert>
          ) : !sheet.editable ? (
            <Alert>
              <AlertDescription>{t("windowClosed")}</AlertDescription>
            </Alert>
          ) : null}

          {sheet.submitted && sheet.submitted_at ? (
            <p className="text-muted-foreground text-xs">
              {sheet.submitted_by
                ? t("submittedBy", { time: f.dateTime(sheet.submitted_at), name: fullName(sheet.submitted_by) })
                : t("submittedAt", { time: f.dateTime(sheet.submitted_at) })}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">{readOnly ? t("notTaken") : t("hint")}</p>
          )}

          {draft.stale ? (
            <Alert role="status">
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                {t("stale")}
                <Button variant="outline" className="min-h-11 md:min-h-8" onClick={() => draft.reset(sheet)}>
                  {t("showCurrent")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {rosterOf(sheet).length === 0 ? (
            <StateView state="empty" emptyText={t("noStudents")} />
          ) : (
            sections.map((section) => (
              <div key={section.key} className="flex flex-col gap-2">
                {section.heading ? <h3 className="text-sm font-medium">{section.heading}</h3> : null}
                {section.uncounted ? (
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-medium">{t("unassigned.title")}</h3>
                    <p className="text-muted-foreground text-xs">{t("unassigned.hint")}</p>
                  </div>
                ) : null}
                <ul className="flex flex-col gap-1.5">
                  {section.items.map((item) =>
                    section.uncounted ? (
                      <UncountedRow
                        key={item.user_id}
                        item={item}
                        mark={draft.marks[item.user_id] ?? "none"}
                        readOnly={readOnly}
                        onMark={(mark) => markStudent(item.user_id, mark, draft.setUnassigned)}
                      >
                        {workOffPanel(item)}
                      </UncountedRow>
                    ) : (
                      <RosterRow
                        key={item.user_id}
                        item={item}
                        mark={draft.marks[item.user_id] ?? "present"}
                        readOnly={readOnly}
                        onMark={(mark) => markStudent(item.user_id, mark, draft.mark)}
                      >
                        {workOffPanel(item)}
                      </RosterRow>
                    ),
                  )}
                </ul>
              </div>
            ))
          )}

          <p className="text-sm font-medium" aria-live="polite">
            {[
              t("presentCount", { count: total - absent - late }),
              late > 0 ? t("lateCount", { count: late }) : null,
              absent > 0 ? t("absentCount", { count: absent }) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            {unmarkedCount > 0 ? ` · ${t("unassigned.notCounted", { count: unmarkedCount })}` : null}
          </p>

          {submit.isError && conflictingSheet(submit.error) === null ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(submit.error)}
            </p>
          ) : null}

          {!readOnly ? (
            <SaveAttendanceControls
              label={sheet.submitted ? t("saveChanges") : t("submit")}
              disabled={sheet.submitted && !draft.dirty}
              pending={submit.isPending}
              absent={absent}
              templates={templates}
              onSave={() => save()}
              onSaveWithout={() => save({ work_off_mode: "none" })}
              onSaveCommon={(choice) => save({ work_off_mode: "common", common_work_off: toCommonWorkOff(choice) })}
            />
          ) : null}
        </CardContent>
      </Card>
      {choosing !== null ? (
        <WorkOffDialog
          key={templates.length > 0 ? "templates" : "loading"}
          title={tw("titleFor", { name: studentName(choosing) })}
          mode="choose"
          templates={templates}
          initial={draft.workOffs[choosing] ?? defaultDraft(templates)}
          requireText={false}
          onClose={() => setChoosing(null)}
          onSubmit={(choice) => {
            draft.setWorkOff(choosing, choice)
            setChoosing(null)
          }}
        />
      ) : null}
      <AttendanceConflictDialog theirs={conflict} onReview={review} onKeepMine={keepMine} />
    </section>
  )
}
