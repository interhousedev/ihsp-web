"use client"

import type { SuggestionCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, IconCheck, IconExternalLink, IconPlus, buttonVariants } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { useChatCommands } from "./chat-commands"

type SuggestionCardsProps = { cards: SuggestionCard[]; busy: boolean }

/** The cards of `admission_suggest`: one click on "Add" asks the assistant, which then shows the approval card. */
export function SuggestionCards({ cards, busy }: SuggestionCardsProps) {
  const t = useT("assistant.suggestion")
  const commands = useChatCommands()
  const [requested, setRequested] = useState<ReadonlySet<string>>(new Set())

  async function add(card: SuggestionCard) {
    if (!commands) return
    const key = `${card.type}:${card.id}`
    const sent = await commands.say(
      t("addPrompt", { type: t(`type.${card.type}`), title: card.title, kind: card.type, id: card.id }),
    )
    if (sent) setRequested((current) => new Set(current).add(key))
  }

  return (
    <ul className="flex flex-col gap-2" data-suggestion-cards>
      {cards.map((card) => {
        const done = requested.has(`${card.type}:${card.id}`)
        return (
          <li key={`${card.type}:${card.id}`} className="bg-card flex flex-col gap-2 rounded-xl border p-3">
            <p className="text-muted-foreground text-xs font-medium uppercase">{t(`type.${card.type}`)}</p>
            <p className="text-sm font-semibold break-words">{card.title}</p>
            {card.reason ? <p className="text-muted-foreground text-sm break-words">{card.reason}</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={done ? "secondary" : "default"}
                disabled={busy || done || !commands}
                onClick={() => void add(card)}
              >
                {done ? <IconCheck aria-hidden /> : <IconPlus aria-hidden />}
                {done ? t("requested") : t("add")}
              </Button>
              {card.link ? (
                <Link href={card.link} className={buttonVariants({ size: "sm", variant: "ghost" })}>
                  <IconExternalLink aria-hidden />
                  {t("open")}
                </Link>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
