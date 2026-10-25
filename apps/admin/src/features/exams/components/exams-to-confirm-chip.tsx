"use client"

import { useT } from "@ihsp/i18n"
import { Badge, Button, Icons } from "@ihsp/ui"
import { TOUCH } from "../../shared/utils/touch"

/**
 * How many dates wait for confirmation, as a quick filter: pressed, the list shows only those (the `tentative`
 * status). With nothing to confirm it is plain text.
 */
export function ExamsToConfirmChip({
  count,
  active,
  onToggle,
}: {
  count: number
  active: boolean
  onToggle: () => void
}) {
  const t = useT("exams")
  if (count === 0 && !active) return <p className="text-muted-foreground text-sm">{t("nothingToConfirm")}</p>
  return (
    <div>
      <Button
        type="button"
        variant={active ? "default" : "outline"}
        className={TOUCH}
        aria-pressed={active}
        title={t("toConfirmHint")}
        onClick={onToggle}
      >
        <Icons.alertCircle aria-hidden />
        {t("toConfirm", { count })}
        {active ? <Icons.close aria-hidden /> : <Badge variant="secondary">{count}</Badge>}
      </Button>
    </div>
  )
}
