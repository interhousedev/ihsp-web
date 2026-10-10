"use client"

import {
  keys,
  postStudentImport,
  postStudentImportConfirm,
  type ImportConfirmResult,
  type ImportPreview,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Input, PageContainer, Spinner } from "@ihsp/ui"
import { useRef, useState } from "react"
import { BackLink } from "../../shared/components/back-link"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"
import { ImportPreviewView } from "./import-preview"

/**
 * Import students from an EMIS CSV export (ADM-17, UF-ADM-14): upload, check the preview (new, changed, conflicts),
 * then confirm. Conflicting rows are listed so they can be fixed in the file and uploaded again.
 */
export function ImportPage() {
  const t = useT("students.import")
  const errorMessage = useErrorMessage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportConfirmResult | null>(null)

  const upload = useAdminMutation({
    mutationFn: (file: File) => postStudentImport(file),
    inlineError: true,
    onSuccess: (data) => {
      setPreview(data)
      setResult(null)
    },
  })
  const confirm = useAdminMutation({
    mutationFn: (importId: string) => postStudentImportConfirm(importId),
    invalidate: [keys.admin.students.all(), keys.admin.groups.all()],
    success: t("done"),
    onSuccess: (data) => {
      setResult(data)
      setPreview(null)
    },
  })

  return (
    <PageContainer title={t("title")} actions={<BackLink href="/students/" label={t("back")} />}>
      <form
        className="flex max-w-xl flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          const file = inputRef.current?.files?.[0]
          if (file) upload.mutate(file)
        }}
      >
        <LabeledField label={t("file")} htmlFor="import-file">
          <Input id="import-file" ref={inputRef} type="file" accept=".csv,text/csv" className={TOUCH} />
        </LabeledField>
        <div>
          <Button type="submit" className={TOUCH} disabled={upload.isPending}>
            {upload.isPending ? <Spinner aria-hidden /> : null}
            {t("uploadPreview")}
          </Button>
        </div>
      </form>

      {upload.isError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{errorMessage(upload.error)}</AlertDescription>
        </Alert>
      ) : null}

      {preview ? (
        <div className="flex flex-col gap-3">
          <ImportPreviewView preview={preview} />
          {preview.conflicts.length > 0 ? (
            <Alert>
              <AlertDescription>{t("conflictsHint", { count: preview.conflicts.length })}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className={TOUCH}
              disabled={confirm.isPending}
              onClick={() => confirm.mutate(preview.import_id)}
            >
              {confirm.isPending ? <Spinner aria-hidden /> : null}
              {t("confirm", { count: preview.new.length + preview.changed.length })}
            </Button>
            <Button type="button" variant="outline" className={TOUCH} onClick={() => setPreview(null)}>
              {t("discard")}
            </Button>
          </div>
        </div>
      ) : null}

      {result ? (
        <Alert role="status">
          <AlertDescription>
            {t("result", { created: result.created, updated: result.updated, skipped: result.skipped })}
          </AlertDescription>
        </Alert>
      ) : null}
    </PageContainer>
  )
}
