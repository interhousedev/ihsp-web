"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import Link from "next/link"
import type { ListEntry } from "../types"
import { usePlanTasks } from "../use-plan"

/** After adding a university: one tap turns its deadline into the application tasks (essays, letters, transcript, aid, fee, submit). */
export function PlanOffer({ entry, onDone }: { entry: ListEntry; onDone: () => void }) {
  const t = useT("uniList")
  const errorMessage = useErrorMessage()
  const plan = usePlanTasks()
  const name = entry.institution.name
  return (
    <div role="status" className="bg-primary/5 border-primary/20 flex flex-wrap items-center gap-3 rounded-xl border p-3">
      <Icons.sparkles aria-hidden className="text-primary size-4 shrink-0" />
      <p className="min-w-0 flex-1 text-sm">
        {plan.isSuccess ? t("plan.done", { name }) : t("plan.offer", { name })}
        {plan.isError ? <span className="text-destructive ms-2 text-xs">{errorMessage(plan.error)}</span> : null}
      </p>
      {plan.isSuccess ? (
        <Link href="/tasks/" className="text-primary inline-flex min-h-11 items-center text-sm underline-offset-2 hover:underline">
          {t("plan.open")}
        </Link>
      ) : (
        <Button type="button" size="sm" disabled={plan.isPending} onClick={() => plan.mutate(entry)}>
          {t("plan.create")}
        </Button>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={onDone}>
        {plan.isSuccess ? t("plan.close") : t("plan.later")}
      </Button>
    </div>
  )
}
