"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Label, LoadingButton, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { EXEMPLAR_KINDS, IMPORT_LIMIT, useImportExemplars, type ExemplarInput } from "../api"

/** The pasted JSON array as exemplars; null when it is not an array of up to 50 objects with the required fields. */
export function parseImport(raw: string): ExemplarInput[] | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  const items = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (data as { items?: unknown }).items
      : null
  if (!Array.isArray(items) || items.length === 0 || items.length > IMPORT_LIMIT) return null
  const valid = items.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof item.title === "string" &&
      typeof item.body === "string" &&
      typeof item.source_url === "string" &&
      (EXEMPLAR_KINDS as readonly string[]).includes(item.kind),
  )
  return valid ? (items as ExemplarInput[]) : null
}

/** POST /staff/exemplars/import: up to 50 exemplars as JSON, all stored as drafts; repeats are reported, not stored. */
export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("exemplarsStaff")
  const errorMessage = useErrorMessage()
  const run = useImportExemplars()
  const [raw, setRaw] = useState("")
  const [invalid, setInvalid] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const items = parseImport(raw)
    if (!items) {
      setInvalid(true)
      return
    }
    try {
      const result = await run.mutateAsync(items)
      toast.success(t("imported", { created: result.created.length, duplicates: result.duplicates.length }))
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("importTitle")}
      onSubmit={submit}
      footer={
        <LoadingButton type="submit" loading={run.isPending}>
          {t("import")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="ex-import" className="text-muted-foreground text-[13px] font-normal">
          {t("importLabel", { limit: IMPORT_LIMIT })}
        </Label>
        <Textarea
          id="ex-import"
          rows={12}
          className="font-mono text-xs"
          value={raw}
          aria-invalid={invalid}
          aria-describedby={invalid ? "ex-import-error" : undefined}
          onChange={(event) => {
            setRaw(event.target.value)
            setInvalid(false)
          }}
        />
        {invalid ? (
          <p id="ex-import-error" role="alert" className="text-destructive text-xs">
            {t("importInvalid", { limit: IMPORT_LIMIT })}
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}
