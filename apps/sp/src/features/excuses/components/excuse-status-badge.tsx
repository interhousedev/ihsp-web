"use client"

import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { isKnownStatus, statusVariant } from "../utils/excuse-labels"

/** Status of an excuse; a status this build does not know is shown as sent. */
export function ExcuseStatusBadge({ status }: { status: string }) {
  const t = useT("excuses")
  return <Badge variant={statusVariant(status)}>{isKnownStatus(status) ? t(`status.${status}`) : status}</Badge>
}
