"use client"

import { useT } from "@ihsp/i18n"

/** The school certificate serial, or the reason the certificate rule cannot be checked. */
export function SerialNote({ serial }: { serial: string | null }) {
  const t = useT("honours.serial")
  return (
    <p className="text-muted-foreground text-sm" data-testid="honours-serial">
      {serial === null ? t("missing") : t("known", { serial })}
    </p>
  )
}
