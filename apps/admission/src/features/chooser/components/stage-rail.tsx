"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons } from "@ihsp/ui"
import type { Stage, StageId } from "../flow"

/**
 * The thin rail of the three stages: survey, matching, list. A done stage shows a check, the open one is filled, a
 * locked one (first run only) says why. The page owns the state; this draws it.
 */
export function StageRail({
  stages,
  open,
  onSelect,
}: {
  stages: readonly Stage[]
  open: StageId
  onSelect: (id: StageId) => void
}) {
  const t = useT("uniFlow")
  return (
    <nav aria-label={t("label")}>
      <ol className="flex items-center gap-1.5">
        {stages.map((stage, index) => {
          const current = stage.id === open
          return (
            <li key={stage.id} className="flex min-w-0 flex-1 items-center gap-1.5">
              <button
                type="button"
                disabled={stage.locked}
                aria-current={current ? "step" : undefined}
                title={stage.locked ? t(`lockedWhy.${stage.id === "match" ? "match" : "list"}`) : undefined}
                onClick={() => onSelect(stage.id)}
                className={cn(
                  "flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border px-2 text-sm font-medium sm:gap-2 sm:px-3 md:min-h-9",
                  current && "border-primary bg-primary text-primary-foreground",
                  !current && !stage.locked && "hover:bg-muted",
                  stage.locked && "text-muted-foreground cursor-not-allowed opacity-60",
                )}
              >
                <span aria-hidden className="flex size-5 shrink-0 items-center justify-center text-xs">
                  {stage.locked ? (
                    <Icons.lock className="size-3.5" />
                  ) : stage.done && !current ? (
                    <Icons.check className="text-success size-4" />
                  ) : (
                    stage.number
                  )}
                </span>
                <span className="truncate max-sm:hidden">{t(`stages.${stage.id}`)}</span>
                <span className="truncate sm:hidden">{t(`stagesShort.${stage.id}`)}</span>
                {stage.locked ? <span className="sr-only">{t("locked")}</span> : null}
              </button>
              {index < stages.length - 1 ? (
                <span aria-hidden className="bg-border h-px w-3 shrink-0 max-sm:hidden" />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
