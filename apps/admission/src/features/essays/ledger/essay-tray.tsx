"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import type { PointerEventHandler } from "react"
import type { EssaySummary } from "../api"
import { useEssayLabel } from "../components/supp-label"

/** Essay chips to drag onto the slots (a mouse or pen; a finger uses the buttons of the slot). Sticky at the foot of the detail. */
export function EssayTray({ essays, onPointerDown }: { essays: EssaySummary[]; onPointerDown: (id: string, title: string) => PointerEventHandler }) {
  const t = useT("essayLedger")
  const te = useT("essays")
  const { label } = useEssayLabel()
  if (essays.length === 0) return null
  return (
    <section aria-label={t("trayLabel")} className="bg-card border-hairline hidden shrink-0 flex-col gap-1.5 border-t px-4 py-3 md:flex" data-testid="essay-tray">
      <p className="text-muted-foreground text-xs font-medium">
        {t("trayLabel")} · {t("dragHint")}
      </p>
      <ul className="flex max-h-24 flex-wrap gap-2 overflow-y-auto [scrollbar-gutter:stable]">
        {essays.map((e) => (
          <li key={e.id}>
            <span
              onPointerDown={onPointerDown(e.id, label(e))}
              data-testid={`tray-${e.id}`}
              className="bg-background hover:bg-accent flex cursor-grab items-center gap-2 rounded-full border px-3 py-1.5 text-sm select-none active:cursor-grabbing"
            >
              <Icons.gripVertical aria-hidden className="text-muted-foreground size-3.5" />
              <span className="max-w-48 truncate font-medium">{label(e)}</span>
              <span className="text-muted-foreground text-xs">{te("words", { count: e.word_count })}</span>
              {e.uniqueness !== null ? <span className="text-xs font-semibold tabular-nums">{e.uniqueness}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
