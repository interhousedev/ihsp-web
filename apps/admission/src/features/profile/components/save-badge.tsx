"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Pill } from "@ihsp/ui"
import type { SaveState } from "../hooks/use-profile-answers"

/** "Saved", "Saving…" or "Not saved" with a retry; announced politely. */
export function SaveBadge({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const t = useT("profile")
  return (
    <span role="status" aria-live="polite" className="flex items-center gap-2">
      {state === "saving" ? <Pill>{t("saving")}</Pill> : null}
      {state === "saved" ? (
        <Pill tone="success">
          <Icons.check className="size-3" aria-hidden />
          {t("saved")}
        </Pill>
      ) : null}
      {state === "error" ? (
        <>
          <Pill tone="danger">{t("notSaved")}</Pill>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            {t("retry")}
          </Button>
        </>
      ) : null}
    </span>
  )
}
