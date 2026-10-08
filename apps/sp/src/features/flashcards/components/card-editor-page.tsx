"use client"

import type { FlashcardSetDetail } from "@ihsp/api"
import { CardEditor, rowsFromSet, type CardEditorValues } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  useCreateFlashcardSet,
  useFlashcardSet,
  useSaveFlashcardCards,
  useUpdateFlashcardSet,
} from "../hooks/use-flashcards"
import { deckHref, studyHref } from "../utils/hrefs"

/** `/flashcards/edit/`: a new deck (Create, Create and practice); `/flashcards/edit/?id=`: change the cards of a deck. */
export function CardEditorPage() {
  const t = useT("flashcards.page")
  const id = useSearchParams().get("id")
  const deck = useFlashcardSet(id)

  if (id === null) return <CreateDeck />
  if (deck.isPending) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="loading" rows={3} />
      </PageContainer>
    )
  }
  if (deck.isError) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="error" error={deck.error} onRetry={() => void deck.refetch()} />
      </PageContainer>
    )
  }
  return <EditDeck deck={deck.data} />
}

function CreateDeck() {
  const t = useT("flashcards.page")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const create = useCreateFlashcardSet()

  function submit(values: CardEditorValues, practice: boolean) {
    create.mutate(
      {
        title: values.title,
        ...(values.description ? { description: values.description } : {}),
        cards: values.cards.map(({ front, back }) => ({ front, back })),
      },
      {
        onSuccess: (deck) => {
          toast.success(t("created"))
          router.push(practice ? studyHref(deck.id) : deckHref(deck.id))
        },
      },
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col px-4 pt-2 pb-6 md:px-6 md:pt-4">
      <CardEditor
        mode="create"
        cancelHref="/flashcards/"
        isSubmitting={create.isPending}
        error={create.isError ? errorMessage(create.error) : undefined}
        onSubmit={submit}
      />
    </div>
  )
}

function EditDeck({ deck }: { deck: FlashcardSetDetail }) {
  const t = useT("flashcards.page")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const update = useUpdateFlashcardSet(deck.id)
  const save = useSaveFlashcardCards(deck.id)

  // The title and description go first, then the cards (the full ordered list: cards missing from it are deleted).
  async function submit(values: CardEditorValues, practice: boolean) {
    try {
      if (values.title !== deck.title || values.description !== (deck.description ?? "")) {
        await update.mutateAsync({ title: values.title, description: values.description })
      }
      await save.mutateAsync({ cards: values.cards })
    } catch {
      return
    }
    toast.success(t("saved"))
    router.push(practice ? studyHref(deck.id) : deckHref(deck.id))
  }

  const error = update.error ?? save.error
  return (
    <div className="flex min-w-0 flex-1 flex-col px-4 pt-2 pb-6 md:px-6 md:pt-4">
      <CardEditor
        mode="edit"
        key={deck.id}
        initialTitle={deck.title}
        initialDescription={deck.description ?? ""}
        initialRows={rowsFromSet(deck)}
        cancelHref={deckHref(deck.id)}
        isSubmitting={update.isPending || save.isPending}
        error={error ? errorMessage(error) : undefined}
        onSubmit={(values, practice) => void submit(values, practice)}
      />
    </div>
  )
}
