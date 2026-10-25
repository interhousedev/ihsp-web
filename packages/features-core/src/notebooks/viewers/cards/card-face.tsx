"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { PASSAGE_STYLE } from "../passage-style"
import { StudioMarkdown } from "../../../openui/studio-markdown"

type CardFaceProps = {
  side: "front" | "back"
  text: string
  topic?: string | null
  /** The face that is turned away: hidden from assistive technology, but still in the tree. */
  hidden: boolean
}

/** One side of a flash card (the back is pre-rotated so the 3D flip shows it). */
export function CardFace({ side, text, topic, hidden }: CardFaceProps) {
  const t = useT("notebooks")
  return (
    <span
      aria-hidden={hidden ? true : undefined}
      className={cn(
        "bg-card text-card-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto rounded-2xl border p-6 text-center shadow-sm [backface-visibility:hidden]",
        side === "back" && "bg-primary/5 [transform:rotateY(180deg)]",
      )}
    >
      <span className="sr-only">{side === "front" ? t("viewers.cards.front") : t("viewers.cards.back")}</span>
      {topic && side === "front" ? (
        <span className="text-muted-foreground absolute start-4 top-3 max-w-[70%] truncate text-xs">{topic}</span>
      ) : null}
      <StudioMarkdown className={cn("text-lg md:text-xl", PASSAGE_STYLE)}>{text}</StudioMarkdown>
    </span>
  )
}
