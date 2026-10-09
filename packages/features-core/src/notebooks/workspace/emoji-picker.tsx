"use client"

import { useT } from "@ihsp/i18n"
import { cn, Popover, PopoverContent, PopoverTrigger } from "@ihsp/ui"
import { useState } from "react"
import { DEFAULT_NOTEBOOK_EMOJI, NOTEBOOK_EMOJIS } from "./emoji-list"

type EmojiPickerProps = {
  emoji: string | null
  onPick: (emoji: string) => void
}

/** The emoji of the notebook as a button that opens a grid of about forty emojis. */
export function EmojiPicker({ emoji, onPick }: EmojiPickerProps) {
  const t = useT("notebooks.workspace")
  const [open, setOpen] = useState(false)
  const current = emoji ?? DEFAULT_NOTEBOOK_EMOJI

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t("emoji.change")}
        className="hover:bg-muted focus-visible:ring-ring inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-2xl outline-none focus-visible:ring-2 md:size-9"
      >
        <span aria-hidden>{current}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-1rem)] p-2">
        <div role="group" aria-label={t("emoji.pick")} className="grid grid-cols-8 gap-1">
          {NOTEBOOK_EMOJIS.map((candidate) => (
            <button
              key={candidate}
              type="button"
              aria-label={candidate}
              aria-pressed={candidate === emoji}
              className={cn(
                "hover:bg-muted focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-md text-xl outline-none focus-visible:ring-2",
                candidate === emoji && "bg-primary/10 ring-primary ring-1",
              )}
              onClick={() => {
                setOpen(false)
                if (candidate !== emoji) onPick(candidate)
              }}
            >
              {candidate}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
