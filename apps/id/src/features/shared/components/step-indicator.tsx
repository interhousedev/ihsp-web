"use client"

import { useTr } from "../hooks/use-tr"

/** "Step 2 of 3" with a segmented bar (registration, reclaim, activation). */
export function StepIndicator({ current, total }: { current: number; total: number }) {
  const t = useTr()
  return (
    <div className="grid gap-1.5">
      <p className="text-muted-foreground text-xs font-medium uppercase">{t("idCommon.step", { current, total })}</p>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className={`h-1 flex-1 rounded-full ${index < current ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
    </div>
  )
}
