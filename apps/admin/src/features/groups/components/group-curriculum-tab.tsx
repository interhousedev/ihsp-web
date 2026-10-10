"use client"

import { getAdminGroupCurriculumQuery, keys, postAdminGroupCurriculumSync } from "@ihsp/api"
import { CurriculumPanel } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

/** The stored EMIS curriculum of a group with its subjects, and the button that fetches it again from EMIS. */
export function GroupCurriculumTab({ groupId }: { groupId: string }) {
  const t = useT("groups.curriculum")
  const query = useQuery(getAdminGroupCurriculumQuery(groupId))
  // A failed sync (409 when no student has an EMIS login, or 503) is toasted with its own message.
  const sync = useAdminMutation({
    mutationFn: () => postAdminGroupCurriculumSync(groupId),
    invalidate: [keys.admin.groups.curriculum(groupId)],
  })

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex flex-col items-start gap-3">
        <Button type="button" className={TOUCH} disabled={sync.isPending} onClick={() => sync.mutate()}>
          {t("sync")}
        </Button>
        {sync.isPending ? (
          <p role="status" className="text-muted-foreground text-sm">
            {t("syncing")}
          </p>
        ) : null}
        {sync.isSuccess ? (
          <Alert role="status">
            <AlertDescription>{t("synced")}</AlertDescription>
          </Alert>
        ) : null}
      </div>
      <QueryState query={query} rows={3}>
        {(curriculum) => <CurriculumPanel curriculum={curriculum} showSubjects emptyText={t("empty")} />}
      </QueryState>
    </div>
  )
}
