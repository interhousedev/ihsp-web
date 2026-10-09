"use client"

import { useCreateNotebook, useNotebookErrorMessage } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { IconPlus } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { notebookHref } from "../utils/hrefs"

type NewNotebookButtonProps = {
  /** `tile`: the dashed first card of the grid. */
  variant?: "button" | "tile"
}

/** Creates an untitled notebook and opens it with the Add sources dialog (`&add=1`). */
export function NewNotebookButton({ variant = "button" }: NewNotebookButtonProps) {
  const t = useT("notebooks")
  const router = useRouter()
  const create = useCreateNotebook()
  const errorMessage = useNotebookErrorMessage()

  function createNotebook() {
    create.mutate(undefined, { onSuccess: (notebook) => router.push(notebookHref(notebook.id, { add: true })) })
  }

  const error = create.isError ? (
    <p role="alert" className="text-destructive text-sm">
      {errorMessage(create.error)}
    </p>
  ) : null

  if (variant === "tile") {
    return (
      <div className="flex h-full flex-col gap-1">
        <button
          type="button"
          disabled={create.isPending}
          className={cn(
            "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground focus-visible:ring-ring flex min-h-32 flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-sm font-medium outline-none focus-visible:ring-2 disabled:opacity-50",
          )}
          onClick={createNotebook}
        >
          <IconPlus aria-hidden className="size-8" />
          {t("list.new")}
        </button>
        {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" className="min-h-11" disabled={create.isPending} onClick={createNotebook}>
        <IconPlus aria-hidden />
        {t("list.new")}
      </Button>
      {error}
    </div>
  )
}
