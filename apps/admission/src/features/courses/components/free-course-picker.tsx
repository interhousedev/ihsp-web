"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Pill, Skeleton, StateView } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useCourseMutations, useCourses } from "../api"
import { useFreeCourses } from "./free-courses"

/** Free university courses from the catalog; one click stores one as a course taken elsewhere. */
export function FreeCoursePicker() {
  const t = useT("courses")
  const errorMessage = useErrorMessage()
  const { query, items } = useFreeCourses()
  const mine = useCourses()
  const { add } = useCourseMutations()
  const [busyId, setBusyId] = useState<string | null>(null)
  const have = new Set((mine.data?.items ?? []).filter((c) => c.source === "manual").map((c) => c.title))

  async function pick(id: string, title: string, provider: string | null) {
    setBusyId(id)
    try {
      await add.mutateAsync({ title, provider, level: null, year: null, grade: null })
      toast.success(t("added"))
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  if (query.isPending) return <Skeleton className="h-24 w-full" />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  if (items.length === 0)
    return <p className="text-muted-foreground rounded-card border border-dashed p-3 text-sm">{t("free.empty")}</p>
  return (
    <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
      {items.map((o) => {
        const provider = o.org?.name ?? o.fields.provider ?? null
        const credit = o.fields.college_credit
        return (
          <li key={o.id} className="flex items-center justify-between gap-3 rounded-card border p-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{o.fields.title}</p>
              {provider ? <p className="text-muted-foreground truncate text-sm">{provider}</p> : null}
              {o.fields.credit_note ? <p className="text-muted-foreground text-xs">{o.fields.credit_note}</p> : null}
              {credit === "yes" || credit === "possible" ? (
                <Pill tone="success" className="h-auto whitespace-normal text-left">
                  {t(`free.credit.${credit}`)}
                </Pill>
              ) : null}
            </div>
            {have.has(o.fields.title) ? (
              <Pill tone="success" className="h-auto whitespace-normal text-left">
                {t("included")}
              </Pill>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled={busyId !== null}
                onClick={() => void pick(o.id, o.fields.title, provider)}
              >
                <Icons.add aria-hidden className="size-4" />
                {t("add")}
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
