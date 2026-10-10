"use client"

import type { Block } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Field, FieldDescription, FieldLabel, Icons, Input, Progress } from "@ihsp/ui"
import { type ChangeEvent, useId, useRef } from "react"
import { VideoFile } from "../../shared/components/video-file"
import { useEditorVideoUrl } from "../hooks/use-editor-video-url"
import { useVideoUpload } from "../hooks/use-video-upload"

type VideoBlock = Extract<Block, { type: "video" }>

const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"

/**
 * A video by link (YouTube, Vimeo or a direct file) or an uploaded file, with an optional caption. An upload shows a
 * progress bar, then a preview player with replace and remove.
 */
export function VideoBlockEditor({
  block,
  onChange,
  courseId,
  stepId,
}: {
  block: VideoBlock
  onChange: (block: VideoBlock) => void
  courseId?: string
  stepId?: string
}) {
  const t = useT("stepEditor")
  const errorMessage = useErrorMessage()
  const urlId = useId()
  const captionId = useId()
  const input = useRef<HTMLInputElement>(null)
  const upload = useVideoUpload()
  const uploaded = block.source === "upload" && block.file_id ? block.file_id : null
  const preview = useEditorVideoUrl({
    courseId,
    stepId,
    blockId: block.id,
    fileId: uploaded,
  })
  const busy = upload.progress !== null

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const stored = await upload.start(file)
    if (stored) onChange({ ...block, source: "upload", file_id: stored.id, url: "" })
  }

  return (
    <div className="flex flex-col gap-3">
      {uploaded ? (
        <div className="flex flex-col gap-2">
          {preview.data ? (
            <VideoFile src={preview.data} label={t("video.preview")} positionKey={`editor:${uploaded}`} />
          ) : preview.isError ? (
            <p className="text-muted-foreground text-sm">{t("video.previewUnavailable")}</p>
          ) : (
            <div className="bg-muted aspect-video w-full animate-pulse rounded-lg" aria-hidden />
          )}
        </div>
      ) : (
        <Field>
          <FieldLabel htmlFor={urlId}>{t("video.url")}</FieldLabel>
          <Input
            id={urlId}
            type="url"
            inputMode="url"
            value={block.url}
            onChange={(event) =>
              onChange({
                ...block,
                source: "link",
                file_id: null,
                url: event.target.value,
              })
            }
            placeholder="https://"
            disabled={busy}
            className="h-11 md:h-8"
          />
        </Field>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="min-h-11 md:min-h-8"
        >
          <Icons.upload aria-hidden />
          {uploaded ? t("video.replace") : t("video.upload")}
        </Button>
        {uploaded ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => onChange({ ...block, source: "link", file_id: null, url: "" })}
            className="min-h-11 md:min-h-8"
          >
            <Icons.trash aria-hidden />
            {t("video.remove")}
          </Button>
        ) : null}
        <input
          ref={input}
          type="file"
          accept={VIDEO_ACCEPT}
          hidden
          tabIndex={-1}
          aria-label={t("video.file")}
          onChange={(event) => void onPick(event)}
        />
      </div>

      {busy ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">{t("video.uploading", { name: upload.name ?? "" })}</span>
            <Button type="button" variant="ghost" size="sm" onClick={upload.cancel} className="min-h-11 md:min-h-7">
              {t("video.cancel")}
            </Button>
          </div>
          <Progress value={upload.progress ?? 0} aria-label={t("video.progress")} />
        </div>
      ) : null}
      {upload.error || upload.rejected ? (
        <Alert variant="destructive">
          <AlertDescription>{upload.rejected ? t("video.rejected") : errorMessage(upload.error)}</AlertDescription>
        </Alert>
      ) : null}

      <Field>
        <FieldLabel htmlFor={captionId}>{t("video.caption")}</FieldLabel>
        <Input
          id={captionId}
          value={block.caption}
          onChange={(event) => onChange({ ...block, caption: event.target.value })}
          className="h-11 md:h-8"
        />
      </Field>
    </div>
  )
}
