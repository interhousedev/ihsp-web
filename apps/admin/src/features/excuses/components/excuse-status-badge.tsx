import { useT } from "@ihsp/i18n"
import { StatusBadge } from "@ihsp/ui"
import { STATUS_TONE } from "../utils/excuse-labels"

export function ExcuseStatusBadge({ status }: { status: string }) {
  const t = useT("excuses.status")
  return <StatusBadge tone={STATUS_TONE[status] ?? "neutral"} label={t.has(status) ? t(status) : status} />
}
