"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Skeleton, cn } from "@ihsp/ui"
import { IconBook2, IconPlus } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useCreateNotebook, useNotebooks } from "../notebooks/api"
import { notebookUrl } from "./use-add-to-notebook"

const SHOWN_NOTEBOOKS = 5

const ROW_CLASS =
  "hover:bg-muted focus-visible:ring-ring/50 flex min-h-11 w-full items-center gap-2 rounded-full px-3 text-sm outline-none focus-visible:ring-3 md:min-h-9"

/** Section **Notebooks**: New notebook, the five most recent notebooks (pinned first) and All notebooks. */
export function SidebarNotebooks({ onNavigate }: { onNavigate: () => void }) {
  const t = useT("assistant.sidebar")
  const tCommon = useT("common")
  const router = useRouter()
  const pathname = usePathname()
  const openId = useSearchParams().get("id")
  const errorMessage = useErrorMessage()
  const notebooks = useNotebooks()
  const create = useCreateNotebook()

  const onNotebookPage = pathname.startsWith("/notebooks/view")
  const items = (notebooks.data?.items ?? []).slice(0, SHOWN_NOTEBOOKS)

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
      {items.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {items.map((notebook) => {
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
        </ul>
      ) : null}
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
