"use client"

import { useT } from "@ihsp/i18n"
import { cn, Pill } from "@ihsp/ui"
import type { Slot } from "../api"

export const slotId = (s: { task: string; name: string }) => `${s.task}/${s.name}`

/** The editable slots; the chosen one is highlighted. */
export function SlotList({
  slots,
  selected,
  onSelect,
}: {
  slots: Slot[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  const t = useT("promptStudio")
  return (
    <ul className="flex flex-col gap-2" aria-label={t("slots")}>
      {slots.map((s) => (
        <li key={slotId(s)}>
          <button
            type="button"
            aria-pressed={selected === slotId(s)}
            onClick={() => onSelect(slotId(s))}
            className={cn(
              "border-hairline hover:bg-muted/40 flex w-full flex-col gap-1 rounded-card border p-3 text-left transition-colors",
              selected === slotId(s) && "bg-muted/60 border-primary",
            )}
          >
            <span className="font-medium">{s.name}</span>
            <span className="text-muted-foreground text-xs">{s.summary}</span>
            <span className="flex gap-2">
              <Pill tone="neutral">{s.task}</Pill>
              <Pill tone={s.active_version > 0 ? "primary" : "neutral"}>
                {s.active_version > 0 ? t("versionLabel", { version: s.active_version }) : t("builtin")}
              </Pill>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
