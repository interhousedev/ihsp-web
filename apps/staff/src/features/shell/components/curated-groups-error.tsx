"use client"

import { useT } from "@ihsp/i18n"
import { Alert, AlertAction, AlertTitle, Button } from "@ihsp/ui"
import { useCuratedGroups } from "../hooks/use-curated-groups"

/** Says that the curated groups could not be loaded and offers a retry, instead of hiding "My group" (STF-1). */
export function CuratedGroupsError() {
  const t = useT("shell")
  const { isError, refetch } = useCuratedGroups()
  if (!isError) return null
  return (
    <Alert variant="destructive" className="mb-4 md:me-(--shell-controls-width)">
      <AlertTitle>{t("groupsError")}</AlertTitle>
      <AlertAction>
        <Button size="sm" variant="outline" onClick={refetch}>
          {t("retry")}
        </Button>
      </AlertAction>
    </Alert>
  )
}
