"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, IconFolder, IconPlus, Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { projectHref } from "./project-name"
import { CreateProjectDialog } from "./project-dialogs"
import { useCreateProject, useProjects } from "./use-projects"

type ProjectsListProps = {
  basePath: string
  /** Sidebar buttons of the workspace for the top bar. */
  navButtons: ReactNode
  /** Compact usage meter (phones, hidden sidebar). */
  trailing?: ReactNode
}

/** `<basePath>/projects/`: every project of the student, and **New project**. A project opens its own page. */
export function ProjectsList({ basePath, navButtons, trailing }: ProjectsListProps) {
  const t = useT("assistant.projects")
  const errorMessage = useErrorMessage()
  const format = useFormatters()
  const projects = useProjects()
  const create = useCreateProject()
  const [creating, setCreating] = useState(false)

  function openCreate(open: boolean) {
    setCreating(open)
    if (!open) create.reset()
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-1 px-2 md:px-4">
        {navButtons}
        <span className="ms-auto flex items-center gap-1">{trailing}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-10 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-2xl font-medium tracking-tight">{t("title")}</h2>
            <Button
              type="button"
              variant="outline"
              shape="pill"
              className="min-h-11 md:min-h-9"
              onClick={() => setCreating(true)}
            >
              <IconPlus className="size-4" aria-hidden />
              {t("new")}
            </Button>
          </div>
          {projects.isPending ? (
            <div role="status" aria-busy="true" className="flex flex-col gap-2">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : null}
          {projects.isError ? (
            <StateView state="error" error={projects.error} onRetry={() => void projects.refetch()} />
          ) : null}
          {projects.isSuccess && projects.data.length === 0 ? <StateView state="empty" emptyText={t("empty")} /> : null}
          {projects.isSuccess && projects.data.length > 0 ? (
            <ul className="divide-y rounded-card border">
              {projects.data.map((project) => (
                <li key={project.id}>
                  <Link
                    href={projectHref(basePath, project.id)}
                    className="hover:bg-muted focus-visible:ring-ring/50 flex min-h-14 items-center gap-3 px-4 outline-none focus-visible:ring-3"
                  >
                    <IconFolder className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{project.name}</span>
                    <time dateTime={project.updated_at} className="text-muted-foreground shrink-0 text-xs">
                      {format.date(project.updated_at, { day: "numeric", month: "short" })}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <CreateProjectDialog
        open={creating}
        onOpenChange={openCreate}
        pending={create.isPending}
        error={create.error}
        onCreate={(name) =>
          create.mutate(
            { name },
            {
              onSuccess: () => setCreating(false),
              onError: (error) => toast.error(errorMessage(error)),
            },
          )
        }
      />
    </div>
  )
}
