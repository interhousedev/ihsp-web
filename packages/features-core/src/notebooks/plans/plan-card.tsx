"use client"

import type { PresentationPlan } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconChevronRight, IconPresentation } from "@ihsp/ui"
import { useState } from "react"
import { PlanSheet } from "./plan-sheet"
import { usePresentationPlan } from "./use-presentation-plan"

/** The plan in the chat (PLAN): "<title> · N-slide outline"; it opens the side panel with the outline. */
export function PlanCard({ notebookId, plan: created }: { notebookId: string; plan: PresentationPlan }) {
  const t = useT("notebooks.plan")
  // The panel edits the cached copy; the card follows it (title, slide count, confirmed).
  const plan = usePresentationPlan(notebookId, created.id).data ?? created
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-card hover:bg-muted flex min-h-11 w-full items-center gap-3 rounded-xl border p-3 text-start"
      >
        <IconPresentation className="text-primary size-5 shrink-0" aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">
            {t("card", { title: plan.title, count: plan.slides.length })}
          </span>
          <span className="text-muted-foreground text-xs">
            {plan.status === "confirmed" ? t("confirmed") : t("open")}
          </span>
        </span>
        <IconChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
      </button>
      <PlanSheet notebookId={notebookId} planId={plan.id} open={open} onOpenChange={setOpen} />
    </>
  )
}
