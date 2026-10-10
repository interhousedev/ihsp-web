"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Skeleton, cn } from "@ihsp/ui"
import { IconBook2, IconChevronDown, IconChevronRight, IconPlus } from "@ihsp/ui"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { groupNotebooks, NOTEBOOK_FOLDERS, type NotebookFolder } from "../notebooks/lib/notebook-folders"
import { useAllNotebooks, useCreateNotebook } from "../notebooks/api"
import { notebookUrl } from "./use-add-to-notebook"

const SHOWN_PER_FOLDER = 5
const COLLAPSED_KEY = "ihsp.assistant.notebook-folders.collapsed"

function loadCollapsed(): Partial<Record<NotebookFolder, boolean>> {
  try {
    const raw = window.localStorage.getItem(COLLAPSED_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return typeof parsed === "object" && parsed !== null ? (parsed as Partial<Record<NotebookFolder, boolean>>) : {}
  } catch {
    return {}
  }
}

const ROW_CLASS =
  "hover:bg-muted focus-visible:ring-ring/50 flex min-h-11 w-full items-center gap-2 rounded-full px-3 text-sm outline-none focus-visible:ring-3 md:min-h-9"

/** Section **Notebooks**: New notebook, three collapsible folders (five notebooks each, with a show-all link) and All notebooks. */
export function SidebarNotebooks({ onNavigate }: { onNavigate: () => void }) {
  const t = useT("assistant.sidebar")
  const tCommon = useT("common")
  const router = useRouter()
  const pathname = usePathname()
  const openId = useSearchParams().get("id")
  const errorMessage = useErrorMessage()
  const notebooks = useAllNotebooks()
  const create = useCreateNotebook()

  const onNotebookPage = pathname.startsWith("/notebooks/view")
  const groups = groupNotebooks(notebooks.items)
  const [collapsed, setCollapsed] = useState<Partial<Record<NotebookFolder, boolean>>>({})
  useEffect(() => setCollapsed(loadCollapsed()), [])

  function toggle(folder: NotebookFolder) {
    setCollapsed((current) => {
      const next = { ...current, [folder]: !current[folder] }
      try {
        window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next))
      } catch {
        // Private mode: the state just is not remembered.
      }
      return next
    })
  }

  function createNotebook() {
    create.mutate(undefined, {
      onSuccess: (notebook) => {
        onNavigate()
        router.push(notebookUrl(notebook.id, "&add=1"))
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <section aria-labelledby="assistant-notebooks-heading" className="flex flex-col gap-1">
      <h3 id="assistant-notebooks-heading" className="text-muted-foreground px-3 py-1 text-xs font-medium">
        {t("notebooks")}
      </h3>
      <button type="button" className={ROW_CLASS} disabled={create.isPending} onClick={createNotebook}>
        <IconPlus className="size-4 shrink-0" aria-hidden />
        {t("newNotebook")}
      </button>
      {notebooks.isPending ? (
        <div role="status" aria-busy="true" aria-label={tCommon("loading")} className="flex flex-col gap-1">
          {[0, 1].map((row) => (
            <Skeleton key={row} className="h-9 w-full rounded-full" />
          ))}
        </div>
      ) : null}
      {notebooks.isError ? (
        <div className="flex flex-col items-start gap-1 px-3">
          <p role="alert" className="text-destructive text-xs">
            {errorMessage(notebooks.error)}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 md:min-h-7"
            onClick={() => void notebooks.refetch()}
          >
            {tCommon("retry")}
          </Button>
        </div>
      ) : null}
      <div className="flex max-h-[45vh] flex-col gap-1 overflow-y-auto">
        {NOTEBOOK_FOLDERS.filter((folder) => groups[folder].length > 0).map((folder) => {
          const all = groups[folder]
          const open = !collapsed[folder]
          const label = t(`folders.${folder}`)
          return (
            <div key={folder} className="flex flex-col gap-0.5" data-folder={folder}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(folder)}
                className={cn(ROW_CLASS, "text-muted-foreground min-h-9 text-xs font-medium md:min-h-7")}
              >
                {open ? (
                  <IconChevronDown className="size-3.5 shrink-0" aria-hidden />
                ) : (
                  <IconChevronRight className="size-3.5 shrink-0" aria-hidden />
                )}
                <span className="min-w-0 flex-1 truncate text-start" title={label}>
                  {label}
                </span>
                <span aria-label={String(all.length)}>{all.length}</span>
              </button>
              {open ? (
                <ul className="flex flex-col gap-0.5">
                  {all.slice(0, SHOWN_PER_FOLDER).map((notebook) => {
                    const active = onNotebookPage && openId === notebook.id
                    return (
                      <li key={notebook.id}>
                        <Link
                          href={notebookUrl(notebook.id)}
                          aria-current={active ? "page" : undefined}
                          title={notebook.title}
                          onClick={onNavigate}
                          className={cn(ROW_CLASS, active && "bg-primary/10 font-medium")}
                        >
                          <span aria-hidden className="w-5 shrink-0 text-center">
                            {notebook.emoji ?? "📓"}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{notebook.title}</span>
                        </Link>
                      </li>
                    )
                  })}
                  {all.length > SHOWN_PER_FOLDER ? (
                    <li>
                      <Link
                        href={`/notebooks/?folder=${folder}`}
                        onClick={onNavigate}
                        className={cn(ROW_CLASS, "text-muted-foreground")}
                      >
                        {t("showAllFolder", { count: all.length })}
                      </Link>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          )
        })}
      </div>
      <Link
        href="/notebooks/"
        aria-current={pathname === "/notebooks" || pathname === "/notebooks/" ? "page" : undefined}
        onClick={onNavigate}
        className={cn(ROW_CLASS, "text-muted-foreground")}
      >
        <IconBook2 className="size-4 shrink-0" aria-hidden />
        {t("allNotebooks")}
      </Link>
    </section>
  )
}
