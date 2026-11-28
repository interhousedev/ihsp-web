"use client"

import { useServerFieldErrors } from "../../form-errors"
import type { StaffHomeworkBody, StaffLesson } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  ConfirmDialog,
  DatePicker,
  Textarea,
} from "@ihsp/ui"
import { useId, useState } from "react"
import { toast } from "sonner"
import { useDeleteHomework, useSaveHomework } from "../hooks/use-lesson-mutations"

type Due = { auto: boolean; value: string | null }

function initialDue(homework: StaffLesson["homework"]): Due {
  return homework ? { auto: homework.due_auto, value: homework.due_date } : { auto: true, value: null }
}

/**
 * Homework of the lesson (STF-7, ACA-10, UF-STF-05): the text, the due date and whether students hand work in. An
 * automatic due date is the next lesson of the subject for the audience; changing it makes it manual, and a manual
 * date is sent again when only the text changes (an omitted date means "automatic" for the backend). With no next
 * lesson the teacher picks a date. The text is optional when EMIS gave the homework.
 */
export function HomeworkEditor({
  lesson,
  homework,
}: {
  lesson: StaffLesson["lesson"]
  homework: StaffLesson["homework"]
}) {
  const t = useT("lessonDetail.homework")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const textId = useId()
  const [text, setText] = useState(homework?.text ?? "")
  const [due, setDue] = useState<Due>(() => initialDue(homework))
  const [accept, setAccept] = useState<boolean | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const save = useSaveHomework(lesson.id)
  const fieldErrors = useServerFieldErrors(save.error)
  const remove = useDeleteHomework(lesson.id)

  const trimmed = text.trim()
  const initial = initialDue(homework)
  // EMIS homework needs no text of the teacher; the backend keeps the EMIS part when the text is omitted.
  const textOptional = homework !== null && homework.source !== "teacher"
  // `null` until the teacher touches the switch: a new homework then follows the teacher's default.
  const accepting = accept ?? homework?.accept_submissions ?? true
  const acceptChanged = accept !== null && accept !== homework?.accept_submissions
  const unchanged =
    homework !== null &&
    trimmed === homework.text &&
    !acceptChanged &&
    due.auto === initial.auto &&
    due.value === initial.value
  const needsDate = due.auto && due.value === null && homework !== null

  function submit() {
    if (trimmed === "" && !textOptional) return
    const body: StaffHomeworkBody = acceptChanged ? { accept_submissions: accepting } : {}
    if (trimmed !== "") body.text = trimmed
    if (!due.auto && due.value !== null) body.due_date = due.value
    save.mutate(body, {
      onSuccess: (updated) => {
        setDue(initialDue(updated.homework))
        setAccept(null)
        toast.success(t("saved"))
      },
    })
  }

  function confirmRemoval() {
    remove.mutate(undefined, {
      onSuccess: () => {
        setText("")
        setDue({ auto: true, value: null })
        setAccept(null)
        setConfirmDelete(false)
        toast.success(t("deleted"))
      },
    })
  }

  return (
    <section id="homework" aria-labelledby={`${textId}-title`} className="scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle id={`${textId}-title`} className="text-base">
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form
            ref={fieldErrors.ref}
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <Textarea
              id={textId}
              aria-label={t("text")}
              value={text}
              rows={4}
              placeholder={t("placeholder")}
              onChange={(event) => setText(event.target.value)}
            />
            {textOptional ? <p className="text-muted-foreground text-xs">{t("textOptional")}</p> : null}
            <label className="flex min-h-11 items-center gap-3 text-sm md:min-h-8">
              <Checkbox checked={accepting} onCheckedChange={(checked) => setAccept(checked === true)} />
              {t("acceptSubmissions")}
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t("dueDate")}</span>
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-full sm:w-56">
                  <DatePicker
                    value={due.value}
                    aria-label={t("dueDate")}
                    placeholder={t("pickDate")}
                    onChange={(date) => setDue({ auto: false, value: date })}
                  />
                </div>
                {!due.auto ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 md:min-h-8"
                    onClick={() => setDue({ auto: true, value: homework?.due_auto ? homework.due_date : null })}
                  >
                    {t("useAutomatic")}
                  </Button>
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">
                {needsDate
                  ? t("noNextLesson")
                  : due.auto
                    ? due.value
                      ? t("autoDate", { date: f.date(due.value, { weekday: "long", day: "numeric", month: "long" }) })
                      : t("autoHint")
                    : t("manualDate")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                className="min-h-11 md:min-h-8"
                disabled={save.isPending || (trimmed === "" && !textOptional) || unchanged}
              >
                {homework ? t("saveChanges") : t("add")}
              </Button>
              {homework ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="min-h-11 md:min-h-8"
                  onClick={() => setConfirmDelete(true)}
                >
                  {t("delete")}
                </Button>
              ) : null}
            </div>
          </form>
          {save.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(save.error)}
            </p>
          ) : null}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={t("delete")}
        destructive
        loading={remove.isPending}
        onConfirm={confirmRemoval}
      >
        {remove.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(remove.error)}
          </p>
        ) : null}
      </ConfirmDialog>
    </section>
  )
}
