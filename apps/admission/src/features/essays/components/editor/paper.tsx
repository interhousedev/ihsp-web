"use client"

import { useT } from "@ihsp/i18n"
import { Label, Textarea } from "@ihsp/ui"
import type { Ref } from "react"

export type PaperProps = {
  title: string
  prompt: string
  body: string
  readOnly: boolean
  onBody: (value: string) => void
  textareaRef?: Ref<HTMLTextAreaElement>
}

/** The white page: a big title, the prompt as a muted subtitle and the text itself. */
export function Paper({ title, prompt, body, readOnly, onBody, textareaRef }: PaperProps) {
  const t = useT("essays")
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-sm bg-card px-6 py-8 text-card-foreground shadow-md ring-1 ring-border md:px-14 md:py-12">
      <h1 className="text-3xl font-semibold tracking-tight break-words">{title || t("untitled")}</h1>
      {prompt.trim() ? <p className="text-sm text-muted-foreground">{prompt}</p> : null}
      <Label htmlFor="essay-body" className="sr-only">
        {t("body")}
      </Label>
      <Textarea
        id="essay-body"
        ref={textareaRef}
        className="min-h-[28rem] resize-none border-0 bg-transparent px-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
        value={body ?? ""}
        readOnly={readOnly}
        aria-describedby="essay-count essay-save"
        onChange={(event) => onBody(event.target.value)}
      />
    </article>
  )
}
