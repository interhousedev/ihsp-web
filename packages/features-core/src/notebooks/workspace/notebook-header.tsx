"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import { useUpdateNotebook } from "../api"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { EmojiPicker } from "./emoji-picker"
import { NotebookMenu } from "./notebook-menu"
import { UsageDialog } from "./panes"
import { TitleEditor } from "./title-editor"
import { UsageRing } from "./usage-ring"

type NotebookHeaderProps = {
  notebook: NotebookDetail
  /** Extra buttons before the usage ring (the Sources and Studio sheet buttons on a tablet). */
  extras?: ReactNode
}

/** The 56 px bar of a notebook: back, emoji, title (both editable), usage ring and the ⋮ menu. */
export function NotebookHeader({ notebook, extras }: NotebookHeaderProps) {
  const t = useT("notebooks")
  const errorMessage = useNotebookErrorMessage()
  const update = useUpdateNotebook(notebook.id)
  const [usageOpen, setUsageOpen] = useState(false)
  const course = notebook.course_id != null
  const backHref = course ? `/edit/?id=${encodeURIComponent(notebook.course_id ?? "")}` : "/notebooks/"
  const backLabel = course ? t("course.backToEditor") : t("workspace.back")

  return (
    <header className="bg-background flex h-14 shrink-0 items-center gap-1 border-b px-2 print:hidden md:px-3">
      <Link
        href={backHref}
        aria-label={backLabel}
        title={backLabel}
        className="hover:bg-muted focus-visible:ring-ring inline-flex size-11 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-2 md:size-9"
      >
        <IconArrowLeft aria-hidden />
      </Link>
      {course ? (
        <span aria-hidden className="inline-flex size-11 shrink-0 items-center justify-center text-xl md:size-9">
          {notebook.emoji ?? "🎓"}
        </span>
      ) : (
        <EmojiPicker emoji={notebook.emoji} onPick={(emoji) => update.mutate({ emoji })} />
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {course ? (
          <h1 className="truncate px-2 text-base font-semibold">{notebook.title || t("untitled")}</h1>
        ) : (
          <TitleEditor
            title={notebook.title || t("untitled")}
            onSave={(title) => {
              update.reset()
              update.mutate({ title })
            }}
          />
        )}
        {update.isError ? (
          <p role="alert" className="text-destructive truncate px-2 text-xs">
            {errorMessage(update.error)}
          </p>
        ) : null}
      </div>
      {extras}
      <UsageRing onOpen={() => setUsageOpen(true)} />
      <NotebookMenu notebook={notebook} />
      <UsageDialog open={usageOpen} onOpenChange={setUsageOpen} />
    </header>
  )
}
