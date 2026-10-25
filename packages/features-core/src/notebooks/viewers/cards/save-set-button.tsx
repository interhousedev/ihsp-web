"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, cn } from "@ihsp/ui"
import { IconCards, IconExternalLink } from "@ihsp/ui"
import Link from "next/link"
import { toast } from "sonner"
import { useSaveFlashcardSet } from "../../api/use-artifacts"
import { useNotebookErrorMessage } from "../../lib/use-notebook-error"
import { ToolbarButton } from "../toolbar-button"

type SaveSetButtonProps = {
  notebookId: string
  artifactId: string
  /** `artifact.flashcard_set_id`: when set the button already reads "Open set". */
  setId: string | null
}

/**
 * The IHSP bridge: "Save as flash card set" creates a normal spaced-repetition set from the deck (once; the server is
 * idempotent) and the button then becomes a link to that set.
 */
export function SaveSetButton({ notebookId, artifactId, setId }: SaveSetButtonProps) {
  const t = useT("notebooks")
  const errorMessage = useNotebookErrorMessage()
  const save = useSaveFlashcardSet(notebookId)
  const savedId = setId ?? save.data?.set_id ?? null

  if (savedId !== null) {
    return (
      <Link
        href={`/flashcards/set/?id=${savedId}`}
        className={cn(buttonVariants({ variant: "default" }), "min-h-11 gap-1.5 md:min-h-9")}
      >
        <IconExternalLink aria-hidden className="size-4" />
        {t("cards.openSet")}
      </Link>
    )
  }

  return (
    <>
      <ToolbarButton
        icon={IconCards}
        label={t("cards.saveSet")}
        disabled={save.isPending}
        onClick={() => save.mutate(artifactId, { onSuccess: () => toast.success(t("viewers.cards.setSaved")) })}
      />
      {save.error ? (
        <p role="alert" className="text-destructive basis-full text-center text-sm">
          {errorMessage(save.error)}
        </p>
      ) : null}
    </>
  )
}
