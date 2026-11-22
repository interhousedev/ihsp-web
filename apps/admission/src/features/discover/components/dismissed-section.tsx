"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { toast } from "sonner"
import { useDismissed, useUndoDecision } from "../hooks"

/** Colleges marked "Not my vibe"; Return clears the decision so the college comes back to the deck. */
export function DismissedSection() {
  const t = useT("discover")
  const errorMessage = useErrorMessage()
  const dismissed = useDismissed()
  const undo = useUndoDecision()
  const items = dismissed.data?.items ?? []
  if (items.length === 0) return null
  return (
    <section aria-labelledby="dismissed-title" className="mx-auto flex w-full max-w-md flex-col gap-2">
      <div>
        <h2 id="dismissed-title" className="text-base font-semibold">
          {t("dismissed.title")}
        </h2>
        <p className="text-muted-foreground text-xs">{t("dismissed.text")}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((match) => (
          <li
            key={match.university_id}
            className="border-hairline-strong flex items-center justify-between gap-3 rounded-lg border p-2 ps-3"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{match.name}</span>
              <span className="text-muted-foreground block truncate text-xs">
                {[match.city, match.country].filter(Boolean).join(", ")}
              </span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={undo.isPending}
              aria-label={t("dismissed.returnLabel", { name: match.name })}
              onClick={() => undo.mutate(match.university_id, { onError: (error) => toast.error(errorMessage(error)) })}
            >
              {t("dismissed.return")}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
