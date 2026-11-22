"use client"

import { useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons } from "@ihsp/ui"
import { useState } from "react"
import { useDeleteEssay, type EssaySummary } from "../api"

/** Essays whose sealed text can no longer be opened: only deleting them is possible. */
export function UnreadableEssays({ essays }: { essays: EssaySummary[] }) {
  const t = useT("essayLedger")
  const del = useDeleteEssay()
  const [target, setTarget] = useState<string | null>(null)
  if (essays.length === 0) return null
  return (
    <section
      className="border-destructive/40 m-3 flex flex-col gap-2 rounded-lg border p-3"
      data-testid="unreadable-essays"
    >
      <p className="text-sm font-medium">{t("unreadableTitle")}</p>
      <p className="text-muted-foreground text-sm">{t("unreadableText")}</p>
      <ul className="flex flex-col gap-2">
        {essays.map((essay) => (
          <li key={essay.id} className="flex items-center justify-between gap-2" data-testid="unreadable-essay">
            <span className="flex items-center gap-2 text-sm">
              <Icons.warning aria-hidden className="size-4" />
              {t("unreadableItem")}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => setTarget(essay.id)}>
              {t("unreadableDelete")}
            </Button>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={t("unreadableConfirmTitle")}
        description={t("unreadableConfirmText")}
        confirmLabel={t("unreadableDelete")}
        destructive
        loading={del.isPending}
        onConfirm={() => {
          if (target) del.mutate(target, { onSettled: () => setTarget(null) })
        }}
      />
    </section>
  )
}
