"use client"

import type { FlashcardSetDetail, StudyNext } from "@ihsp/api"
import { ShareDialog } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, PageContainer, StateView } from "@ihsp/ui"
import { IconEdit, IconPlayerPlay, IconShare, IconTrash } from "@tabler/icons-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useDeleteFlashcardSet, useFlashcardSet, useStudyNext } from "../hooks/use-flashcards"
import { SetSettingsForm } from "./set-settings-form"
import { SourceBadge } from "./source-badge"

function Counts({ study, set }: { study: StudyNext | undefined; set: FlashcardSetDetail }) {
  const t = useT("flashcards.set")
  const counts = study?.counts ?? { learning: 0, review: set.due_today, new: set.new_today }
  const items = [
    { key: "learning", value: counts.learning },
    { key: "review", value: counts.review },
    { key: "new", value: counts.new },
  ] as const
  return (
    <dl className="grid grid-cols-3 gap-3" aria-label={t("countsLabel")}>
      {items.map((item) => (
        <div key={item.key} className="bg-card rounded-xl border p-3 text-center">
          <dd className="text-2xl font-bold">{item.value}</dd>
          <dt className="text-muted-foreground text-xs">{t(`counts.${item.key}`)}</dt>
        </div>
      ))}
    </dl>
  )
}

/** `/flashcards/set/?id=`: counts, Study, Edit, Share, daily limits and the card list. */
export function FlashcardSetPage() {
  const t = useT("flashcards.set")
  const router = useRouter()
  const id = useSearchParams().get("id")
  const set = useFlashcardSet(id)
  const study = useStudyNext(id)
  const remove = useDeleteFlashcardSet()
  const [shareOpen, setShareOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (id === null)
    return (
      <PageContainer title={t("title")}>
        <StateView state="empty" emptyText={t("missing")} />
      </PageContainer>
    )
  if (set.isPending)
    return (
      <PageContainer title={t("title")}>
        <StateView state="loading" rows={4} />
      </PageContainer>
    )
  if (set.isError) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="error" error={set.error} onRetry={() => void set.refetch()} />
      </PageContainer>
    )
  }

  const detail = set.data
  const doneForToday = study.data?.done_for_today ?? false
  const query = `?id=${encodeURIComponent(detail.id)}`

  const actions = (
    <>
      <Link
        href={`/flashcards/study/${query}`}
        className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-4 text-sm font-medium"
      >
        <IconPlayerPlay className="size-4" aria-hidden />
        {t("study")}
      </Link>
      <Link
        href={`/flashcards/edit/${query}`}
        className="hover:bg-muted inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-4 text-sm font-medium"
      >
        <IconEdit className="size-4" aria-hidden />
        {t("edit")}
      </Link>
      <Button type="button" variant="outline" className="min-h-11" onClick={() => setShareOpen(true)}>
        <IconShare aria-hidden />
        {t("share")}
      </Button>
    </>
  )

  return (
    <PageContainer title={detail.title} description={detail.description ?? undefined} actions={actions}>
      <div className="flex flex-wrap items-center gap-2">
        <SourceBadge source={detail.source} />
        <span className="text-muted-foreground text-sm">{t("cardCount", { count: detail.card_count })}</span>
      </div>
      <Counts study={study.data} set={detail} />
      {doneForToday ? (
        <p role="status" className="bg-muted rounded-lg border px-3 py-2 text-sm">
          {t("doneForToday")}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("settings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <SetSettingsForm set={detail} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("cards")}</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.cards.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noCards")}</p>
          ) : (
            <ol className="flex flex-col gap-1 text-sm">
              {detail.cards.map((card) => (
                <li key={card.id} className="flex items-baseline gap-2 border-b py-1.5 last:border-b-0">
                  <span className="text-muted-foreground w-6 shrink-0 text-right text-xs">{card.position}</span>
                  <span className="min-w-0 truncate">{card.front}</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <div>
        <Button type="button" variant="destructive" className="min-h-11" onClick={() => setConfirmDelete(true)}>
          <IconTrash aria-hidden />
          {t("delete")}
        </Button>
      </div>

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} kind="flashcard_set" targetId={detail.id} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription", { title: detail.title })}
        confirmLabel={t("deleteConfirm")}
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(detail.id, {
            onSuccess: () => router.replace("/flashcards/"),
            onError: () => toast.error(t("deleteFailed")),
          })
        }
      />
    </PageContainer>
  )
}
