"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import Link from "next/link"
import { usePlanTasks } from "../use-plan"
import type { ListRow } from "../use-list-rows"

/** What to do for this university next to its deadlines: the plan as tasks (n/m done), the essays and the documents. */
export function ApplyActions({ row }: { row: ListRow | undefined }) {
  const t = useT("chooser")
  const list = useT("uniList")
  const errorMessage = useErrorMessage()
  const plan = usePlanTasks()
  if (!row) return <p className="text-muted-foreground text-sm">{t("apply.notInList")}</p>
  const { tasks, entry } = row
  return (
    <section aria-label={t("apply.title")} className="bg-card flex flex-col gap-3 rounded-card border p-4">
      <h3 className="text-base font-semibold">{t("apply.title")}</h3>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {tasks.total > 0 ? (
          <Link
            href={`/tasks/?uni=${encodeURIComponent(entry.id)}`}
            className="text-primary inline-flex min-h-9 items-center gap-1 font-medium tabular-nums underline-offset-2 hover:underline"
          >
            {list("tasks", { done: tasks.done, total: tasks.total })}
            <Icons.arrowRight aria-hidden className="size-4" />
          </Link>
        ) : (
          <>
            <span className="text-muted-foreground">{list("noTasks")}</span>
            <Button type="button" size="sm" disabled={plan.isPending} onClick={() => plan.mutate(entry)}>
              {list("plan.create")}
            </Button>
          </>
        )}
        <Link
          href="/essays/"
          className="text-primary inline-flex min-h-9 items-center underline-offset-2 hover:underline"
        >
          {t("apply.essays")}
        </Link>
        <Link
          href="/documents/"
          className="text-primary inline-flex min-h-9 items-center underline-offset-2 hover:underline"
        >
          {t("apply.documents")}
        </Link>
      </div>
      {plan.isError ? (
        <p role="alert" className="text-destructive text-xs">
          {errorMessage(plan.error)}
        </p>
      ) : null}
    </section>
  )
}
