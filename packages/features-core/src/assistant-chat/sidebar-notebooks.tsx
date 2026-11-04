"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Skeleton, cn } from "@ihsp/ui"
import { IconBook, IconBook2, IconBooks, IconChevronDown, IconChevronRight, IconPlus, IconSchool } from "@ihsp/ui"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { groupNotebooks, type NotebookFolder } from "../notebooks/lib/notebook-folders"
import { useAllNotebooks, useCreateNotebook } from "../notebooks/api"
import {
  SIDEBAR_ROW,
  SIDEBAR_ROW_ACTIVE,
  SIDEBAR_SUB_ROW,
  SidebarIcon,
  SidebarSection,
  useSidebarFlags,
} from "./sidebar-rows"
import { notebookUrl } from "./use-add-to-notebook"

const SHOWN_PER_FOLDER = 5
const STORAGE_KEY = "ihsp.assistant.notebook-sections"
const SECTION = "section"

const FOLDER_ICON: Record<NotebookFolder, typeof IconBook> = {
  subject: IconBooks,
  course: IconSchool,
  mine: IconBook,
}

/** The student's own and LMS notebooks come first; the subject ones (automatic) after them. */
const FOLDER_ORDER: readonly NotebookFolder[] = ["mine", "course", "subject"]

/** Only the subject folder opens by itself; a folder the student toggled keeps its state. */
const DEFAULT_OPEN: Partial<Record<NotebookFolder, boolean>> = { subject: true }

/**
 * Section **Notebooks**: New notebook, the folders (own and course notebooks first, subject notebooks after; the subject
 * folder is open by default, the others collapse until opened), and All notebooks.
 */
export function SidebarNotebooks({ onNavigate }: { onNavigate: () => void }) {
  const t = useT("assistant.sidebar")
  const tCommon = useT("common")
  const router = useRouter()
  const pathname = usePathname()
  const openId = useSearchParams().get("id")
  const errorMessage = useErrorMessage()
  const notebooks = useAllNotebooks()
  const create = useCreateNotebook()
  const { flags, set } = useSidebarFlags(STORAGE_KEY)

  const onNotebookPage = pathname.startsWith("/notebooks/view")
  const groups = groupNotebooks(notebooks.items)
  const sectionOpen = flags[SECTION] !== false

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
    <SidebarSection title={t("notebooks")} open={sectionOpen} onToggle={() => set(SECTION, !sectionOpen)}>
      <button type="button" className={SIDEBAR_ROW} disabled={create.isPending} onClick={createNotebook}>
        <SidebarIcon>
          <IconPlus className="size-4" aria-hidden />
        </SidebarIcon>
        {t("newNotebook")}
      </button>
      {notebooks.isPending ? (
        <div role="status" aria-busy="true" aria-label={tCommon("loading")} className="flex flex-col gap-0.5">
          {[0, 1].map((row) => (
            <Skeleton key={row} className="h-9 w-full rounded-lg" />
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
      {FOLDER_ORDER.filter((folder) => groups[folder].length > 0).map((folder) => {
        const all = groups[folder]
        const open = flags[folder] ?? DEFAULT_OPEN[folder] === true
        const label = t(`folders.${folder}`)
        const Icon = FOLDER_ICON[folder]
        return (
          <div key={folder} className="group/folder flex flex-col gap-0.5" data-folder={folder}>
            <button type="button" aria-expanded={open} onClick={() => set(folder, !open)} className={SIDEBAR_ROW}>
              <SidebarIcon>
                <Icon className="size-4 group-hover/folder:hidden" aria-hidden />
                {open ? (
                  <IconChevronDown className="hidden size-4 group-hover/folder:block" aria-hidden />
                ) : (
                  <IconChevronRight className="hidden size-4 group-hover/folder:block" aria-hidden />
                )}
              </SidebarIcon>
              <span className="min-w-0 flex-1 truncate" title={label}>
                {label}
              </span>
              <span className="text-muted-foreground text-xs" aria-label={String(all.length)}>
                {all.length}
              </span>
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
                        className={cn(SIDEBAR_ROW, SIDEBAR_SUB_ROW, active && SIDEBAR_ROW_ACTIVE)}
                      >
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
                      className={cn(SIDEBAR_ROW, SIDEBAR_SUB_ROW, "text-muted-foreground")}
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
      <Link
        href="/notebooks/"
        aria-current={pathname === "/notebooks" || pathname === "/notebooks/" ? "page" : undefined}
        onClick={onNavigate}
        className={cn(SIDEBAR_ROW, (pathname === "/notebooks" || pathname === "/notebooks/") && SIDEBAR_ROW_ACTIVE)}
      >
        <SidebarIcon>
          <IconBook2 className="size-4" aria-hidden />
        </SidebarIcon>
        {t("allNotebooks")}
      </Link>
    </SidebarSection>
  )
}
