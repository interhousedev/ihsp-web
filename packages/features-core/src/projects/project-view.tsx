"use client"

import type { ChatItem, FileItem as ApiFile } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconDots,
  IconFolder,
  IconPaperclip,
  IconX,
  Skeleton,
  StateView,
  cn,
} from "@ihsp/ui"
import { getAiChatQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useId, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { FileItem } from "../file-item/file-item"
import { AttachFilesDialog } from "../assistant-chat/attach-files-dialog"
import { useAssistantScope } from "../assistant-chat/assistant-context"
import { limitState } from "../assistant-chat/limit-info"
import { storePendingTurn } from "../assistant-chat/pending-turn"
import { PillComposer, type PillSendOptions } from "../assistant-chat/pill-composer"
import { useCreateChat, useUsage } from "../assistant-chat/use-assistant-queries"
import { writeWebSwitch } from "../assistant-chat/use-web-switch"
import { FileUploadButton } from "../file-upload-button/file-upload-button"
import { DeleteProjectDialog, RenameProjectDialog } from "./project-dialogs"
import { projectChatHref, projectsHref } from "./project-name"
import {
  useAttachProjectFiles,
  useDeleteProject,
  useDetachProjectFile,
  useProject,
  useProjectChats,
  useProjectFiles,
  useRenameProject,
} from "./use-projects"

type ProjectViewProps = {
  projectId: string
  basePath: string
  navButtons: ReactNode
  trailing?: ReactNode
}

type Tab = "chats" | "sources"
const TABS: Tab[] = ["chats", "sources"]

/**
 * `<basePath>/project/?id=`: the project title with its options, a composer that starts a chat in the project, and two
 * pill tabs: **Chats** (the project's chats) and **Sources** (the files the assistant reads in this project).
 */
export function ProjectView({ projectId, basePath, navButtons, trailing }: ProjectViewProps) {
  const t = useT("assistant.projects")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const project = useProject(projectId)
  const { assistant } = useAssistantScope()
  const usage = useUsage(assistant)
  const createChat = useCreateChat(assistant, undefined, projectId)
  const rename = useRenameProject(projectId)
  const remove = useDeleteProject()
  const [tab, setTab] = useState<Tab>("chats")
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const tabsId = useId()

  if (project.isPending) {
    return (
      <div role="status" aria-busy="true" className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-8 w-60 rounded-lg" />
        <Skeleton className="h-14 w-full rounded-full" />
      </div>
    )
  }
  if (project.isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-1 px-2 md:px-4">{navButtons}</div>
        <StateView state="error" error={project.error} onRetry={() => void project.refetch()} />
      </div>
    )
  }

  const current = project.data
  const limit = limitState(usage.data)

  async function handleSend(text: string, files: ApiFile[], options?: PillSendOptions): Promise<boolean> {
    const web = options?.webSearch === true
    try {
      const chat = await createChat.mutateAsync({})
      storePendingTurn(chat.id, { text, file_ids: files.map((file) => file.id), ...(web ? { web } : {}) })
      if (web) writeWebSwitch(chat.id, true)
      router.push(projectChatHref(basePath, chat.id))
      return true
    } catch (failure) {
      toast.error(errorMessage(failure))
      return false
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-1 px-2 md:px-4">
        {navButtons}
        <span className="ms-auto flex items-center gap-1">{trailing}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-10 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div className="flex items-center gap-3">
            <IconFolder className="text-primary size-7 shrink-0" aria-hidden />
            <h1 className="min-w-0 flex-1 truncate text-2xl font-medium tracking-tight">{current.name}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-11 shrink-0 rounded-full md:size-9"
                    aria-label={t("options")}
                  />
                }
              >
                <IconDots aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setRenaming(true)}>{t("rename")}</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <PillComposer
            sending={createChat.isPending}
            limit={limit}
            onSend={handleSend}
            placeholder={t("newChatIn", { name: current.name })}
          />

          <div role="tablist" aria-label={t("tabsLabel")} className="flex gap-1">
            {TABS.map((item) => (
              <button
                key={item}
                id={`${tabsId}-${item}`}
                type="button"
                role="tab"
                aria-selected={tab === item}
                aria-controls={`${tabsId}-panel`}
                onClick={() => setTab(item)}
                className={cn(
                  "focus-visible:ring-ring/50 min-h-11 rounded-full px-4 text-sm outline-none focus-visible:ring-3 md:min-h-9",
                  tab === item ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                {t(item === "chats" ? "tabChats" : "tabSources")}
              </button>
            ))}
          </div>

          <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`}>
            {tab === "chats" ? (
              <ProjectChats projectId={projectId} basePath={basePath} />
            ) : (
              <ProjectSources projectId={projectId} />
            )}
          </div>
        </div>
      </div>

      <RenameProjectDialog
        project={current}
        open={renaming}
        onOpenChange={(open) => {
          setRenaming(open)
          if (!open) rename.reset()
        }}
        pending={rename.isPending}
        error={rename.error}
        onRename={(name) =>
          rename.mutate(name, {
            onSuccess: () => setRenaming(false),
          })
        }
      />
      <DeleteProjectDialog
        project={current}
        open={deleting}
        onOpenChange={setDeleting}
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(projectId, {
            onSuccess: () => {
              setDeleting(false)
              router.push(projectsHref(basePath))
            },
            onError: (error) => toast.error(errorMessage(error)),
          })
        }
      />
    </div>
  )
}

const CHATS_STEP = 20

/** The last question asked in a chat, the second line of its row (the list endpoint does not carry it). */
function useChatSnippet(chatId: string): string | null {
  const detail = useQuery({ ...getAiChatQuery(chatId), staleTime: 60_000, retry: false })
  const question = detail.data?.messages.findLast((message) => message.role === "user")
  return question?.text.trim() || null
}

function ProjectChatRow({ chat, basePath }: { chat: ChatItem; basePath: string }) {
  const format = useFormatters()
  const snippet = useChatSnippet(chat.id)
  return (
    <li className="border-border/60 border-b last:border-b-0">
      <Link
        href={projectChatHref(basePath, chat.id)}
        className="hover:bg-muted/60 focus-visible:ring-ring/50 flex min-h-14 items-center gap-4 rounded-lg px-3 py-2.5 outline-none focus-visible:ring-3"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{chat.title}</span>
          {snippet ? <span className="text-muted-foreground truncate text-sm">{snippet}</span> : null}
        </span>
        <time dateTime={chat.last_message_at} className="text-muted-foreground shrink-0 text-sm">
          {format.date(chat.last_message_at, { day: "numeric", month: "short" })}
        </time>
      </Link>
    </li>
  )
}

function ProjectChats({ projectId, basePath }: { projectId: string; basePath: string }) {
  const t = useT("assistant.projects")
  const tSidebar = useT("assistant.sidebar")
  const chats = useProjectChats(projectId)
  const [visible, setVisible] = useState(CHATS_STEP)

  if (chats.isPending) return <Skeleton className="h-14 w-full rounded-lg" />
  if (chats.isError) return <StateView state="error" error={chats.error} onRetry={() => void chats.refetch()} />
  const items: ChatItem[] = chats.data?.items ?? []
  if (items.length === 0) return <p className="text-muted-foreground px-3 py-4 text-sm">{t("chatsEmpty")}</p>

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col">
        {items.slice(0, visible).map((chat) => (
          <ProjectChatRow key={chat.id} chat={chat} basePath={basePath} />
        ))}
      </ul>
      {items.length > visible ? (
        <Button
          type="button"
          variant="ghost"
          shape="pill"
          className="text-muted-foreground min-h-11 self-center md:min-h-9"
          onClick={() => setVisible((count) => count + CHATS_STEP)}
        >
          {tSidebar("showMore")}
        </Button>
      ) : null}
    </div>
  )
}

function ProjectSources({ projectId }: { projectId: string }) {
  const t = useT("assistant.projects")
  const errorMessage = useErrorMessage()
  const files = useProjectFiles(projectId)
  const attach = useAttachProjectFiles(projectId)
  const detach = useDetachProjectFile(projectId)
  const [picking, setPicking] = useState(false)

  const items = files.data ?? []

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-2">
        <FileUploadButton
          purpose="ai_upload"
          multiple
          label={t("uploadSource")}
          onUploaded={(file) => attach.mutate([file.id], { onError: (error) => toast.error(errorMessage(error)) })}
        />
        <Button type="button" variant="ghost" shape="pill" className="min-h-11" onClick={() => setPicking(true)}>
          <IconPaperclip className="size-4" aria-hidden />
          {t("addSource")}
        </Button>
      </div>
      {files.isPending ? <Skeleton className="h-12 w-full rounded-lg" /> : null}
      {files.isError ? <StateView state="error" error={files.error} onRetry={() => void files.refetch()} /> : null}
      {files.isSuccess && items.length === 0 ? (
        <p className="text-muted-foreground px-3 py-4 text-sm">{t("sourcesEmpty")}</p>
      ) : null}
      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((file) => (
            <FileItem
              as="li"
              key={file.file_id}
              name={file.name}
              actions={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 md:size-9"
                  aria-label={t("removeSource", { name: file.name })}
                  onClick={() => detach.mutate(file.file_id, { onError: (error) => toast.error(errorMessage(error)) })}
                >
                  <IconX aria-hidden />
                </Button>
              }
            />
          ))}
        </ul>
      ) : null}
      <AttachFilesDialog
        open={picking}
        onOpenChange={setPicking}
        attachedIds={new Set(items.map((file) => file.file_id))}
        onPick={(picked) => {
          setPicking(false)
          attach.mutate(
            picked.map((file) => file.id),
            { onError: (error) => toast.error(errorMessage(error)) },
          )
        }}
      />
    </div>
  )
}
