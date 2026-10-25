"use client"

import { H5P_MAX_BYTES, postLmsH5PPackage, type LearningH5PBlock } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Field, FieldDescription, FieldLabel, Icons, Input } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { type ChangeEvent, useId, useRef, useState } from "react"
import { H5PBlock as H5PPlayer } from "../../player/components/h5p-block"
import type { H5PBlock } from "../utils/content-ops"

/**
 * An H5P block: upload a `.h5p` package (Interactive Video, Question Set, Course Presentation, ...); the server checks
 * and unpacks it, the block keeps its id. A saved block shows the package in the player as a preview.
 */
export function H5PBlockEditor({
  block,
  onChange,
  courseId,
  stepId,
}: {
  block: H5PBlock
  onChange: (block: H5PBlock) => void
  courseId?: string
  stepId?: string
}) {
  const t = useT("stepEditor")
  const errorMessage = useErrorMessage()
  const input = useRef<HTMLInputElement>(null)
  const passId = useId()
  const [tooLarge, setTooLarge] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const upload = useMutation({
    mutationFn: (file: File) => postLmsH5PPackage(courseId ?? "", file),
    onSuccess: (stored) =>
      onChange({ ...block, package_id: stored.package_id, title: stored.title, main_library: stored.main_library }),
  })

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setTooLarge(file.size > H5P_MAX_BYTES)
    if (file.size > H5P_MAX_BYTES) return
    setShowPreview(false)
    upload.mutate(file)
  }

  const saved = block.package_id !== "" && !block.id.startsWith("tmp-")
  const preview: LearningH5PBlock = { ...block, passed: false, result: null }

  return (
    <div className="flex flex-col gap-3">
      {block.package_id ? (
        <p className="text-sm" data-h5p-package={block.package_id}>
          <span className="font-medium">{block.title || t("h5p.untitled")}</span>
          {block.main_library ? <span className="text-muted-foreground"> · {block.main_library}</span> : null}
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">{t("h5p.empty")}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={upload.isPending || !courseId}
          onClick={() => input.current?.click()}
          className="min-h-11 md:min-h-8"
        >
          <Icons.upload aria-hidden />
          {upload.isPending ? t("h5p.uploading") : block.package_id ? t("h5p.replace") : t("h5p.upload")}
        </Button>
        {saved && courseId && stepId ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowPreview((shown) => !shown)}
            aria-expanded={showPreview}
            className="min-h-11 md:min-h-8"
          >
            <Icons.eye aria-hidden />
            {t("h5p.preview")}
          </Button>
        ) : null}
        <input
          ref={input}
          type="file"
          accept=".h5p,application/zip"
          hidden
          tabIndex={-1}
          aria-label={t("h5p.file")}
          onChange={onPick}
        />
      </div>
      {tooLarge || upload.error ? (
        <Alert variant="destructive">
          <AlertDescription>{tooLarge ? t("h5p.tooLarge") : errorMessage(upload.error)}</AlertDescription>
        </Alert>
      ) : null}
      <Field>
        <FieldLabel htmlFor={passId}>{t("h5p.passing")}</FieldLabel>
        <Input
          id={passId}
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          value={block.passing_score_pct}
          onChange={(event) =>
            onChange({ ...block, passing_score_pct: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })
          }
          className="h-11 w-28 md:h-8"
        />
        <FieldDescription>{t("h5p.passingHint")}</FieldDescription>
      </Field>
      {showPreview && courseId && stepId ? (
        <H5PPlayer block={preview} courseId={courseId} stepId={stepId} preview />
      ) : null}
    </div>
  )
}
