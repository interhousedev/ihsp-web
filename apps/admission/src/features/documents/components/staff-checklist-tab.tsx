"use client"

import { ApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, Skeleton, StateView } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { usePatchChecklist, useStudentChecklist, type ChecklistItem } from "../api"
import { QueryError } from "../../shell/components/query-error"

const HTTP_URL = /^https:\/\/\S+$/i

function SourceUrlForm({ item }: { item: ChecklistItem }) {
  const t = useT("documents")
  const errorMessage = useErrorMessage()
  const patch = usePatchChecklist()
  const [value, setValue] = useState(item.source_url ?? "")
  const [invalid, setInvalid] = useState(false)
  const title = t.has(`checklist.${item.title_key}`) ? t(`checklist.${item.title_key}`) : item.title_key
  const inputId = `source-url-${item.id}`

  function save(raw: string) {
    const url = raw.trim()
    if (url && !HTTP_URL.test(url)) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    patch.mutate(
      { id: item.id, source_url: url || null },
      {
        onSuccess: () => {
          if (!url) setValue("")
          toast.success(t("sourceUrl.saved"))
        },
        onError: (error) => {
          if (error instanceof ApiError && (error.type === "admission/invalid_proof_url" || error.status === 422)) {
            setInvalid(true)
            return
          }
          toast.error(errorMessage(error))
        },
      },
    )
  }

  return (
    <li className="flex flex-col gap-1.5 py-3">
      <span className="font-medium">
        {title}
        {item.institution_name ? ` · ${item.institution_name}` : ""}
      </span>
      <label htmlFor={inputId} className="text-muted-foreground text-xs">
        {t("sourceUrl.label")}
        <span className="sr-only"> · {title}</span>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={inputId}
          type="url"
          inputMode="url"
          className="min-w-0 flex-1"
          placeholder={t("sourceUrl.placeholder")}
          value={value}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${inputId}-error` : undefined}
          onChange={(e) => {
            setValue(e.target.value)
            setInvalid(false)
          }}
        />
        <Button
          type="button"
          size="sm"
          className="min-h-11 md:min-h-9"
          disabled={patch.isPending}
          onClick={() => save(value)}
        >
          {t("sourceUrl.save")}
        </Button>
        {item.source_url && (
          <Button type="button" size="sm" variant="outline" disabled={patch.isPending} onClick={() => save("")}>
            {t("sourceUrl.clear")}
          </Button>
        )}
      </div>
      {invalid && (
        <p id={`${inputId}-error`} role="alert" className="text-destructive text-xs">
          {t("sourceUrl.invalid")}
        </p>
      )}
    </li>
  )
}

/** Staff view of a student's checklist: set or clear the external link of each item. */
export function StaffChecklistTab({ studentId }: { studentId: string }) {
  const t = useT("documents")
  const query = useStudentChecklist(studentId)
  if (query.isPending) return <Skeleton className="h-32 w-full" />
  if (query.isError) return <QueryError error={query.error} onRetry={() => void query.refetch()} />
  if (query.data.length === 0) return <StateView state="empty" title={t("checklistEmpty")} />
  return (
    <ul className="divide-y rounded-card border px-3" aria-label={t("checklistTitle")}>
      {query.data.map((item) => (
        <SourceUrlForm key={`${item.id}:${item.source_url ?? ""}`} item={item} />
      ))}
    </ul>
  )
}
