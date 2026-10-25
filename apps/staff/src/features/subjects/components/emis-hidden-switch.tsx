"use client"

import { getStaffEmisSourcesHiddenQuery, keys, putStaffEmisSourcesHidden, type EmisSourcesHidden } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Switch } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** "Hide EMIS sources for this group": one switch per group; students of the group stop seeing EMIS materials. */
export function EmisHiddenSwitch({
  subjectId,
  groupId,
  groupName,
}: {
  subjectId: string
  groupId: string
  groupName: string
}) {
  const t = useT("subjects.lessonSources")
  const errorMessage = useErrorMessage()
  const client = useQueryClient()
  const rule = useQuery(getStaffEmisSourcesHiddenQuery(subjectId, groupId))
  const change = useMutation({
    mutationFn: (hidden: boolean) => putStaffEmisSourcesHidden(subjectId, groupId, { hidden }),
    onSuccess: async (data: EmisSourcesHidden) => {
      client.setQueryData(keys.staffSubjects.emisHidden(subjectId, groupId), data)
      await client.invalidateQueries({ queryKey: keys.staffSubjects.lessonSourcesAll(subjectId) })
    },
  })
  const id = `emis-hidden-${groupId}`
  return (
    <div className="flex flex-col gap-1">
      <div className="flex min-h-11 items-center gap-3">
        <Switch
          id={id}
          checked={rule.data?.hidden ?? false}
          disabled={rule.data === undefined || change.isPending}
          onCheckedChange={(next) => change.mutate(next === true)}
        />
        <label htmlFor={id} className="text-sm">
          {t("hideForGroup", { group: groupName })}
        </label>
      </div>
      {change.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(change.error)}
        </p>
      ) : null}
    </div>
  )
}
