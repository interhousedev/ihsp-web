"use client"

import {
  deleteStaffLessonTemporaryMark,
  keys,
  putStaffLessonTemporaryMark,
  type RosterItem,
  type TemporaryMark,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

const VALUES = [2, 3, 4, 5] as const

/** One student: a 2 to 5 button group, an optional comment, save and remove. */
export function TemporaryMarkRow({
  lessonId,
  student,
  mark,
}: {
  lessonId: string
  student: RosterItem
  mark: TemporaryMark | null
}) {
  const t = useT("temporaryMarks")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [value, setValue] = useState<number | null>(mark?.value ?? null)
  const [comment, setComment] = useState(mark?.comment ?? "")
  const name = `${student.last_name} ${student.first_name}`

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.staff.lessonTemporaryMarks(lessonId) }),
      queryClient.invalidateQueries({ queryKey: keys.staff.temporaryMarksPending() }),
    ])
  const save = useMutation({
    mutationFn: () =>
      putStaffLessonTemporaryMark(lessonId, student.user_id, {
        value: value ?? 0,
        comment: comment.trim() === "" ? null : comment.trim(),
      }),
    onSuccess: async () => {
      toast.success(t("saved"))
      await refresh()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const remove = useMutation({
    mutationFn: () => deleteStaffLessonTemporaryMark(lessonId, student.user_id),
    onSuccess: async () => {
      setValue(null)
      setComment("")
      toast.success(t("removed"))
      await refresh()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const dirty = value !== null && (value !== mark?.value || (comment.trim() || null) !== (mark?.comment ?? null))

  return (
    <li className="flex flex-col gap-2 p-3 md:flex-row md:items-center">
      <span className="min-w-0 font-medium md:w-56">{name}</span>
      <div role="group" aria-label={t("valueFor", { name })} className="flex gap-1">
        {VALUES.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={value === item ? "default" : "outline"}
            aria-pressed={value === item}
            aria-label={t("setValue", { name, value: item })}
            onClick={() => setValue(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      <Input
        className="md:flex-1"
        value={comment}
        maxLength={500}
        aria-label={t("commentFor", { name })}
        placeholder={t("comment")}
        onChange={(event) => setComment(event.target.value)}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!dirty || save.isPending}
          aria-label={t("saveFor", { name })}
          onClick={() => save.mutate()}
        >
          {t("save")}
        </Button>
        {mark ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={remove.isPending}
            aria-label={t("removeFor", { name })}
            onClick={() => remove.mutate()}
          >
            {t("remove")}
          </Button>
        ) : null}
      </div>
    </li>
  )
}
