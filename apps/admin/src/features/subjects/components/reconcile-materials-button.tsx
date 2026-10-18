"use client"

import { postAdminReconcileSubjectMaterials, type ReconcileMaterials } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { TOUCH } from "../../shared/utils/touch"

/** "Check that all lesson materials are in the notebook": syncs every student's subject notebook now. */
export function ReconcileMaterialsButton({ subjectId }: { subjectId: string }) {
  const t = useT("subjects.reconcile")
  const [result, setResult] = useState<ReconcileMaterials | null>(null)
  const run = useMutation({
    mutationFn: () => postAdminReconcileSubjectMaterials(subjectId),
    onSuccess: (data) => setResult(data),
  })
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground text-xs">{t("hint")}</p>
      <Button type="button" variant="outline" className={TOUCH} disabled={run.isPending} onClick={() => run.mutate()}>
        {run.isPending ? t("running") : t("button")}
      </Button>
      {result && (
        <p role="status" className="text-xs">
          {t("done", { ...result })}
        </p>
      )}
      {run.isError && (
        <p role="alert" className="text-destructive text-xs">
          {t("error")}
        </p>
      )}
    </div>
  )
}
