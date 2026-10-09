"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { CourseChatPanes } from "../course/chat-modes"
import type { AskRequest } from "../types"
import { NotebookChat } from "./panes"

type ChatPaneProps = {
  notebook: NotebookDetail
  pendingAsk: AskRequest | null
  onAskHandled: () => void
  /** A viewer covers the chat. The chat stays mounted (hidden) so a running answer and the draft survive. */
  covered?: boolean
  id?: string
}

/** The Chat region. */
export function ChatPane({ notebook, pendingAsk, onAskHandled, covered = false, id }: ChatPaneProps) {
  const t = useT("notebooks")
  return (
    <section
      id={id}
      aria-label={t("tabs.chat")}
      hidden={covered}
      className="flex min-h-0 min-w-0 flex-1 flex-col print:hidden"
    >
      {notebook.course_id != null && notebook.can_write ? (
        <CourseChatPanes
          notebook={notebook}
          courseId={notebook.course_id}
          pendingAsk={pendingAsk}
          sourcesChat={<NotebookChat notebook={notebook} pendingAsk={pendingAsk} onAskHandled={onAskHandled} />}
        />
      ) : (
        <NotebookChat notebook={notebook} pendingAsk={pendingAsk} onAskHandled={onAskHandled} />
      )}
    </section>
  )
}
