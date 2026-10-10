"use client"

import type { SourceKind } from "@ihsp/api"
import {
  IconBook2,
  IconBooks,
  IconCards,
  IconClipboardText,
  IconFile,
  IconFileText,
  IconFileTypeDoc,
  IconFileTypePdf,
  IconMessageChatbot,
  IconNote,
  IconSchool,
  IconWorld,
  type Icon,
} from "@ihsp/ui"

type IconInput = { kind: SourceKind; title?: string }

/** The icon of a source row: PDF red, DOCX blue, then one icon per kind (docs/reference/notebooklm.md § 5.4.2). */
export function sourceIcon({ kind, title = "" }: IconInput): { Icon: Icon; className: string } {
  if (kind === "file") {
    const name = title.toLowerCase()
    if (name.endsWith(".pdf")) return { Icon: IconFileTypePdf, className: "text-red-600 dark:text-red-400" }
    if (name.endsWith(".docx") || name.endsWith(".doc"))
      return { Icon: IconFileTypeDoc, className: "text-blue-600 dark:text-blue-400" }
    if (name.endsWith(".txt") || name.endsWith(".md")) return { Icon: IconFileText, className: "text-muted-foreground" }
    return { Icon: IconFile, className: "text-muted-foreground" }
  }
  const byKind: Record<Exclude<SourceKind, "file">, { Icon: Icon; className: string }> = {
    chat: { Icon: IconMessageChatbot, className: "text-violet-600 dark:text-violet-400" },
    lesson_resource: { Icon: IconSchool, className: "text-emerald-600 dark:text-emerald-400" },
    flashcard_set: { Icon: IconCards, className: "text-amber-600 dark:text-amber-400" },
    lms_step: { Icon: IconBooks, className: "text-sky-600 dark:text-sky-400" },
    text: { Icon: IconClipboardText, className: "text-muted-foreground" },
    note: { Icon: IconNote, className: "text-yellow-600 dark:text-yellow-400" },
    url: { Icon: IconWorld, className: "text-sky-600 dark:text-sky-400" },
    web_result: { Icon: IconWorld, className: "text-sky-600 dark:text-sky-400" },
    library_item: { Icon: IconBook2, className: "text-rose-600 dark:text-rose-400" },
    library_notes: { Icon: IconNote, className: "text-rose-600 dark:text-rose-400" },
  }
  // A kind this build does not know yet must not crash the page.
  return byKind[kind] ?? { Icon: IconFile, className: "text-muted-foreground" }
}

/** The kind icon as an element (decorative; the row carries the text). */
export function SourceKindIcon({ kind, title, className }: IconInput & { className?: string }) {
  const { Icon, className: tone } = sourceIcon({ kind, title })
  return <Icon aria-hidden className={`${tone} ${className ?? "size-5"} shrink-0`} />
}
