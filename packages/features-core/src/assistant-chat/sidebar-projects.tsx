"use client"

import type { ProjectResponse } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  buttonVariants,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronDown,
  IconChevronRight,
  IconDots,
  IconEdit,
  IconFolder,
  IconPlus,
} from "@ihsp/ui"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { CreateProjectDialog, DeleteProjectDialog, RenameProjectDialog } from "../projects/project-dialogs"
import { projectChatHref, projectHref } from "../projects/project-name"
import {
  useCreateProject,
  useDeleteProject,
  useProjectChats,
  useProjects,
  useRenameProject,
} from "../projects/use-projects"
import {
  SIDEBAR_ROW,
  SIDEBAR_ROW_ACTIVE,
  SIDEBAR_SUB_ROW,
  SidebarIcon,
  SidebarSection,
  useSidebarFlags,
} from "./sidebar-rows"
import { isUntitledChat } from "./untitled-chat"

const STORAGE_KEY = "ihsp.assistant.project-sections"
const SECTION = "section"
const CHATS_STEP = 5

const HOVER_ACTION =
  "pointer-coarse:opacity-100 size-11 rounded-lg opacity-0 group-hover/project:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100 md:size-7"

/** Section **Projects**: New project, then the projects, each expanding to its latest chats. */
export function SidebarProjects({
  basePath,
  activeChatId,
  onNavigate,
}: {
  basePath: string
  activeChatId: string | null
  onNavigate: () => void
}) {
  const t = useT("assistant.projects")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const projects = useProjects()
  const create = useCreateProject()
  const { flags, set } = useSidebarFlags(STORAGE_KEY)
  const [creating, setCreating] = useState(false)
  const sectionOpen = flags[SECTION] !== false

  return (
    <SidebarSection title={t("sidebarTitle")} open={sectionOpen} onToggle={() => set(SECTION, !sectionOpen)}>
      <button type="button" className={SIDEBAR_ROW} onClick={() => setCreating(true)}>
        <SidebarIcon>
          <IconPlus className="size-4" aria-hidden />
        </SidebarIcon>
        {t("new")}
      </button>
      {(projects.data ?? []).map((project) => (
        <SidebarProjectRow
          key={project.id}
          project={project}
          basePath={basePath}
          open={flags[project.id] === true}
          activeChatId={activeChatId}
          onNavigate={onNavigate}
          onOpenChange={(open) => set(project.id, open)}
        />
      ))}
      <CreateProjectDialog
        open={creating}
        onOpenChange={(open) => {
          setCreating(open)
          if (!open) create.reset()
        }}
        pending={create.isPending}
        error={create.error}
        onCreate={(name) =>
          create.mutate(
            { name },
            {
              onSuccess: (project) => {
                setCreating(false)
                onNavigate()
                router.push(projectHref(basePath, project.id))
              },
              onError: (error) => toast.error(errorMessage(error)),
            },
          )
        }
      />
    </SidebarSection>
  )
}

function SidebarProjectRow({
  project,
  basePath,
  open,
  activeChatId,
  onOpenChange,
  onNavigate,
}: {
  project: ProjectResponse
  basePath: string
  open: boolean
  activeChatId: string | null
  onOpenChange: (open: boolean) => void
  onNavigate: () => void
}) {
  const t = useT("assistant.projects")
  const tSidebar = useT("assistant.sidebar")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const pathname = usePathname().replace(/\/+$/, "")
  const chats = useProjectChats(project.id, open)
  const rename = useRenameProject(project.id)
  const remove = useDeleteProject()
  const [visible, setVisible] = useState(CHATS_STEP)
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const active = pathname === `${basePath}/project` && activeChatId === project.id
  const items = (chats.data?.items ?? []).filter((chat) => chat.id === activeChatId || !isUntitledChat(chat.title))

  return (
    <div className="flex flex-col gap-0.5">
      <div className="group/project relative">
        <Link
          href={projectHref(basePath, project.id)}
          aria-current={active ? "page" : undefined}
          title={project.name}
          onClick={() => {
            onOpenChange(true)
            onNavigate()
          }}
          className={cn(SIDEBAR_ROW, "ps-12 pe-24 md:ps-11 md:pe-17", active && SIDEBAR_ROW_ACTIVE)}
        >
          <span className="min-w-0 flex-1 truncate">{project.name}</span>
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-label={t(open ? "hideChats" : "showChats", { name: project.name })}
          onClick={() => onOpenChange(!open)}
          className="focus-visible:ring-ring/50 absolute start-0 top-0 flex size-11 items-center justify-center rounded-lg outline-none focus-visible:ring-3 md:start-1.5 md:top-1 md:size-7"
        >
          <IconFolder className="size-4 group-hover/project:hidden" aria-hidden />
          {open ? (
            <IconChevronDown className="hidden size-4 group-hover/project:block" aria-hidden />
          ) : (
            <IconChevronRight className="hidden size-4 group-hover/project:block" aria-hidden />
          )}
        </button>
        <span className="absolute end-0 top-0 flex md:end-1 md:top-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={HOVER_ACTION}
                  aria-label={tSidebar("chatMenu", { title: project.name })}
                />
              }
            >
              <IconDots aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setRenaming(true)}>{t("rename")}</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            href={projectHref(basePath, project.id)}
            onClick={onNavigate}
            aria-label={t("newChatIn", { name: project.name })}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), HOVER_ACTION)}
          >
            <IconEdit aria-hidden />
          </Link>
        </span>
      </div>
      {open ? (
        <ul aria-label={project.name} className="flex flex-col gap-0.5">
          {items.slice(0, visible).map((chat) => (
            <li key={chat.id}>
              <Link
                href={projectChatHref(basePath, chat.id)}
                aria-current={chat.id === activeChatId && !active ? "page" : undefined}
                title={chat.title}
                onClick={onNavigate}
                className={cn(SIDEBAR_ROW, SIDEBAR_SUB_ROW, chat.id === activeChatId && !active && SIDEBAR_ROW_ACTIVE)}
              >
                <span className="min-w-0 flex-1 truncate">{chat.title}</span>
              </Link>
            </li>
          ))}
          {chats.isSuccess && items.length === 0 ? (
            <li className={cn("text-muted-foreground py-1 pe-3 text-xs", SIDEBAR_SUB_ROW)}>{t("chatsEmpty")}</li>
          ) : null}
          {items.length > visible ? (
            <li>
              <button
                type="button"
                className={cn(SIDEBAR_ROW, SIDEBAR_SUB_ROW, "text-muted-foreground")}
                onClick={() => setVisible((count) => count + CHATS_STEP)}
              >
                {tSidebar("showMore")}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
      <RenameProjectDialog
        project={project}
        open={renaming}
        onOpenChange={(next) => {
          setRenaming(next)
          if (!next) rename.reset()
        }}
        pending={rename.isPending}
        error={rename.error}
        onRename={(name) => rename.mutate(name, { onSuccess: () => setRenaming(false) })}
      />
      <DeleteProjectDialog
        project={project}
        open={deleting}
        onOpenChange={setDeleting}
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(project.id, {
            onSuccess: () => {
              setDeleting(false)
              if (active) router.push(`${basePath}/`)
            },
            onError: (error) => toast.error(errorMessage(error)),
          })
        }
      />
    </div>
  )
}
