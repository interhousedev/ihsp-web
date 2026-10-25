"use client"

import { Markdown } from "@ihsp/ui"
import { MessageWithOpenUi } from "./message-with-open-ui"
import { studioLibrary } from "./library"

/** Markdown for Studio text (quiz stimulus and explanation, card faces) that may hold a studio ```openui block. */
export function StudioMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <MessageWithOpenUi
      text={children}
      library={studioLibrary}
      renderMarkdown={(text) => <Markdown className={className}>{text}</Markdown>}
    />
  )
}
