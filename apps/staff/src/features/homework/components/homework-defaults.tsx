"use client"

import { getStaffHomeworkSettings, keys, putStaffHomeworkSettings, type HomeworkSettingsBody } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Switch } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId } from "react"
import { toast } from "sonner"

/** The teacher's defaults for new homework: accept hand-ins and get a notification for each one. */
export function HomeworkDefaults() {
  const t = useT("homework")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const acceptId = useId()
  const notifyId = useId()
  const query = useQuery({
    queryKey: keys.staff.homework.settings(),
    queryFn: ({ signal }) => getStaffHomeworkSettings({ signal }),
  })
  const mutation = useMutation({
    mutationFn: (body: HomeworkSettingsBody) => putStaffHomeworkSettings(body),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.staff.homework.settings(), data)
      // Lessons that follow the teacher's setting change their effective "notify".
      void queryClient.invalidateQueries({ queryKey: keys.staff.homework.boardAll() })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("defaults.title")}</CardTitle>
        <CardDescription>{t("defaults.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <QueryState query={query} rows={2}>
          {(settings) => (
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex min-h-11 items-center gap-3">
                <Switch
                  id={acceptId}
                  checked={settings.accept_by_default}
                  disabled={mutation.isPending}
                  onCheckedChange={(checked) => mutation.mutate({ accept_by_default: checked })}
                />
                <label htmlFor={acceptId}>{t("defaults.accept")}</label>
              </div>
              <div className="flex min-h-11 items-center gap-3">
                <Switch
                  id={notifyId}
                  checked={settings.notify_on_submission}
                  disabled={mutation.isPending}
                  onCheckedChange={(checked) => mutation.mutate({ notify_on_submission: checked })}
                />
                <label htmlFor={notifyId}>{t("defaults.notify")}</label>
              </div>
            </div>
          )}
        </QueryState>
      </CardContent>
    </Card>
  )
}
