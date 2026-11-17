"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Pill, Skeleton, StateView, useDebounce } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useCourses, useEnrollAndAddLmsCourse, useLmsCatalog } from "../api"

/** Search the platform LMS catalog and add a course to the profile in one click. */
export function LmsCoursePicker() {
  const t = useT("courses")
  const errorMessage = useErrorMessage()
  const [text, setText] = useState("")
  const query = useDebounce(text.trim(), 250)
  const catalog = useLmsCatalog(query, true)
  const mine = useCourses()
  const add = useEnrollAndAddLmsCourse()
  const [busyId, setBusyId] = useState<string | null>(null)
  const lms = (mine.data?.items ?? []).filter((c) => c.source === "lms")
  const onProfile = new Set(lms.filter((c) => c.included && c.id).map((c) => c.source_ref))
  const enrolled = new Set(lms.map((c) => c.source_ref))

  async function pick(id: string) {
    setBusyId(id)
    try {
      await add.mutateAsync({ id, enrolled: enrolled.has(id) })
      toast.success(t("added"))
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        {t("lmsPicker.search")}
        <Input value={text} maxLength={100} onChange={(e) => setText(e.target.value)} />
      </label>
      {catalog.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : catalog.isError ? (
        <StateView state="error" error={catalog.error} onRetry={() => void catalog.refetch()} />
      ) : catalog.data.length === 0 ? (
        <p className="text-muted-foreground rounded-card border border-dashed p-3 text-sm">{t("lmsPicker.empty")}</p>
      ) : (
        <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {catalog.data.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-card border p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.title}</p>
                {c.summary ? <p className="text-muted-foreground line-clamp-2 text-sm">{c.summary}</p> : null}
              </div>
              {onProfile.has(c.id) ? (
                <Pill tone="success">{t("included")}</Pill>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={c.locked || busyId !== null}
                  onClick={() => void pick(c.id)}
                >
                  <Icons.add aria-hidden className="size-4" />
                  {t("add")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
