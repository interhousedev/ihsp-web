"use client"

import type { StepContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, cn } from "@ihsp/ui"
import { diffBlocks, type DiffStatus } from "../utils/block-diff"
import { BlockView } from "./block-view"

const ROW_STYLE: Record<DiffStatus, string> = {
  same: "border-border",
  added: "border-emerald-500 bg-emerald-500/5",
  removed: "border-red-500 bg-red-500/5",
  changed: "border-amber-500 bg-amber-500/5",
}

const BADGE_VARIANT: Record<DiffStatus, "outline" | "default" | "destructive" | "secondary"> = {
  same: "outline",
  added: "default",
  removed: "destructive",
  changed: "secondary",
}

/**
 * Side by side, rendered: the left column is the live content, the right one the draft. Rows are blocks matched by
 * id; changed rows are highlighted. On phones the two columns stack.
 */
export function StepDiffView({
  live,
  draft,
  liveLabel,
  draftLabel,
}: {
  live: StepContent | null
  draft: StepContent
  liveLabel?: string
  draftLabel?: string
}) {
  const t = useT("diff")
  const rows = diffBlocks(live, draft)
  const titleChanged = live !== null && live.title !== draft.title
  return (
    <div className="flex flex-col gap-3" data-testid="step-diff">
      <div className="text-muted-foreground hidden grid-cols-2 gap-3 text-xs font-medium uppercase md:grid">
        <span>{liveLabel ?? t("live")}</span>
        <span>{draftLabel ?? t("draft")}</span>
      </div>
      {live === null ? <p className="text-muted-foreground text-sm">{t("newStep")}</p> : null}
      <div
        className={cn(
          "grid gap-3 rounded-md border-l-4 p-2 md:grid-cols-2",
          titleChanged ? ROW_STYLE.changed : ROW_STYLE.same,
        )}
      >
        <p className="text-sm font-semibold break-words">
          <span className="text-muted-foreground mb-1 block text-xs font-medium uppercase md:hidden">
            {liveLabel ?? t("live")}
          </span>
          {live?.title ?? "-"}
        </p>
        <p className="text-sm font-semibold break-words">
          <span className="text-muted-foreground mb-1 block text-xs font-medium uppercase md:hidden">
            {draftLabel ?? t("draft")}
          </span>
          {draft.title}
        </p>
      </div>
      {rows.map((row) => (
        <div
          key={row.id}
          data-status={row.status}
          className={cn("flex flex-col gap-2 rounded-md border-l-4 p-2", ROW_STYLE[row.status])}
        >
          <Badge variant={BADGE_VARIANT[row.status]} className="w-fit">
            {t(`status.${row.status}`)}
          </Badge>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <span className="text-muted-foreground mb-1 block text-xs font-medium uppercase md:hidden">
                {liveLabel ?? t("live")}
              </span>
              {row.live ? (
                <BlockView block={row.live} />
              ) : (
                <p className="text-muted-foreground text-sm italic">{t("absent")}</p>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-muted-foreground mb-1 block text-xs font-medium uppercase md:hidden">
                {draftLabel ?? t("draft")}
              </span>
              {row.draft ? (
                <BlockView block={row.draft} />
              ) : (
                <p className="text-muted-foreground text-sm italic">{t("absent")}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
