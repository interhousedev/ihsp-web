"use client"

import { getConflictList, postAdminLessons, type Conflict } from "@ihsp/api"
import { todayIso, useErrorMessage, useT } from "@ihsp/i18n"
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
import { AudiencePicker, type AudienceChoice } from "../../shared/components/audience-picker"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useGroupOptions, useRoomOptions, useSubjectOptions, useTeacherOptions } from "../../shared/hooks/use-lookups"
import { fullName } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"
import { LESSON_PERIODS } from "../utils/periods"

/** An extra lesson outside the timetable (ADM-10): date, period, subject, teacher, room and audience. */
export function ExtraLessonDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("lessons.extra")
  const errorMessage = useErrorMessage()
  const roomListId = useId()
  const groups = useGroupOptions()
  const subjects = useSubjectOptions()
  const teachers = useTeacherOptions()
  const rooms = useRoomOptions()
  const [date, setDate] = useState<string | null>(todayIso())
  const [period, setPeriod] = useState(1)
  const [subjectId, setSubjectId] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [room, setRoom] = useState("")
  const [topic, setTopic] = useState("")
  const [audience, setAudience] = useState<AudienceChoice[]>([])

  useEffect(() => {
    if (!open) return
    setDate(todayIso())
    setPeriod(1)
    setSubjectId("")
    setTeacherId("")
    setRoom("")
    setTopic("")
    setAudience([])
  }, [open])

  const create = useAdminMutation({
    mutationFn: () =>
      postAdminLessons({
        date: date ?? "",
        period,
        subject_id: subjectId,
        teacher_id: teacherId === "" ? null : teacherId,
        room_name: room.trim() === "" ? null : room.trim(),
        audience,
        topic: topic.trim() === "" ? undefined : topic.trim(),
      }),
    invalidate: [
      ["admin", "lessons"],
      ["admin", "rooms"],
    ],
    success: t("created"),
    inlineError: true,
    onSuccess: () => onOpenChange(false),
  })
  const conflicts = getConflictList<Conflict>(create.error) ?? []
  const valid = date !== null && subjectId !== "" && audience.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (valid) create.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField label={t("date")} htmlFor="extra-date" required>
              <DatePicker id="extra-date" value={date} onChange={setDate} />
            </LabeledField>
            <LabeledField label={t("period")} htmlFor="extra-period" required>
              <SelectField
                id="extra-period"
                value={String(period)}
                options={LESSON_PERIODS.map((item) => ({ value: String(item), label: String(item) }))}
                onChange={(value) => setPeriod(Number(value))}
              />
            </LabeledField>
          </div>
          <LabeledField label={t("subject")} htmlFor="extra-subject" required>
            <SelectField
              id="extra-subject"
              value={subjectId}
              emptyLabel={t("choose")}
              options={(subjects.data ?? []).map((subject) => ({ value: subject.id, label: subject.name.en }))}
              onChange={setSubjectId}
            />
          </LabeledField>
          <LabeledField label={t("teacher")} htmlFor="extra-teacher">
            <SelectField
              id="extra-teacher"
              value={teacherId}
              emptyLabel={t("noTeacher")}
              options={(teachers.data ?? []).map((teacher) => ({ value: teacher.id, label: fullName(teacher) }))}
              onChange={setTeacherId}
            />
          </LabeledField>
          <LabeledField label={t("room")} htmlFor="extra-room" description={t("roomHint")}>
            <Input
              id="extra-room"
              list={roomListId}
              value={room}
              className={TOUCH}
              autoComplete="off"
              onChange={(event) => setRoom(event.target.value)}
            />
            <datalist id={roomListId}>
              {(rooms.data ?? []).map((item) => (
                <option key={item.id} value={item.name} />
              ))}
            </datalist>
          </LabeledField>
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("audience")}</h3>
            <AudiencePicker groups={groups.data ?? []} value={audience} onChange={setAudience} />
          </section>
          <LabeledField label={t("topic")} htmlFor="extra-topic">
            <Input
              id="extra-topic"
              value={topic}
              maxLength={200}
              className={TOUCH}
              onChange={(event) => setTopic(event.target.value)}
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
          ) : create.isError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{errorMessage(create.error)}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className={TOUCH} onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className={TOUCH} disabled={!valid || create.isPending}>
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
