"use client"

import { useT } from "@ihsp/i18n"
import { Icons, StateView } from "@ihsp/ui"
import { LinkButton } from "./link-button"

/** Shown when the user lacks the permission a page needs (editor pages check `my_permissions`). */
export function AccessDenied({ backHref }: { backHref?: string }) {
  const t = useT("common")
  return (
    <div className="px-4 pt-4 md:px-6">
      <StateView
        state="error"
        role="alert"
        icon={<Icons.lock aria-hidden />}
        title={t("noAccessTitle")}
        description={t("noAccessDescription")}
        action={
          backHref ? (
            <LinkButton href={backHref} variant="outline" className="min-h-11 md:min-h-8">
              {t("back")}
            </LinkButton>
          ) : undefined
        }
      />
    </div>
  )
}
