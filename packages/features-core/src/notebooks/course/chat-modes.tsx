"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ToggleGroup, ToggleGroupItem, cn } from "@ihsp/ui"
import { useEffect, useState, type ReactNode } from "react"
import type { AskRequest } from "../types"
import { AuthorChat } from "./author-chat"

export type CourseChatMode = "sources" | "author"

type CourseChatPanesProps = {
  notebook: NotebookDetail
  courseId: string
  pendingAsk: AskRequest | null
  /** The grounded chat of the notebook (kept mounted while the other mode is shown). */
  sourcesChat: ReactNode
}

/**
 * The chat pane of a course workspace: "Sources" is the grounded notebook chat, "Author" the tool-calling assistant of
 * the course. A question another pane asks (from a source, a passage) always lands in the sources chat.
 */
export function CourseChatPanes({ notebook, courseId, pendingAsk, sourcesChat }: CourseChatPanesProps) {
  const t = useT("notebooks")
  const [mode, setMode] = useState<CourseChatMode>("sources")
  useEffect(() => {
    if (pendingAsk) setMode("sources")
  }, [pendingAsk])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 justify-center border-b px-3 py-1.5">
        <ToggleGroup
          value={[mode]}
          variant="outline"
          spacing={1}
          aria-label={t("course.chatMode.label")}
          onValueChange={(next) => {
            const value = next[0]
            if (value === "sources" || value === "author") setMode(value)
          }}
        >
          <ToggleGroupItem
            value="sources"
            className="aria-pressed:bg-primary/10 aria-pressed:border-primary min-h-11 px-4 md:min-h-8"
          >
            {t("course.chatMode.sources")}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="author"
            className="aria-pressed:bg-primary/10 aria-pressed:border-primary min-h-11 px-4 md:min-h-8"
          >
            {t("course.chatMode.author")}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className={cn("min-h-0 flex-1 flex-col", mode === "sources" ? "flex" : "hidden")}>{sourcesChat}</div>
      {mode === "author" ? <AuthorChat courseId={courseId} notebookId={notebook.id} /> : null}
    </div>
  )
}
