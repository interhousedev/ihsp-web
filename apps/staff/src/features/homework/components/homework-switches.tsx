"use client"

import { keys, patchStaffLessonHomeworkSettings, type LessonHomeworkSwitchesBody } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Switch } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useId } from "react"
import { toast } from "sonner"

/**
 * The two switches of a lesson's homework: whether students may hand it in here and whether each hand-in notifies the
 * teacher. `notify === null` follows the teacher's own setting; "Use my setting" resets an override.
 */
export function HomeworkSwitches({
  lessonId,
  acceptSubmissions,
  notify,
  notifyEffective,
}: {
  lessonId: string
  acceptSubmissions: boolean
  notify: boolean | null
  notifyEffective: boolean
}) {
  const t = useT("homework")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const acceptId = useId()
  const notifyId = useId()
  const mutation = useMutation({
    mutationFn: (body: LessonHomeworkSwitchesBody) => patchStaffLessonHomeworkSettings(lessonId, body),
    onSuccess: (lesson) => {
      queryClient.setQueryData(keys.staff.lesson(lessonId), lesson)
      void queryClient.invalidateQueries({ queryKey: keys.staff.homework.boardAll() })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const busy = mutation.isPending
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex min-h-11 items-center gap-3">
        <Switch
          id={acceptId}
          checked={acceptSubmissions}
          disabled={busy}
          onCheckedChange={(checked) => mutation.mutate({ accept_submissions: checked })}
        />
        <label htmlFor={acceptId}>{t("acceptSubmissions")}</label>
      </div>
      <div className="flex min-h-11 flex-wrap items-center gap-3">
        <Switch
          id={notifyId}
          checked={notifyEffective}
          disabled={busy}
          onCheckedChange={(checked) => mutation.mutate({ notify: checked })}
        />
        <label htmlFor={notifyId}>{t("notify")}</label>
        {notify === null ? (
          <span className="text-muted-foreground">{t("notifyDefault")}</span>
        ) : (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="min-h-11 px-0 md:min-h-8"
            disabled={busy}
            onClick={() => mutation.mutate({ notify: null })}
          >
            {t("notifyReset")}
          </Button>
        )}
      </div>
    </div>
  )
}
