"use client"

import { Button } from "@ihsp/ui"
import { useTr } from "../hooks/use-tr"
import { ErrorAlert } from "./error-alert"
import { FlowCard } from "./flow-card"

/** A card for a page whose first request failed, with **Try again**. */
export function RequestFailed({ title, error, onRetry }: { title: string; error: unknown; onRetry: () => void }) {
  const t = useTr()
  return (
    <FlowCard title={title}>
      <ErrorAlert error={error} />
      <Button type="button" variant="outline" className="h-11" onClick={onRetry}>
        {t("common.retry")}
      </Button>
    </FlowCard>
  )
}
