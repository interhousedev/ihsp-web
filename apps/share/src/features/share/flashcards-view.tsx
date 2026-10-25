"use client"

import type { PublicShare } from "@ihsp/api"
import { useAuthStore } from "@ihsp/auth"
import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { Badge, Button, Markdown, buttonVariants } from "@ihsp/ui"
import { useState } from "react"
import { StudyMode } from "./study-mode"

type Cards = NonNullable<PublicShare["flashcards"]>["cards"]

/** A shared flash card set: the cards, **Study** in the browser, and **Copy to my decks** (opens the student app). */
export function FlashcardsView({ cards, slug }: { cards: Cards; slug: string }) {
  const t = useT("share.flashcards")
  const [studying, setStudying] = useState(false)
  // A visitor without a session lands on the login first: the label says so.
  const signedIn = useAuthStore((state) => state.user !== null)
  const copyUrl = `${getConfig().SP_URL}/flashcards/copy/?share=${encodeURIComponent(slug)}`

  if (studying) return <StudyMode cards={cards} onExit={() => setStudying(false)} />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{t("publicBanner")}</Badge>
        <span className="text-muted-foreground text-sm">{t("count", { count: cards.length })}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="min-h-11" disabled={cards.length === 0} onClick={() => setStudying(true)}>
          {t("study")}
        </Button>
        <a
          href={copyUrl}
          className={buttonVariants({
            variant: "outline",
            className: "min-h-11",
          })}
        >
          {signedIn ? t("copy") : t("copySignIn")}
        </a>
      </div>
      {cards.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
      ) : (
        <ol aria-label={t("cardsLabel")} className="flex flex-col gap-3">
          {cards.map((card, index) => (
            <li key={card.id} className="bg-card flex flex-col gap-3 rounded-xl border p-4 text-sm">
              <span className="text-muted-foreground text-xs font-medium">{t("cardN", { n: index + 1 })}</span>
              <div>
                <p className="text-muted-foreground text-xs">{t("front")}</p>
                <Markdown>{card.front}</Markdown>
              </div>
              <div className="border-t pt-3">
                <p className="text-muted-foreground text-xs">{t("back")}</p>
                <Markdown>{card.back}</Markdown>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
