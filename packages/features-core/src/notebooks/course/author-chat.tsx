"use client"

import { keys } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, NativeSelect, NativeSelectOption, StateView } from "@ihsp/ui"
import { IconMessagePlus } from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useRef, useState } from "react"
import { AssistantProvider } from "../../assistant-chat/assistant-context"
import { AssistantChatPane } from "../../assistant-chat/assistant-chat-pane"
import { UsageButton } from "../../assistant-chat/sidebar-usage"
import { useChats, useCreateChat, useUsage } from "../../assistant-chat/use-assistant-queries"
import { invalidateCourseDraft } from "../api/use-course-workspace"

const ASSISTANT = "lms_author"
const STARTERS = ["plan", "lesson", "test", "review"] as const

/** After a write tool ran, what the author sees elsewhere (outline, steps, sources, Studio outputs) is stale. */
function useRefreshAfterWrite(courseId: string, notebookId: string) {
  const queryClient = useQueryClient()
  return () => {
    void invalidateCourseDraft(queryClient, courseId)
    void queryClient.invalidateQueries({ queryKey: keys.notebooks.artifacts(notebookId) })
    void queryClient.invalidateQueries({ queryKey: keys.notebooks.sources(notebookId) })
    void queryClient.invalidateQueries({ queryKey: keys.notebooks.courseSteps(notebookId) })
  }
}

function AuthorChatPane({ chatId, courseId, notebookId }: { chatId: string; courseId: string; notebookId: string }) {
  const t = useT("notebooks")
  const refreshAfterWrite = useRefreshAfterWrite(courseId, notebookId)
  const [prefill, setPrefill] = useState<{ key: number; text: string } | null>(null)

  return (
    <AssistantChatPane
      chatId={chatId}
      basePath=""
      navButtons={null}
      bare
      placeholder={t("course.author.placeholder")}
      prefill={prefill}
      onToolApproved={refreshAfterWrite}
      empty={
        <ul aria-label={t("course.author.starters")} className="mx-auto flex max-w-3xl flex-wrap gap-2 px-4 pb-6">
          {STARTERS.map((starter, index) => (
            <li key={starter}>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-full px-4 md:min-h-9"
                onClick={() =>
                  setPrefill({ key: (prefill?.key ?? 0) + 1 + index, text: t(`course.author.starter.${starter}`) })
                }
              >
                {t(`course.author.starterLabel.${starter}`)}
              </Button>
            </li>
          ))}
        </ul>
      }
    />
  )
}

/**
 * The author assistant of a course workspace: the newest chat of this course (a picker switches, "New chat" starts
 * another), the conversation with the approval cards of its write tools, and the composer. Anything an approved
 * tool wrote refreshes the editor's draft queries.
 */
export function AuthorChat({ courseId, notebookId }: { courseId: string; notebookId: string }) {
  const t = useT("notebooks")
  const errorMessage = useErrorMessage()
  const selectId = useId()
  const chats = useChats(ASSISTANT, courseId)
  const usage = useUsage(ASSISTANT, courseId)
  const create = useCreateChat(ASSISTANT, courseId)
  const items = chats.data?.items ?? []
  const [chosen, setChosen] = useState<string | null>(null)
  const chatId = chosen && items.some((item) => item.id === chosen) ? chosen : (items[0]?.id ?? null)

  // A workspace without a chat yet gets one when the author opens this mode.
  const started = useRef(false)
  const { mutate: createChat } = create
  useEffect(() => {
    if (!chats.isSuccess || items.length > 0 || started.current) return
    started.current = true
    createChat(undefined, { onSuccess: (chat) => setChosen(chat.id) })
  }, [chats.isSuccess, items.length, createChat])

  if (chats.isPending) return <StateView state="loading" rows={3} className="m-4" />
  if (chats.isError)
    return <StateView state="error" error={chats.error} onRetry={() => void chats.refetch()} className="m-4" />

  return (
    <AssistantProvider assistant={ASSISTANT} courseId={courseId}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5 md:px-6">
          <label htmlFor={selectId} className="sr-only">
            {t("course.author.chatPicker")}
          </label>
          <NativeSelect
            id={selectId}
            className="min-h-11 min-w-0 flex-1 md:min-h-8"
            value={chatId ?? ""}
            disabled={items.length === 0}
            onChange={(event) => setChosen(event.target.value)}
          >
            {items.map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 shrink-0 gap-1.5 md:min-h-8"
            disabled={create.isPending}
            onClick={() => create.mutate(undefined, { onSuccess: (chat) => setChosen(chat.id) })}
          >
            <IconMessagePlus aria-hidden className="size-4" />
            {t("course.author.newChat")}
          </Button>
          <UsageButton usage={usage.data} />
        </div>
        {create.isError ? (
          <p role="alert" className="text-destructive px-3 py-2 text-sm">
            {errorMessage(create.error)}
          </p>
        ) : null}
        {chatId ? (
          <AuthorChatPane key={chatId} chatId={chatId} courseId={courseId} notebookId={notebookId} />
        ) : (
          <StateView state="loading" rows={3} className="m-4" />
        )}
      </div>
    </AssistantProvider>
  )
}
