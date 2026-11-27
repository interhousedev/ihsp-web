"use client"

import { BADGE_ICONS, BADGE_SHAPES } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Input, Label, Textarea } from "@ihsp/ui"
import { PLATFORM_EVENTS, type Design, type Labels, type PlatformEvent } from "../api"
import { BadgeMedal, ICON_COMPONENTS } from "./badge-medal"

export const LOCALES = ["ru", "uz", "en"] as const
export const COLORS = ["#64748b", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e"] as const
const SELECT_CLASS =
  "border-input bg-background h-9 min-h-11 w-full rounded-lg border px-2 text-sm md:min-h-9 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"

export type BadgeDraft = {
  name: Labels
  description: Labels
  design: Design
  event: PlatformEvent
  count: number
}

export const EMPTY_DRAFT: BadgeDraft = {
  name: { ru: "", uz: "", en: "" },
  description: { ru: "", uz: "", en: "" },
  design: { icon: "star", shape: "circle", color: COLORS[1] },
  event: "level_reached",
  count: 5,
}

export const draftValid = (d: BadgeDraft) => LOCALES.every((l) => (d.name[l] ?? "").trim() !== "") && d.count >= 1

/** The rule (when) and the look of a platform badge: names in three languages, event, threshold, icon, shape, colour. */
export function BadgeForm({
  draft,
  onChange,
  countRange,
}: {
  draft: BadgeDraft
  onChange: (draft: BadgeDraft) => void
  countRange: { min: number; max: number }
}) {
  const t = useT("lmsBadges")
  const set = (change: Partial<BadgeDraft>) => onChange({ ...draft, ...change })
  const setDesign = (change: Partial<Design>) => set({ design: { ...draft.design, ...change } })
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="badge-event">{t("rule.event")}</Label>
            <select
              id="badge-event"
              className={SELECT_CLASS}
              value={draft.event}
              onChange={(event) => set({ event: event.target.value as PlatformEvent })}
            >
              {PLATFORM_EVENTS.map((e) => (
                <option key={e} value={e}>
                  {t(`rule.events.${e}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="badge-count">{t(`rule.count.${draft.event}`)}</Label>
            <Input
              id="badge-count"
              type="number"
              min={countRange.min}
              max={countRange.max}
              value={draft.count}
              onChange={(event) =>
                set({
                  count: Math.min(
                    countRange.max,
                    Math.max(countRange.min, Number(event.target.value) || countRange.min),
                  ),
                })
              }
            />
          </div>
        </div>
        {LOCALES.map((l) => (
          <div key={l} className="grid gap-1.5 rounded-lg border p-3">
            <Label htmlFor={`badge-name-${l}`}>
              {t("look.name")} · {l.toUpperCase()}
            </Label>
            <Input
              id={`badge-name-${l}`}
              value={draft.name[l] ?? ""}
              onChange={(event) => set({ name: { ...draft.name, [l]: event.target.value } })}
            />
            <Label htmlFor={`badge-desc-${l}`}>
              {t("look.descriptionLabel")} · {l.toUpperCase()}
            </Label>
            <Textarea
              id={`badge-desc-${l}`}
              rows={2}
              value={draft.description[l] ?? ""}
              onChange={(event) => set({ description: { ...draft.description, [l]: event.target.value } })}
            />
          </div>
        ))}
        <div className="grid gap-1.5">
          <Label>{t("look.icon")}</Label>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={t("look.icon")}>
            {BADGE_ICONS.map((key) => {
              const Glyph = ICON_COMPONENTS[key]
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={draft.design.icon === key}
                  aria-label={key}
                  onClick={() => setDesign({ icon: key })}
                  className={`focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-lg border focus-visible:ring-[3px] focus-visible:outline-none ${draft.design.icon === key ? "border-primary bg-primary/10" : ""}`}
                >
                  <Glyph size={20} />
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="badge-shape">{t("look.shape")}</Label>
          <select
            id="badge-shape"
            className={`${SELECT_CLASS} sm:max-w-xs`}
            value={draft.design.shape}
            onChange={(event) => setDesign({ shape: event.target.value as Design["shape"] })}
          >
            {BADGE_SHAPES.map((s) => (
              <option key={s} value={s}>
                {t(`look.shapes.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label>{t("look.color")}</Label>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={t("look.color")}>
            {COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                role="radio"
                aria-checked={draft.design.color === hex}
                aria-label={hex}
                onClick={() => setDesign({ color: hex })}
                className="focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full focus-visible:ring-[3px] focus-visible:outline-none"
              >
                <span
                  className={`size-8 rounded-full ${draft.design.color === hex ? "ring-foreground ring-2 ring-offset-2" : ""}`}
                  style={{ backgroundColor: hex }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex h-fit flex-col items-center gap-2 rounded-card border p-4 text-center">
        <BadgeMedal design={draft.design} size={80} />
        <p className="font-semibold">{draft.name.ru || "—"}</p>
        <p className="text-muted-foreground text-xs">{draft.description.ru}</p>
      </div>
    </div>
  )
}
