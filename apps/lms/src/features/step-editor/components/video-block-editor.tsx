"use client"

import type { Block } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Field, FieldDescription, FieldLabel, Input } from "@ihsp/ui"
import { useId } from "react"

type VideoBlock = Extract<Block, { type: "video" }>

/** A video by link (YouTube, Vimeo or a direct file) with an optional caption. */
export function VideoBlockEditor({ block, onChange }: { block: VideoBlock; onChange: (block: VideoBlock) => void }) {
  const t = useT("stepEditor")
  const urlId = useId()
  const captionId = useId()
  return (
    <div className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor={urlId}>{t("video.url")}</FieldLabel>
        <Input
          id={urlId}
          type="url"
          inputMode="url"
          value={block.url}
          onChange={(event) => onChange({ ...block, source: "link", url: event.target.value })}
          placeholder="https://"
          className="h-11 md:h-8"
        />
        <FieldDescription>{t("video.urlHint")}</FieldDescription>
      </Field>
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
