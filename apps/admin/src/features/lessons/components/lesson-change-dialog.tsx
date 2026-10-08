"use client"

import { getConflictList, patchAdminLesson, type Conflict, type LessonItem, type LessonPatchBody } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@ihsp/ui"
import { useEffect, useId, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useRoomOptions, useSubjectOptions, useTeacherOptions } from "../../shared/hooks/use-lookups"
import { fullName } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"
import { LESSON_PERIODS } from "../utils/periods"

type FormState = {
  status: "scheduled" | "cancelled"
  subject_id: string
  teacher_id: string
  room_name: string
  date: string | null
  period: number
  topic: string
}

function fromLesson(lesson: LessonItem): FormState {
  return {
    status: lesson.status,
    subject_id: lesson.subject.id,
    teacher_id: lesson.teacher?.id ?? "",
    room_name: lesson.room?.name ?? "",
    date: lesson.date,
    period: lesson.period,
    topic: lesson.topic ?? "",
  }
}

/** Only the fields that differ from the lesson; the backend marks the lesson as changed by hand (ACA-7). */
export function lessonPatch(lesson: LessonItem, form: FormState): LessonPatchBody {
  const patch: LessonPatchBody = {}
  if (form.status !== lesson.status) patch.status = form.status
  if (form.subject_id !== lesson.subject.id) patch.subject_id = form.subject_id
  if (form.teacher_id !== (lesson.teacher?.id ?? "")) patch.teacher_id = form.teacher_id === "" ? null : form.teacher_id
  if (form.room_name.trim() !== (lesson.room?.name ?? ""))
    patch.room_name = form.room_name.trim() === "" ? null : form.room_name.trim()
  if (form.date && form.date !== lesson.date) patch.date = form.date
  if (form.period !== lesson.period) patch.period = form.period
  if (form.topic.trim() !== (lesson.topic ?? "")) patch.topic = form.topic.trim() === "" ? null : form.topic.trim()
  return patch
}

/** Cancel a lesson or change its teacher, subject, room, date, period or topic (UF-ADM-07). */
export function LessonChangeDialog({ lesson, onClose }: { lesson: LessonItem; onClose: () => void }) {
  const t = useT("lessons.change")
  const errorMessage = useErrorMessage()
  const roomListId = useId()
  const subjects = useSubjectOptions()
  const teachers = useTeacherOptions()
  const rooms = useRoomOptions()
  const [form, setForm] = useState<FormState>(() => fromLesson(lesson))

  useEffect(() => setForm(fromLesson(lesson)), [lesson])

  const patch = lessonPatch(lesson, form)
  const changed = Object.keys(patch).length > 0
  const save = useAdminMutation({
    mutationFn: () => patchAdminLesson(lesson.id, patch),
    invalidate: [
      ["admin", "lessons"],
      ["admin", "rooms"],
    ],
    success: t("saved"),
    inlineError: true,
    onSuccess: onClose,
  })
  const conflicts = getConflictList<Conflict>(save.error) ?? []
  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [field]: value }))

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (changed) save.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title", { subject: lesson.subject.name })}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <LabeledField label={t("status")} htmlFor="lesson-status">
            <SelectField
              id="lesson-status"
              value={form.status}
              options={[
                { value: "scheduled", label: t("scheduled") },
                { value: "cancelled", label: t("cancelled") },
              ]}
              onChange={(value) => set("status", value === "cancelled" ? "cancelled" : "scheduled")}
            />
          </LabeledField>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField label={t("date")} htmlFor="lesson-date">
              <DatePicker id="lesson-date" value={form.date} onChange={(date) => set("date", date)} />
            </LabeledField>
            <LabeledField label={t("period")} htmlFor="lesson-period">
              <SelectField
                id="lesson-period"
                value={String(form.period)}
                options={LESSON_PERIODS.map((period) => ({ value: String(period), label: String(period) }))}
                onChange={(value) => set("period", Number(value))}
              />
            </LabeledField>
          </div>
          <LabeledField label={t("subject")} htmlFor="lesson-subject">
            <SelectField
              id="lesson-subject"
              value={form.subject_id}
              options={(subjects.data ?? []).map((subject) => ({ value: subject.id, label: subject.name.en }))}
              onChange={(value) => set("subject_id", value)}
            />
          </LabeledField>
          <LabeledField label={t("teacher")} htmlFor="lesson-teacher">
            <SelectField
              id="lesson-teacher"
              value={form.teacher_id}
              emptyLabel={t("noTeacher")}
              options={(teachers.data ?? []).map((teacher) => ({ value: teacher.id, label: fullName(teacher) }))}
              onChange={(value) => set("teacher_id", value)}
            />
          </LabeledField>
          <LabeledField label={t("room")} htmlFor="lesson-room" description={t("roomHint")}>
            <Input
              id="lesson-room"
              list={roomListId}
              value={form.room_name}
              className={TOUCH}
              autoComplete="off"
              onChange={(event) => set("room_name", event.target.value)}
            />
            <datalist id={roomListId}>
              {(rooms.data ?? []).map((room) => (
                <option key={room.id} value={room.name} />
              ))}
            </datalist>
          </LabeledField>
          <LabeledField label={t("topic")} htmlFor="lesson-topic">
            <Input
              id="lesson-topic"
              value={form.topic}
              maxLength={200}
              className={TOUCH}
              onChange={(event) => set("topic", event.target.value)}
            />
          </LabeledField>
          {conflicts.length > 0 ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                <ul className="list-disc ps-4">
                  {conflicts.map((conflict, index) => (
                    <li key={index}>{conflict.description}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : save.isError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{errorMessage(save.error)}</AlertDescription>
            </Alert>
          ) : null}
          <p className="text-muted-foreground text-xs">{t("notifyHint")}</p>
          <DialogFooter>
            <Button type="button" variant="outline" className={TOUCH} onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" className={TOUCH} disabled={!changed || save.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
