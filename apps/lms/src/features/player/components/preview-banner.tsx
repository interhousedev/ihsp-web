"use client"

import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Icons } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"

/** The "Preview" notice above the lesson shown to course staff, with the way back to the editor. */
export function PreviewBanner({ backHref }: { backHref: string }) {
  const t = useT("player")
  return (
    <Alert role="status" data-testid="preview-banner" className="mx-4 mt-4 w-auto md:mx-6">
      <Icons.info aria-hidden />
      <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span>
          <strong>{t("previewBanner")}</strong>
        </span>
        <LinkButton href={backHref} size="sm" variant="outline" className="min-h-11 md:min-h-7">
          <Icons.chevronLeft aria-hidden />
          {t("backToEditor")}
        </LinkButton>
      </AlertDescription>
    </Alert>
  )
}
