"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { IconChevronDown, IconChevronUp } from "@ihsp/ui"
import { useState } from "react"

const LONG_CHARS = 400
const LONG_LINES = 6

/** A question as a right-aligned muted bubble; a long one is clipped at 4 lines with a chevron (as in § 5.2). */
export function UserMessageBubble({ text }: { text: string }) {
  const t = useT("assistant.message")
  const [expanded, setExpanded] = useState(false)
  const long = text.length > LONG_CHARS || text.split("\n").length > LONG_LINES

  return (
    <div className="flex max-w-[min(100%,36rem)] flex-col items-end gap-0.5">
      <p
        className={cn(
          "bg-muted rounded-2xl rounded-br-sm px-4 py-2 text-sm break-words whitespace-pre-wrap",
          long && !expanded && "line-clamp-4",
        )}
      >
        {text}
      </p>
      {long ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 md:size-8"
          aria-expanded={expanded}
          aria-label={expanded ? t("showLess") : t("showMore")}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? <IconChevronUp aria-hidden /> : <IconChevronDown aria-hidden />}
        </Button>
      ) : null}
    </div>
  )
}
