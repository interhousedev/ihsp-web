"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Dropdown,
  Icons,
  Input,
  Label,
  Textarea,
} from "@ihsp/ui"
import { useId, useState, type FormEvent } from "react"
import { useProposeExam, useSubjectChoices } from "../hooks/use-exams"
import { startsAtOf } from "../utils/starts-at"

type Kind = "midterm" | "final"

/**
 * "Suggest a date" for the group's head student: subject, midterm or final, date and optional time, room and note.
 * The suggestion stays "Not confirmed" until a teacher or the administration confirms it, and the dialog says so.
 */
export function SuggestExamDialog() {
  const t = useT("exams.suggest")
  const tKind = useT("exams.kind")
  const errorMessage = useErrorMessage()
  const ids = { subject: useId(), kind: useId(), date: useId(), time: useId(), room: useId(), note: useId() }
  const [open, setOpen] = useState(false)
  const [subjectId, setSubjectId] = useState("")
  const [kind, setKind] = useState<Kind>("midterm")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [room, setRoom] = useState("")
  const [note, setNote] = useState("")
  const subjects = useSubjectChoices(open)
  const propose = useProposeExam()

  function close(next: boolean) {
    setOpen(next)
    if (!next) {
      setSubjectId("")
      setKind("midterm")
      setDate("")
      setTime("")
      setRoom("")
      setNote("")
      propose.reset()
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const startsAt = startsAtOf(date, time)
    propose.mutate({
      subject_id: subjectId,
      kind,
      date,
      ...(startsAt ? { starts_at: startsAt } : {}),
      ...(room.trim() ? { room: room.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    })
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger render={<Button className="min-h-11 md:min-h-8" />}>
        <Icons.add aria-hidden />
        {t("button")}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{propose.isSuccess ? t("doneTitle") : t("title")}</DialogTitle>
          <DialogDescription>{propose.isSuccess ? t("doneText") : t("description")}</DialogDescription>
        </DialogHeader>
        {propose.isSuccess ? (
          <Button type="button" className="min-h-11 md:min-h-8" onClick={() => close(false)}>
            {t("close")}
          </Button>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={submit}>
            <div className="flex flex-col gap-1">
              <Label htmlFor={ids.subject}>{t("subject")}</Label>
              <Dropdown
                id={ids.subject}
                required
                className="w-full"
                value={subjectId}
                onValueChange={setSubjectId}
                placeholder={t("subjectPlaceholder")}
                options={(subjects.data ?? []).map((card) => ({ value: card.subject.id, label: card.subject.name }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={ids.kind}>{t("kind")}</Label>
              <Dropdown
                id={ids.kind}
                className="w-full"
                value={kind}
                onValueChange={(next) => setKind(next === "final" ? "final" : "midterm")}
                options={[
                  { value: "midterm", label: tKind("midterm") },
                  { value: "final", label: tKind("final") },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor={ids.date}>{t("date")}</Label>
                <Input
                  id={ids.date}
                  type="date"
                  required
                  className="h-11 md:h-8"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={ids.time}>{t("time")}</Label>
                <Input
                  id={ids.time}
                  type="time"
                  className="h-11 md:h-8"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={ids.room}>{t("room")}</Label>
              <Input
                id={ids.room}
                maxLength={64}
                className="h-11 md:h-8"
                value={room}
                onChange={(event) => setRoom(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={ids.note}>{t("note")}</Label>
              <Textarea
                id={ids.note}
                maxLength={1000}
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            {propose.isError ? (
              <p role="alert" className="text-destructive text-sm">
                {errorMessage(propose.error)}
              </p>
            ) : null}
            <Button
              type="submit"
              className="min-h-11 md:min-h-8"
              disabled={propose.isPending || subjectId === "" || date === ""}
            >
              {t("submit")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
