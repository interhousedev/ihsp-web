"use client"

import { usePreferences, useUpdatePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Switch } from "@ihsp/ui"
import { allTodayCards, moveCard, type TodayCardId } from "../../today/utils/today-cards"

/** Show, hide and reorder the Today cards (WEB-3, UF-WEB-17 step 3). Every change is saved at once. */
export function TodayCardsEditor() {
  const t = useT("settings.today")
  const preferences = usePreferences()
  const update = useUpdatePreferences()
  if (!preferences) return null

  const cards = allTodayCards(preferences.today_cards)
  const visible: TodayCardId[] = cards.filter((card) => card.visible).map((card) => card.id)

  function save(next: TodayCardId[]) {
    update.mutate({ today_cards: next })
  }

  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {cards.map((card) => {
        const index = visible.indexOf(card.id)
        const name = t(`cards.${card.id}`)
        return (
          <li key={card.id} className="flex min-h-14 items-center gap-2 px-3">
            <Switch
              checked={card.visible}
              aria-label={t("show", { card: name })}
              onCheckedChange={(on) => save(on ? [...visible, card.id] : visible.filter((id) => id !== card.id))}
            />
            <span className="min-w-0 flex-1 text-sm font-medium">{name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 md:size-8"
              disabled={!card.visible || index <= 0}
              aria-label={t("moveUp", { card: name })}
              onClick={() => save(moveCard(visible, index, -1))}
            >
              <Icons.chevronUp aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 md:size-8"
              disabled={!card.visible || index === visible.length - 1}
              aria-label={t("moveDown", { card: name })}
              onClick={() => save(moveCard(visible, index, 1))}
            >
              <Icons.chevronDown aria-hidden />
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
