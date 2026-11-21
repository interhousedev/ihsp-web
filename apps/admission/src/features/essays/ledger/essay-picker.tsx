"use client"

import { useT } from "@ihsp/i18n"
import { cn, Pill, ResponsiveDialog } from "@ihsp/ui"
import type { EssaySummary } from "../api"
import { useEssayLabel } from "../components/supp-label"
import type { MatchSlot } from "../flow/steps-api"
import { blocker } from "./slot-model"

/** Every essay of the student for one slot, with words against the limit and the score; the ones that cannot go there are disabled with the reason. */
export function EssayPicker({
  slot,
  title,
  essays,
  currentId,
  onClose,
  onChoose,
}: {
  slot: MatchSlot | undefined
  title: string
  essays: EssaySummary[]
  currentId: string | null
  onClose: () => void
  onChoose: (essay: EssaySummary) => void
}) {
  const t = useT("essayLedger")
  const te = useT("essays")
  const { label } = useEssayLabel()
  return (
    <ResponsiveDialog open={slot !== undefined} onOpenChange={(open) => !open && onClose()} title={title} description={slot?.prompt ?? undefined}>
      {slot ? (
        <ul className="flex flex-col gap-2" data-testid="essay-picker">
          {essays.map((e) => {
            const why = blocker(slot, e)
            return (
              <li key={e.id}>
                <button
                  type="button"
                  disabled={why !== null}
                  onClick={() => onChoose(e)}
                  className={cn(
                    "bg-card hover:bg-accent focus-visible:ring-ring flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md border p-3 text-left text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-card",
                    e.id === currentId && "border-primary",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{label(e)}</span>
                    <span className="text-muted-foreground block text-xs">
                      {slot.word_limit !== null ? te("wordsOf", { count: e.word_count, limit: slot.word_limit }) : te("words", { count: e.word_count })}
                      {why === "over" ? ` · ${t("overBy", { count: e.word_count - (slot.word_limit ?? 0) })}` : ""}
                      {why === "kind" ? ` · ${t("needsPersonal")}` : ""}
                    </span>
                  </span>
                  {e.uniqueness !== null ? <Pill tone="neutral">{e.uniqueness}</Pill> : null}
                </button>
              </li>
            )
          })}
          {essays.length === 0 ? <li className="text-muted-foreground text-sm">{t("noEssays")}</li> : null}
        </ul>
      ) : null}
    </ResponsiveDialog>
  )
}
