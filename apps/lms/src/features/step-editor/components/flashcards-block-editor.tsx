"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Textarea } from "@ihsp/ui"
import { moveItem, newCard, type FlashcardsBlock } from "../utils/content-ops"

/** The cards of a flash card block (LMS-18): front, back, reorder, remove. */
export function FlashcardsBlockEditor({
  block,
  keyOf,
  onChange,
}: {
  block: FlashcardsBlock
  keyOf: (id: string) => string
  onChange: (block: FlashcardsBlock) => void
}) {
  const t = useT("cardsBuilder")
  const update = (index: number, patch: Partial<FlashcardsBlock["cards"][number]>) =>
    onChange({
      ...block,
      cards: block.cards.map((card, i) => (i === index ? { ...card, ...patch } : card)),
    })
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {block.cards.map((card, index) => (
          <li key={keyOf(card.id)} className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">{t("card", { number: index + 1 })}</h4>
              <div className="flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === 0}
                  onClick={() =>
                    onChange({
                      ...block,
                      cards: moveItem(block.cards, index, index - 1),
                    })
                  }
                  aria-label={t("moveUp", { number: index + 1 })}
                  className="size-11 md:size-8"
                >
                  <Icons.chevronUp aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === block.cards.length - 1}
                  onClick={() =>
                    onChange({
                      ...block,
                      cards: moveItem(block.cards, index, index + 1),
                    })
                  }
                  aria-label={t("moveDown", { number: index + 1 })}
                  className="size-11 md:size-8"
                >
                  <Icons.chevronDown aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    onChange({
                      ...block,
                      cards: block.cards.filter((_, i) => i !== index),
                    })
                  }
                  aria-label={t("remove", { number: index + 1 })}
                  className="size-11 md:size-8"
                >
                  <Icons.trash aria-hidden />
                </Button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Textarea
                value={card.front}
                onChange={(event) => update(index, { front: event.target.value })}
                aria-label={t("front", { number: index + 1 })}
                placeholder={t("frontPlaceholder")}
                rows={2}
              />
              <Textarea
                value={card.back}
                onChange={(event) => update(index, { back: event.target.value })}
                aria-label={t("back", { number: index + 1 })}
                placeholder={t("backPlaceholder")}
                rows={2}
              />
            </div>
          </li>
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange({ ...block, cards: [...block.cards, newCard()] })}
        className="w-fit min-h-11 md:min-h-7"
      >
        <Icons.add aria-hidden />
        {t("addCard")}
      </Button>
    </div>
  )
}
