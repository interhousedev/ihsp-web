"use client"

import type { FlashcardSetItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import Link from "next/link"
import { deckHref, studyHref } from "../../flashcards/utils/hrefs"
import { useFlashcardSets } from "../../flashcards/hooks/use-flashcards"
import { QueryState } from "../../shared/components/query-state"
import { LinkButton } from "../../shared/components/link-button"
import { decksForSubject } from "../utils/matching-decks"
import { newDeckHref } from "../utils/hrefs"
import { PageSection } from "./page-section"

function DeckRow({ deck }: { deck: FlashcardSetItem }) {
  const t = useT("exams.decks")
  return (
    <li className="flex min-h-11 items-center gap-3 rounded-lg border p-2" data-testid="exam-deck">
      <div className="min-w-0 flex-1">
        <Link href={deckHref(deck.id)} className="block truncate text-sm font-medium hover:underline">
          {deck.title}
        </Link>
        <p className="text-muted-foreground text-xs">
          {[t("cards", { count: deck.card_count }), deck.due_today > 0 ? t("due", { count: deck.due_today }) : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <LinkButton href={studyHref(deck.id)} className="shrink-0" aria-label={t("practiceItem", { title: deck.title })}>
        {t("practice")}
      </LinkButton>
    </li>
  )
}

/**
 * "Your decks" for the subject of a control, with a button to start a new one. The API has no link between a deck and
 * a subject, so a deck belongs to the subject when its title contains the subject's name or short name.
 */
export function ExamDecks({ subject }: { subject: { name: string; short_name: string } }) {
  const t = useT("exams.decks")
  const decks = useFlashcardSets()
  return (
    <PageSection
      title={t("title")}
      hint={t("hint")}
      action={
        <LinkButton href={newDeckHref(t("newTitle", { subject: subject.name }))} variant="default">
          {t("create")}
        </LinkButton>
      }
    >
      <QueryState query={decks} rows={2}>
        {(all) => {
          const matching = decksForSubject(all, subject)
          return matching.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {matching.map((deck) => (
                <DeckRow key={deck.id} deck={deck} />
              ))}
            </ul>
          )
        }}
      </QueryState>
    </PageSection>
  )
}
