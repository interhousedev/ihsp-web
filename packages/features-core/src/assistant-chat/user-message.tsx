"use client"

import type { ChatMessageView } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { IconChevronDown, IconChevronUp, IconSchool } from "@ihsp/ui"
import { useId, useState } from "react"
import { FileChip } from "./file-chip"
import { splitGuidedHint } from "./guided-hint"
import { SlashChip } from "./slash-menu"
import { parseSlashText } from "./slash-commands"

const LONG_LINES = 6
const LONG_CHARACTERS = 400

/** A message is "long" past 6 lines or 400 characters; it is then clipped at 4 lines with a chevron. */
export function isLongText(text: string): boolean {
  return text.split("\n").length > LONG_LINES || text.length > LONG_CHARACTERS
}

/** The student's message: a right-aligned muted bubble, clipped when long, with the attached files under it. */
export function UserMessage({ message }: { message: ChatMessageView }) {
  const t = useT("assistant.message")
  const tComposer = useT("assistant.composer")
  const bodyId = useId()
  const [expanded, setExpanded] = useState(false)

  const slash = parseSlashText(message.text)
  const { guided, text: plain } = splitGuidedHint(tComposer("guidedHint"), slash ? "" : message.text)
  const text = slash ? slash.args : plain
  const long = isLongText(text)

  return (
    <article aria-label={t("you")} data-role="user" className="flex min-w-0 flex-col items-end gap-2">
      {text || slash ? (
        <div className="bg-muted text-foreground flex max-w-[min(100%,36rem)] flex-col items-start gap-1 rounded-3xl rounded-br-lg px-4 py-2.5 text-base md:text-sm">
          {guided ? (
            <Badge variant="secondary" className="gap-1">
              <IconSchool className="size-3.5" aria-hidden />
              {tComposer("guided")}
            </Badge>
          ) : null}
          {slash ? <SlashChip name={slash.name} /> : null}
          {text ? (
            <p
              id={bodyId}
              data-clamped={long && !expanded ? "true" : "false"}
              className={`break-words whitespace-pre-wrap ${long && !expanded ? "line-clamp-4" : ""}`}
            >
              {text}
            </p>
          ) : null}
          {long ? (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 -mb-1 inline-flex min-h-11 items-center gap-1 self-end rounded-md px-1 text-xs font-medium outline-none focus-visible:ring-3 md:min-h-8"
              aria-expanded={expanded}
              aria-controls={bodyId}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? t("showLess") : t("showMore")}
              {expanded ? (
                <IconChevronUp className="size-4" aria-hidden />
              ) : (
                <IconChevronDown className="size-4" aria-hidden />
              )}
            </button>
          ) : null}
        </div>
      ) : null}
      {message.file_ids.length > 0 ? (
        <div className="flex max-w-full flex-wrap justify-end gap-1">
          {message.file_ids.map((id) => (
            <FileChip key={id} fileId={id} />
          ))}
        </div>
      ) : null}
    </article>
  )
}
