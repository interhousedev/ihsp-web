"use client"

import type { PlanSlide } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, IconArrowDown, IconArrowUp, IconButton, IconPlus, IconTrash, IconX, Input } from "@ihsp/ui"

export type SlideChange =
  | { kind: "title"; text: string }
  | { kind: "bullet"; bullet: number; text: string }
  | { kind: "addBullet" }
  | { kind: "removeBullet"; bullet: number }
  | { kind: "move"; by: -1 | 1 }
  | { kind: "remove" }

type PlanSlideEditorProps = {
  slide: PlanSlide
  /** 1-based number shown before the title. */
  number: number
  count: number
  readOnly: boolean
  onChange: (change: SlideChange) => void
}

/** One numbered slide of the outline: its title and bullets as fields, move and delete buttons. */
export function PlanSlideEditor({ slide, number, count, readOnly, onChange }: PlanSlideEditorProps) {
  const t = useT("notebooks.plan")

  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3" data-slide={number}>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-6 shrink-0 text-sm tabular-nums">{number}.</span>
        <Input
          value={slide.title}
          readOnly={readOnly}
          aria-label={t("slideTitle", { n: number })}
          maxLength={120}
          className="font-medium"
          onChange={(event) => onChange({ kind: "title", text: event.target.value })}
        />
        {readOnly ? null : (
          <div className="flex shrink-0">
            <IconButton
              size="sm"
              icon={IconArrowUp}
              aria-label={t("moveUp", { n: number })}
              disabled={number === 1}
              onClick={() => onChange({ kind: "move", by: -1 })}
            />
            <IconButton
              size="sm"
              icon={IconArrowDown}
              aria-label={t("moveDown", { n: number })}
              disabled={number === count}
              onClick={() => onChange({ kind: "move", by: 1 })}
            />
            <IconButton
              size="sm"
              icon={IconTrash}
              aria-label={t("remove", { n: number })}
              onClick={() => onChange({ kind: "remove" })}
            />
          </div>
        )}
      </div>
      <ul className="flex flex-col gap-1.5 ps-8">
        {slide.bullets.map((bullet, index) => (
          // Bullets have no ids: the position is their identity while the slide is edited.
          <li key={index} className="flex items-center gap-1.5">
            <span className="text-muted-foreground" aria-hidden>
              •
            </span>
            <Input
              value={bullet}
              readOnly={readOnly}
              aria-label={t("bullet", { n: index + 1, slide: number })}
              maxLength={300}
              className="h-8 text-sm"
              onChange={(event) => onChange({ kind: "bullet", bullet: index, text: event.target.value })}
            />
            {readOnly ? null : (
              <IconButton
                size="sm"
                icon={IconX}
                aria-label={t("removeBullet")}
                onClick={() => onChange({ kind: "removeBullet", bullet: index })}
              />
            )}
          </li>
        ))}
      </ul>
      {readOnly || slide.bullets.length >= 8 ? null : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ms-8 self-start"
          onClick={() => onChange({ kind: "addBullet" })}
        >
          <IconPlus aria-hidden />
          {t("addBullet")}
        </Button>
      )}
    </li>
  )
}
